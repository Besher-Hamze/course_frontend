import { apiClient, uploadFile } from '../utils/api-client';
import { Video, CreateVideoDto, UpdateVideoDto } from '@/types/video';

export const videoApi = {
  getAll: (token: string) => 
    apiClient.get<Video[]>('videos', { token }),
  
  getById: (id: string, token: string) => 
    apiClient.get<Video>(`videos/${id}`, { token }),
  
  getByCourse: (courseId: string, token: string) => 
    apiClient.get<Video[]>(`videos/by-course/${courseId}`, { token }),
  
  create: (videoData: CreateVideoDto, token: string) => {
    const formData = new FormData();
    console.log(videoData);
    
    formData.append('title', videoData.title);
    if (videoData.description) {
      formData.append('description', videoData.description);
    }
    formData.append('course', videoData.course);
    if (videoData.duration) {
      formData.append('duration', videoData.duration.toString());
    }
    if (videoData.order) {
      formData.append('order', videoData.order.toString());
    }
    
    if (videoData.file && videoData.file.length > 0) {
      formData.append('file', videoData.file[0]);
    }
    
    return uploadFile('videos', formData, token);
  },
  
  update: (id: string, videoData: UpdateVideoDto, token: string) => {
    // For updates without file
    if (!videoData.file || videoData.file.length === 0) {
      const { file, ...rest } = videoData;
      return apiClient.patch<Video>(`videos/${id}`, rest, { token });
    }
    
    // For updates with file
    const formData = new FormData();
    if (videoData.title) formData.append('title', videoData.title);
    if (videoData.description) formData.append('description', videoData.description);
    if (videoData.course) formData.append('course', videoData.course);
    if (videoData.duration) formData.append('duration', videoData.duration.toString());
    if (videoData.order) formData.append('order', videoData.order.toString());
    formData.append('file', videoData.file[0]);
    
    return uploadFile(`videos/${id}`, formData, token);
  },
  
  delete: (id: string, token: string) => 
    apiClient.delete<Video>(`videos/${id}`, { token }),
};
