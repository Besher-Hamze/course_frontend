// src/lib/utils/api-client.ts
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
    token?: string;
    params?: Record<string, string | number | boolean | undefined>;
}

async function client<T>(
    endpoint: string,
    { token, params, ...customConfig }: FetchOptions = {}
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

    // If the body is FormData, don't stringify it and remove the Content-Type header
    // so the browser can set it with the boundary
    if (customConfig.body instanceof FormData) {
        delete (config.headers as Record<string, string>)['Content-Type'];
    } else if (customConfig.body && typeof customConfig.body === 'object') {
        config.body = JSON.stringify(customConfig.body);
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.message || 'An error occurred while fetching data',
            };
        }

        return { data };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
    }
}

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
};

// Helper function for handling file uploads
export async function uploadFile(
    endpoint: string,
    formData: FormData,
    token?: string
) {
    return client(endpoint, {
        method: 'POST',
        body: formData,
        token,
    });
}