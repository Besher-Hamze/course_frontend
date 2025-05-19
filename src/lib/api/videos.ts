import { ApiResponse } from '@/types/api';
import { apiClient, uploadFile } from '../utils/api-client';
import { Video, CreateVideoDto, UpdateVideoDto } from '@/types/video';

export const videoApi = {
  getAll: (token: string) =>
    apiClient.get<Video[]>('videos', { token }),

  getById: (id: string, token: string) =>
    apiClient.get<Video>(`videos/${id}`, { token }),

  getByCourse: (courseId: string, token: string) =>
    apiClient.get<Video[]>(`videos/by-course/${courseId}`, { token }),

  create: (videoData: CreateVideoDto, token: string, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    console.log(videoData);

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

    return onProgress
      ? uploadFileWithProgress('videos', formData, token, onProgress)
      : uploadFile('videos', formData, token);
  },

  update: (id: string, videoData: UpdateVideoDto, token: string, onProgress?: (progress: number) => void) => {
    // For updates without file
    if (!videoData.file || videoData.file.length === 0) {
      const { file, ...rest } = videoData;
      return apiClient.patch<Video>(`videos/${id}`, rest, { token });
    }

    // For updates with file
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
};

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

    // Get the API base URL from the environment or use a default
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    xhr.open('POST', `${baseUrl}/${endpoint}`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
