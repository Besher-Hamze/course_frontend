import { apiClient } from '../utils/api-client';
import { TeacherLoginDto, StudentLoginDto, TeacherAuthResponse, StudentAuthResponse } from '@/types/auth';

export const authApi = {
  teacherLogin: (credentials: TeacherLoginDto) =>
    apiClient.post<TeacherAuthResponse>('auth/teacher/login', credentials),

  studentLogin: (credentials: StudentLoginDto) =>
    apiClient.post<StudentAuthResponse>('auth/login', credentials),
};
