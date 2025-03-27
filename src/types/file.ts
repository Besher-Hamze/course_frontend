import { Course } from "./course";

export interface File {
    _id: string;
    title: string;
    description?: string;
    filePath: string;
    course: string | Course;
    fileType: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFileDto {
    title: string;
    description?: string;
    course: string;
    file: FileList | null;
}

export interface UpdateFileDto extends Partial<Omit<CreateFileDto, 'file'>> {
    file?: FileList | null;
}

