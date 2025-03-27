import { apiClient, uploadFile } from '../utils/api-client';
import { File, CreateFileDto, UpdateFileDto } from '@/types/file';

export const fileApi = {
  getAll: (token: string) => 
    apiClient.get<File[]>('files', { token }),
  
  getById: (id: string, token: string) => 
    apiClient.get<File>(`files/${id}`, { token }),
  
  getByCourse: (courseId: string, token: string) => 
    apiClient.get<File[]>(`files/by-course/${courseId}`, { token }),
  
  create: (fileData: CreateFileDto, token: string) => {
    const formData = new FormData();
    formData.append('title', fileData.title);
    if (fileData.description) {
      formData.append('description', fileData.description);
    }
    formData.append('course', fileData.course);
    
    if (fileData.file && fileData.file.length > 0) {
      formData.append('file', fileData.file[0]);
    }
    
    return uploadFile('files', formData, token);
  },
  
  update: (id: string, fileData: UpdateFileDto, token: string) => {
    // For updates without file
    if (!fileData.file || fileData.file.length === 0) {
      const { file, ...rest } = fileData;
      return apiClient.patch<File>(`files/${id}`, rest, { token });
    }
    
    // For updates with file
    const formData = new FormData();
    if (fileData.title) formData.append('title', fileData.title);
    if (fileData.description) formData.append('description', fileData.description);
    if (fileData.course) formData.append('course', fileData.course);
    formData.append('file', fileData.file[0]);
    
    return uploadFile(`files/${id}`, formData, token);
  },
  
  delete: (id: string, token: string) => 
    apiClient.delete<File>(`files/${id}`, { token }),
};

