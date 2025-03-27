import { Course } from "./course";
import { Student } from "./student";

export interface Enrollment {
    _id: string;
    student: string | Student;
    course: string | Course;
    enrollDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateEnrollmentDto {
    student: string;
    course: string;
    isActive?: boolean;
  }
  
  export interface UpdateEnrollmentDto extends Partial<CreateEnrollmentDto> {}
  