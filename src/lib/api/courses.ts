import { apiClient } from '../utils/api-client';
import { Course, CreateCourseDto, UpdateCourseDto } from '@/types/course';

export const courseApi = {
  getAll: (token: string) => 
    apiClient.get<Course[]>('courses', { token }),
  
  getById: (id: string, token: string) => 
    apiClient.get<Course>(`courses/${id}`, { token }),
  
  getByYearAndSemester: (year: number, semester: number, major: string, token: string) => 
    apiClient.get<Course[]>('courses/by-year-semester', { 
      token, 
      params: { year, semester, major } 
    }),
  
  create: (course: CreateCourseDto, token: string) => 
    apiClient.post<Course>('courses', course, { token }),
  
  update: (id: string, course: UpdateCourseDto, token: string) => 
    apiClient.patch<Course>(`courses/${id}`, course, { token }),
  
  delete: (id: string, token: string) => 
    apiClient.delete<Course>(`courses/${id}`, { token }),
};
