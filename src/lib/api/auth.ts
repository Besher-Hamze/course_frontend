import { apiClient } from '../utils/api-client';
import { LoginDto, AuthResponse } from '@/types/auth';

export const authApi = {
  login: (credentials: LoginDto) => 
    apiClient.post<AuthResponse>('auth/login', credentials),
};
