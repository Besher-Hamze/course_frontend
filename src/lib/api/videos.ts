import { ApiResponse } from '@/types/api';
import { apiClient, uploadFile } from '../utils/api-client';
import { Video, CreateVideoDto, UpdateVideoDto } from '@/types/video';

// Enhanced upload options interface
interface EnhancedUploadOptions {
  onProgress?: (progress: number, uploadedChunks: number, totalChunks: number) => void;
  onSpeed?: (bytesPerSecond: number, timeRemaining: number) => void;
  onChunkUpload?: (chunkIndex: number, totalChunks: number) => void;
  onError?: (error: Error) => void;
  chunkSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  useResumable?: boolean; // Flag to enable/disable resumable uploads
}

// Upload session storage interface
interface StoredUploadSession {
  sessionId: string;
  fileName: string;
  fileSize: number;
  metadata: CreateVideoDto;
  timestamp: number;
}

class EnhancedResumableUploader {
  private baseUrl: string;
  private abortController: AbortController | null = null;
  private uploadStartTime: number = 0;
  private lastProgressTime: number = 0;
  private lastUploadedBytes: number = 0;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');
  }

  // Save upload session to localStorage for resuming later
  private saveUploadSession(sessionId: string, fileName: string, fileSize: number, metadata: CreateVideoDto) {
    const session: StoredUploadSession = {
      sessionId,
      fileName,
      fileSize,
      metadata,
      timestamp: Date.now()
    };
    localStorage.setItem(`upload_session_${sessionId}`, JSON.stringify(session));
  }

  // Load upload session from localStorage
  private loadUploadSession(sessionId: string): StoredUploadSession | null {
    try {
      const stored = localStorage.getItem(`upload_session_${sessionId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Remove upload session from localStorage
  private removeUploadSession(sessionId: string) {
    localStorage.removeItem(`upload_session_${sessionId}`);
  }

  // Get all stored upload sessions
  getSavedUploadSessions(): StoredUploadSession[] {
    const sessions: StoredUploadSession[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('upload_session_')) {
        try {
          const session = localStorage.getItem(key);
          if (session) {
            sessions.push(JSON.parse(session));
          }
        } catch {
          // Invalid session data, remove it
          localStorage.removeItem(key);
        }
      }
    }
    return sessions.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Calculate upload speed and time remaining
  private calculateSpeedAndTime(uploadedBytes: number, fileSize: number, onSpeed?: (bytesPerSecond: number, timeRemaining: number) => void) {
    const now = Date.now();
    if (this.lastProgressTime === 0) {
      this.lastProgressTime = now;
      this.lastUploadedBytes = uploadedBytes;
      return;
    }

    const timeDiff = (now - this.lastProgressTime) / 1000; // seconds
    const bytesDiff = uploadedBytes - this.lastUploadedBytes;

    if (timeDiff >= 1) { // Update every second
      const speed = bytesDiff / timeDiff;
      const remainingBytes = fileSize - uploadedBytes;
      const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

      if (onSpeed) {
        onSpeed(speed, timeRemaining);
      }

      this.lastProgressTime = now;
      this.lastUploadedBytes = uploadedBytes;
    }
  }

  // Enhanced resumable upload
  async uploadWithResumable(
    file: File,
    metadata: CreateVideoDto,
    token: string,
    options: EnhancedUploadOptions = {}
  ): Promise<ApiResponse<Video>> {
    const {
      onProgress,
      onSpeed,
      onChunkUpload,
      onError,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    this.abortController = new AbortController();
    this.uploadStartTime = Date.now();
    this.lastProgressTime = 0;
    this.lastUploadedBytes = 0;

    try {
      // Step 1: Initialize upload session
      const initResponse = await fetch(`${this.baseUrl}/videos/upload/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
        signal: this.abortController.signal,
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.message || 'Failed to initialize upload');
      }

      const { sessionId, chunkSize, totalChunks } = await initResponse.json();

      // Save session for resuming later
      this.saveUploadSession(sessionId, file.name, file.size, metadata);

      console.log(`Upload session initialized: ${sessionId}, chunks: ${totalChunks}`);

      // Step 2: Upload chunks
      await this.uploadChunks(file, sessionId, chunkSize, totalChunks, token, {
        onProgress: (progress, uploadedChunks) => {
          const uploadedBytes = Math.round((progress / 100) * file.size);
          this.calculateSpeedAndTime(uploadedBytes, file.size, onSpeed);

          if (onProgress) {
            onProgress(progress, uploadedChunks, totalChunks);
          }
        },
        onChunkUpload,
        onError,
        maxRetries,
        retryDelay,
      });

      // Step 3: Complete upload
      const completeResponse = await fetch(`${this.baseUrl}/videos/upload/complete/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(metadata),
        signal: this.abortController.signal,
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.message || 'Failed to complete upload');
      }

      const result = await completeResponse.json();

      // Remove saved session on success
      this.removeUploadSession(sessionId);

      return { data: result.video };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (onError) {
        onError(new Error(errorMessage));
      }
      return { error: errorMessage };
    }
  }

  // Resume existing upload
  async resumeUpload(
    sessionId: string,
    file: File,
    token: string,
    options: EnhancedUploadOptions = {}
  ): Promise<ApiResponse<Video>> {
    const {
      onProgress,
      onSpeed,
      onChunkUpload,
      onError,
      maxRetries = 3,
      retryDelay = 1000
    } = options;

    this.abortController = new AbortController();
    this.uploadStartTime = Date.now();
    this.lastProgressTime = 0;
    this.lastUploadedBytes = 0;

    try {
      // Get current upload status
      const statusResponse = await fetch(`${this.baseUrl}/videos/upload/status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: this.abortController.signal,
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to get upload status');
      }

      const status = await statusResponse.json();
      console.log(`Resuming upload: ${status.progress}% complete`);

      if (status.progress === 100) {
        throw new Error('Upload is already complete');
      }

      // Calculate chunk size from status
      const chunkSize = Math.ceil(status.totalSize / status.totalChunks);

      // Resume uploading missing chunks
      await this.uploadChunks(file, sessionId, chunkSize, status.totalChunks, token, {
        onProgress: (progress, uploadedChunks) => {
          const uploadedBytes = Math.round((progress / 100) * file.size);
          this.calculateSpeedAndTime(uploadedBytes, file.size, onSpeed);

          if (onProgress) {
            onProgress(progress, uploadedChunks, status.totalChunks);
          }
        },
        onChunkUpload,
        onError,
        maxRetries,
        retryDelay,
        resumeFromStatus: status,
      });

      // Get saved metadata and complete upload
      const savedSession = this.loadUploadSession(sessionId);
      if (!savedSession) {
        throw new Error('No saved session metadata found');
      }

      const completeResponse = await fetch(`${this.baseUrl}/videos/upload/complete/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(savedSession.metadata),
        signal: this.abortController.signal,
      });

      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        throw new Error(error.message || 'Failed to complete upload');
      }

      const result = await completeResponse.json();

      // Remove saved session on success
      this.removeUploadSession(sessionId);

      return { data: result.video };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Resume failed';
      if (onError) {
        onError(new Error(errorMessage));
      }
      return { error: errorMessage };
    }
  }

  // Upload chunks with retry logic
  private async uploadChunks(
    file: File,
    sessionId: string,
    chunkSize: number,
    totalChunks: number,
    token: string,
    options: {
      onProgress?: (progress: number, uploadedChunks: number) => void;
      onChunkUpload?: (chunkIndex: number, totalChunks: number) => void;
      onError?: (error: Error) => void;
      maxRetries: number;
      retryDelay: number;
      resumeFromStatus?: any;
    }
  ) {
    const { onProgress, onChunkUpload, maxRetries, retryDelay, resumeFromStatus } = options;

    // Determine which chunks to upload
    let chunksToUpload: number[];
    if (resumeFromStatus) {
      chunksToUpload = resumeFromStatus.missingChunks;
      console.log(`Resuming upload: ${chunksToUpload.length} chunks remaining`);
    } else {
      chunksToUpload = Array.from({ length: totalChunks }, (_, i) => i);
    }

    let uploadedCount = resumeFromStatus ? resumeFromStatus.uploadedChunks : 0;

    // Upload chunks with controlled concurrency
    const concurrency = 2; // Limit concurrent uploads to prevent overwhelming the server

    for (let i = 0; i < chunksToUpload.length; i += concurrency) {
      const batch = chunksToUpload.slice(i, i + concurrency);

      const batchPromises = batch.map(async (chunkIndex) => {
        await this.uploadChunkWithRetry(
          file,
          sessionId,
          chunkIndex,
          chunkSize,
          totalChunks,
          token,
          maxRetries,
          retryDelay
        );

        uploadedCount++;
        const progress = (uploadedCount / totalChunks) * 100;

        if (onChunkUpload) {
          onChunkUpload(chunkIndex, totalChunks);
        }

        if (onProgress) {
          onProgress(progress, uploadedCount);
        }
      });

      await Promise.all(batchPromises);

      // Check if upload was cancelled
      if (this.abortController?.signal.aborted) {
        throw new Error('Upload cancelled');
      }
    }
  }

  // Upload single chunk with retry
  private async uploadChunkWithRetry(
    file: File,
    sessionId: string,
    chunkIndex: number,
    chunkSize: number,
    totalChunks: number,
    token: string,
    maxRetries: number,
    retryDelay: number
  ) {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (this.abortController?.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        await this.uploadSingleChunk(file, sessionId, chunkIndex, chunkSize, totalChunks, token);
        return; // Success
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries && !this.abortController?.signal.aborted) {
          console.warn(`Chunk ${chunkIndex} upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to upload chunk ${chunkIndex} after ${maxRetries + 1} attempts`);
  }

  // Upload single chunk
  private async uploadSingleChunk(
    file: File,
    sessionId: string,
    chunkIndex: number,
    chunkSize: number,
    totalChunks: number,
    token: string
  ) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    const response = await fetch(`${this.baseUrl}/videos/upload/chunk/${sessionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to upload chunk ${chunkIndex}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(`Chunk upload failed: ${result.message || 'Unknown error'}`);
    }
  }

  // Cancel upload
  async cancelUpload(sessionId?: string, token?: string) {
    // Cancel current request
    if (this.abortController) {
      this.abortController.abort();
    }

    // Cancel server-side session if sessionId provided
    if (sessionId && token) {
      try {
        await fetch(`${this.baseUrl}/videos/upload/cancel/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Remove saved session
        this.removeUploadSession(sessionId);
      } catch (error) {
        console.warn('Failed to cancel server-side session:', error);
      }
    }
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Enhanced video API with resumable upload support
export const videoApi = {
  // Existing methods
  getAll: (token: string) =>
    apiClient.get<Video[]>('videos', { token }),

  getById: (id: string, token: string) =>
    apiClient.get<Video>(`videos/${id}`, { token }),

  getByCourse: (courseId: string, token: string) =>
    apiClient.get<Video[]>(`videos/by-course/${courseId}`, { token }),

  update: (id: string, videoData: UpdateVideoDto, token: string, onProgress?: (progress: number) => void) => {
    // For updates without file
    if (!videoData.file || videoData.file.length === 0) {
      const { file, ...rest } = videoData;
      return apiClient.patch<Video>(`videos/${id}`, rest, { token });
    }

    // For updates with file - use traditional upload for now
    const formData = new FormData();
    if (videoData.title) formData.append('title', videoData.title);
    if (videoData.description) formData.append('description', videoData.description);
    if (videoData.course) formData.append('course', videoData.course);
    if (videoData.duration) formData.append('duration', videoData.duration.toString());
    if (videoData.order) formData.append('order', videoData.order.toString());
    formData.append('file', videoData.file[0]);

    return onProgress
      ? uploadFileWithProgress(`videos/${id}`, formData, token, onProgress)
      : uploadFile(`videos/${id}`, formData, token);
  },

  delete: (id: string, token: string) =>
    apiClient.delete<Video>(`videos/${id}`, { token }),

  // Enhanced create method with resumable upload support
  create: (
    videoData: CreateVideoDto,
    token: string,
    options: EnhancedUploadOptions = {}
  ): Promise<ApiResponse<Video>> => {
    const { useResumable = true, ...uploadOptions } = options;

    // Use resumable upload for large files or when explicitly requested
    if (useResumable && videoData.file && videoData.file.length > 0) {
      const file = videoData.file[0];

      // Use resumable upload for files larger than 50MB or when explicitly requested
      if (file.size > 50 * 1024 * 1024 || useResumable) {
        const uploader = new EnhancedResumableUploader();
        return uploader.uploadWithResumable(file, videoData, token, uploadOptions);
      }
    }

    // Fall back to traditional upload for smaller files
    const formData = new FormData();
    formData.append('title', videoData.title);
    if (videoData.description) {
      formData.append('description', videoData.description);
    }
    formData.append('course', videoData.course);
    if (videoData.duration) {
      formData.append('duration', videoData.duration.toString());
    }
    if (videoData.order) {
      formData.append('order', videoData.order.toString());
    }

    if (videoData.file && videoData.file.length > 0) {
      formData.append('file', videoData.file[0]);
    }

    return uploadOptions.onProgress
      ? uploadFileWithProgress('videos', formData, token, (progress: number) => uploadOptions.onProgress?.(progress, 0, 0))
      : uploadFile('videos', formData, token);
  },

  // New methods for resumable upload management
  resumableUploader: new EnhancedResumableUploader(),

  getSavedUploadSessions: () => {
    const uploader = new EnhancedResumableUploader();
    return uploader.getSavedUploadSessions();
  },

  resumeUpload: (sessionId: string, file: File, token: string, options: EnhancedUploadOptions = {}) => {
    const uploader = new EnhancedResumableUploader();
    return uploader.resumeUpload(sessionId, file, token, options);
  },

  cancelUpload: (sessionId: string, token: string) => {
    const uploader = new EnhancedResumableUploader();
    return uploader.cancelUpload(sessionId, token);
  },
};

// Keep the existing uploadFileWithProgress function for backward compatibility
const uploadFileWithProgress = (
  endpoint: string,
  formData: FormData,
  token: string,
  onProgress: (progress: number) => void
): Promise<ApiResponse<any>> => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response });
        } catch (error) {
          resolve({ data: xhr.responseText });
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          resolve({ error: errorData.message || 'Upload failed' });
        } catch (error) {
          resolve({ error: 'Upload failed' });
        }
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ error: 'Network error occurred' });
    });

    xhr.addEventListener('abort', () => {
      resolve({ error: 'Upload was aborted' });
    });

    // Enhanced timeout settings
    xhr.timeout = 0; // No timeout for uploads

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    xhr.open('POST', `${baseUrl}/${endpoint}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};