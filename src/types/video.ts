import { Course } from "./course";

export interface Video {
    _id: string;
    title: string;
    description?: string;
    filePath: string;
    course: string | Course;
    duration?: number;
    order?: number;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CreateVideoDto {
    title: string;
    description?: string;
    course: string;
    file: FileList | null;
    duration?: number;
    order?: number;
  }
  
  export interface UpdateVideoDto extends Partial<Omit<CreateVideoDto, 'file'>> {
    file?: FileList | null;
  }
  