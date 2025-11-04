import { apiClient } from '../utils/api-client';
import { Enrollment, CreateEnrollmentDto, UpdateEnrollmentDto } from '@/types/enrollment';

export const enrollmentApi = {
  getAll: (token: string) =>
    apiClient.get<Enrollment[]>('enrollments', { token }),

  getById: (id: string, token: string) =>
    apiClient.get<Enrollment>(`enrollments/${id}`, { token }),

  getByStudent: (token: string) =>
    apiClient.get<Enrollment[]>('enrollments/by-student', { token }),

  getByCourse: (courseId: string, token: string) =>
    apiClient.get<Enrollment[]>(`enrollments/by-course/${courseId}`, { token }),

  create: (enrollment: CreateEnrollmentDto, token: string) =>
    apiClient.post<Enrollment>('enrollments', enrollment, { token }),

  // Student: redeem a code and create enrollment
  redeem: (code: string, token: string) =>
    apiClient.post<Enrollment>('enrollments/redeem', { code }, { token }),

  update: (id: string, enrollment: UpdateEnrollmentDto, token: string) =>
    apiClient.patch<Enrollment>(`enrollments/${id}`, enrollment, { token }),

  delete: (id: string, token: string) =>
    apiClient.delete<Enrollment>(`enrollments/${id}`, { token }),
};
