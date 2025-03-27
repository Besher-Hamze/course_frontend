export interface Course {
  _id: string;
  name: string;
  description?: string;
  major: string;
  yearLevel: number;
  semester: number;
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
