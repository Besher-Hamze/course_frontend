import { apiClient } from '../utils/api-client';
import { Code, GenerateCodesRequest, GenerateCodesResponse } from '@/types/code';

export const codesApi = {
    // Generate codes for a course (Owner only)
    generateForCourse: (courseId: string, body: GenerateCodesRequest, token: string) =>
        apiClient.post<GenerateCodesResponse>(`codes/courses/${courseId}/generate`, body, { token }),

    // Get active (unused) codes for a course (Owner only)
    getActiveCodes: (courseId: string, token: string) =>
        apiClient.get<Code[]>(`codes/courses/${courseId}/active`, { token }),

    // Get used codes for a course (Owner only)
    getUsedCodes: (courseId: string, token: string) =>
        apiClient.get<Code[]>(`codes/courses/${courseId}/used`, { token }),
};

