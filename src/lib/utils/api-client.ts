// src/lib/utils/api-client.ts
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3050';

interface FetchOptions extends RequestInit {
    token?: string;
    params?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

interface UploadProgressCallback {
    (progress: number): void;
}

interface EnhancedUploadOptions extends FetchOptions {
    onProgress?: UploadProgressCallback;
    onUploadStart?: () => void;
    onUploadComplete?: () => void;
    onUploadError?: (error: Error) => void;
    maxFileSize?: number;
    allowedTypes?: string[];
}

// Enhanced client function with retry logic and better error handling
async function client<T>(
    endpoint: string,
    { token, params, timeout = 30000, retries = 0, retryDelay = 1000, ...customConfig }: FetchOptions = {}
): Promise<ApiResponse<T>> {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    } as HeadersInit;

    if (token) {
        (headers as any).Authorization = `Bearer ${token}`;
    }

    let url = `${API_BASE_URL}/${endpoint}`;

    // Add query parameters if they exist
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url = `${url}?${queryString}`;
        }
    }

    const config: RequestInit = {
        method: customConfig.method || 'GET',
        headers,
        ...customConfig,
    };

    // Handle timeout for non-upload requests
    if (timeout > 0 && !endpoint.includes('upload')) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        config.signal = controller.signal;

        // Clear timeout if request completes
        const originalSignal = config.signal;
        config.signal = new AbortController().signal;
        if (originalSignal) {
            originalSignal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                (config.signal as any).abort();
            });
        }
    }

    // If the body is FormData, don't stringify it and remove the Content-Type header
    // so the browser can set it with the boundary
    if (customConfig.body instanceof FormData) {
        delete (config.headers as Record<string, string>)['Content-Type'];
    } else if (customConfig.body && typeof customConfig.body === 'object') {
        config.body = JSON.stringify(customConfig.body);
    }

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, config);

            // Handle different response types
            let data;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType && contentType.includes('text/')) {
                data = await response.text();
            } else {
                // For binary responses or other types
                data = await response.blob();
            }

            if (!response.ok) {
                const errorMessage = typeof data === 'object' && data.message
                    ? data.message
                    : typeof data === 'string'
                        ? data
                        : `HTTP ${response.status}: ${response.statusText}`;

                // Don't retry on client errors (4xx), only on server errors (5xx) or network issues
                if (response.status >= 400 && response.status < 500) {
                    return { error: errorMessage };
                }

                throw new Error(errorMessage);
            }

            return { data };
        } catch (error) {
            const isLastAttempt = attempt === retries;

            if (isLastAttempt) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'An unknown error occurred';
                return { error: errorMessage };
            }

            // Wait before retrying
            if (retryDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
            }
        }
    }

    return { error: 'Max retries exceeded' };
}

// Enhanced file validation
function validateFile(file: File, options: { maxFileSize?: number; allowedTypes?: string[] } = {}): string | null {
    const { maxFileSize = 10 * 1024 * 1024 * 1024, allowedTypes } = options; // 10GB default

    // Check file size
    if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return `File size exceeds maximum allowed size of ${maxSizeMB}MB`;
    }

    // Check file type if specified
    if (allowedTypes && allowedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const fileType = file.type.toLowerCase();

        const isValidExtension = allowedTypes.some(type =>
            type.toLowerCase() === fileExtension ||
            type.toLowerCase() === fileType
        );

        if (!isValidExtension) {
            return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
        }
    }

    return null;
}

// Enhanced upload function with progress tracking and validation
export async function uploadFileWithProgress(
    endpoint: string,
    formData: FormData,
    token?: string,
    options: EnhancedUploadOptions = {}
): Promise<ApiResponse<any>> {
    const {
        onProgress,
        onUploadStart,
        onUploadComplete,
        onUploadError,
        maxFileSize,
        allowedTypes,
        timeout = 0, // No timeout for uploads
        retries = 3,
        retryDelay = 2000,
        ...fetchOptions
    } = options;

    // Validate files in FormData if validation options are provided
    if (maxFileSize || allowedTypes) {
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                const validationError = validateFile(value, { maxFileSize, allowedTypes });
                if (validationError) {
                    const error = new Error(validationError);
                    if (onUploadError) onUploadError(error);
                    return { error: validationError };
                }
            }
        }
    }

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        let uploadStarted = false;

        // Upload progress tracking
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                if (!uploadStarted) {
                    uploadStarted = true;
                    if (onUploadStart) onUploadStart();
                }

                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (onProgress) onProgress(percentComplete);
            }
        });

        // Upload completion
        xhr.addEventListener('load', () => {
            if (onUploadComplete) onUploadComplete();

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve({ data: response });
                } catch (error) {
                    // If response is not JSON, return as text
                    resolve({ data: xhr.responseText });
                }
            } else {
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    const errorMessage = errorData.message || `Upload failed with status ${xhr.status}`;
                    const error = new Error(errorMessage);
                    if (onUploadError) onUploadError(error);
                    resolve({ error: errorMessage });
                } catch (error) {
                    const errorMessage = `Upload failed with status ${xhr.status}: ${xhr.statusText}`;
                    const uploadError = new Error(errorMessage);
                    if (onUploadError) onUploadError(uploadError);
                    resolve({ error: errorMessage });
                }
            }
        });

        // Network errors
        xhr.addEventListener('error', () => {
            const error = new Error('Network error occurred during upload');
            if (onUploadError) onUploadError(error);
            resolve({ error: 'Network error occurred during upload' });
        });

        // Upload aborted
        xhr.addEventListener('abort', () => {
            const error = new Error('Upload was aborted');
            if (onUploadError) onUploadError(error);
            resolve({ error: 'Upload was aborted' });
        });

        // Timeout handling (only if specified)
        if (timeout > 0) {
            xhr.timeout = timeout;
            xhr.addEventListener('timeout', () => {
                const error = new Error('Upload timed out');
                if (onUploadError) onUploadError(error);
                resolve({ error: 'Upload timed out' });
            });
        }

        // Enhanced request configuration
        const url = `${API_BASE_URL}/${endpoint}`;
        xhr.open('POST', url, true);

        // Set authorization header
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // Add custom headers from options
        if (fetchOptions.headers) {
            Object.entries(fetchOptions.headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    xhr.setRequestHeader(key, value);
                }
            });
        }

        // Start upload
        xhr.send(formData);
    });
}

