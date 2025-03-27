export interface Student {
    _id: string;
    universityId: string;
    fullName: string;
    password?: string;
    yearLevel: number;
    semester: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateStudentDto {
    universityId: string;
    fullName: string;
    password: string;
    yearLevel: number;
    semester: number;
  }
  
  export interface UpdateStudentDto extends Partial<CreateStudentDto> {}
  