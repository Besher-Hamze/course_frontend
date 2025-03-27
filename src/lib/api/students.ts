import { apiClient } from '../utils/api-client';
import { Student, CreateStudentDto, UpdateStudentDto } from '@/types/student';

export const studentApi = {
  getAll: (token: string) => 
    apiClient.get<Student[]>('students', { token }),
  
  getById: (id: string, token: string) => 
    apiClient.get<Student>(`students/find/${id}`, { token }),
  
  getMyInfo: (token: string) => 
    apiClient.get<Student>('students/my-info', { token }),
  
  create: (student: CreateStudentDto) => 
    apiClient.post<Student>('students', student),
  
  update: (id: string, student: UpdateStudentDto, token: string) => 
    apiClient.patch<Student>(`students/${id}`, student, { token }),
  
  delete: (id: string, token: string) => 
    apiClient.delete<Student>(`students/${id}`, { token }),
};