// Standard API client with enhanced error handling
export const apiClient = {
    get: <T>(endpoint: string, options?: FetchOptions) =>
        client<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, data: any, options?: FetchOptions) =>
        client<T>(endpoint, { ...options, method: 'POST', body: data }),

    put: <T>(endpoint: string, data: any, options?: FetchOptions) =>
        client<T>(endpoint, { ...options, method: 'PUT', body: data }),

    patch: <T>(endpoint: string, data: any, options?: FetchOptions) =>
        client<T>(endpoint, { ...options, method: 'PATCH', body: data }),

    delete: <T>(endpoint: string, options?: FetchOptions) =>
        client<T>(endpoint, { ...options, method: 'DELETE' }),

    // Enhanced upload method
    upload: <T>(endpoint: string, formData: FormData, options?: EnhancedUploadOptions) =>
        uploadFileWithProgress(endpoint, formData, options?.token, options),
};

// Legacy upload function for backward compatibility
export async function uploadFile(
    endpoint: string,
    formData: FormData,
    token?: string
): Promise<ApiResponse<any>> {
    return uploadFileWithProgress(endpoint, formData, token);
}

// Utility functions for file handling
export const fileUtils = {
    // Format file size for display
    formatFileSize: (bytes: number): string => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    },

    // Validate file before upload
    validateFile,

    // Get file extension
    getFileExtension: (filename: string): string => {
        return '.' + filename.split('.').pop()?.toLowerCase() || '';
    },

    // Check if file is video
    isVideoFile: (file: File): boolean => {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.flv', '.wmv', '.m4v', '.3gp'];
        const extension = fileUtils.getFileExtension(file.name);
        return videoExtensions.includes(extension) || file.type.startsWith('video/');
    },

    // Create object URL for preview
    createPreviewUrl: (file: File): string => {
        return URL.createObjectURL(file);
    },

    // Revoke object URL
    revokePreviewUrl: (url: string): void => {
        URL.revokeObjectURL(url);
    },
};

// Network status monitoring
export const networkMonitor = {
    // Check if online
    isOnline: (): boolean => navigator.onLine,

    // Monitor connection status
    onStatusChange: (callback: (isOnline: boolean) => void): (() => void) => {
        const handleOnline = () => callback(true);
        const handleOffline = () => callback(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Return cleanup function
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    },

    // Estimate connection speed (simple ping test)
    estimateSpeed: async (): Promise<{ latency: number; speed: string }> => {
        try {
            const start = performance.now();
            await fetch(`${API_BASE_URL}/health`, { method: 'HEAD' });
            const latency = performance.now() - start;

            let speed = 'unknown';
            if (latency < 50) speed = 'fast';
            else if (latency < 150) speed = 'medium';
            else speed = 'slow';

            return { latency, speed };
        } catch (error) {
            return { latency: -1, speed: 'offline' };
        }
    },
};

// Enhanced error handling with retry suggestions
export const errorHandler = {
    // Parse API error response
    parseError: (error: any): { message: string; code?: string; suggestions: string[] } => {
        const suggestions: string[] = [];
        let message = 'An unknown error occurred';
        let code: string | undefined;

        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
        } else if (error && typeof error === 'object') {
            message = error.message || error.error || 'An error occurred';
            code = error.code;
        }

        // Add suggestions based on error type
        if (message.toLowerCase().includes('network')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Try again in a few moments');
        } else if (message.toLowerCase().includes('timeout')) {
            suggestions.push('Your connection may be slow');
            suggestions.push('Try uploading a smaller file');
            suggestions.push('Check your internet speed');
        } else if (message.toLowerCase().includes('file size')) {
            suggestions.push('Try compressing your video');
            suggestions.push('Use a different video format');
        } else if (message.toLowerCase().includes('unauthorized')) {
            suggestions.push('Please log in again');
            suggestions.push('Your session may have expired');
        }

        return { message, code, suggestions };
    },

    // Check if error is retryable
    isRetryable: (error: any): boolean => {
        const message = error?.message || error || '';
        const retryablePatterns = [
            'network',
            'timeout',
            'fetch',
            'connection',
            'server error',
            'internal error',
            '5'
        ];

        return retryablePatterns.some(pattern =>
            message.toLowerCase().includes(pattern.toLowerCase())
        );
    },
};

// Export enhanced types
export type { FetchOptions, EnhancedUploadOptions, UploadProgressCallback };