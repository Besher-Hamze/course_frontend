import { apiClient } from '../utils/api-client';
import { Course, CreateCourseRequest, CreateCourseResponse, UpdateCourseDto, CourseWithEnrollmentCount } from '@/types/course';

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

  // Teacher-only: returns { course, codes }
  create: (course: CreateCourseRequest, token: string) =>
    apiClient.post<CreateCourseResponse>('courses', course, { token }),

  // Teacher-only: my courses with enrollment counts
  getMineWithCounts: (token: string) =>
    apiClient.get<CourseWithEnrollmentCount[]>('courses/mine/with-counts', { token }),

  update: (id: string, course: UpdateCourseDto, token: string) =>
    apiClient.patch<Course>(`courses/${id}`, course, { token }),

  delete: (id: string, token: string) =>
    apiClient.delete<Course>(`courses/${id}`, { token }),
};
