export interface Course {
  _id: string;
  name: string;
  description?: string;
  major: string;
  yearLevel: number;
  semester: number;
  teacher?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
  major: string;
  yearLevel: number;
  semester: number;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> { }

// New types aligned with backend
export interface CreateCourseRequest extends CreateCourseDto {
  codeCount?: number;
}

export interface CreateCourseResponse {
  course: Course;
  codes: string[];
}

export interface CourseWithEnrollmentCount extends Course {
  enrollments: number;
}
