import { apiClient } from '../utils/api-client';
import { Teacher, CreateTeacherDto } from '@/types/teacher';

export const teacherApi = {
    getAll: (token: string) =>
        apiClient.get<Teacher[]>('teachers', { token }),

    create: (data: CreateTeacherDto, token: string) =>
        apiClient.post<Teacher>('teachers', data, { token }),

    activate: (id: string, token: string) =>
        apiClient.patch<Teacher>(`teachers/${id}/activate`, {}, { token }),

    deactivate: (id: string, token: string) =>
        apiClient.patch<Teacher>(`teachers/${id}/deactivate`, {}, { token }),
};

