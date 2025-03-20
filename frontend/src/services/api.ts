import axios, { AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for handling cookies/sessions
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth token here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

interface RegisterData {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  isAuthenticated: boolean;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  redirect: string;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  user: User | null;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
    return api.post('/auth/login', { username, password });
  },

  logout: (): Promise<AxiosResponse> => {
    return api.post('/auth/logout');
  },

  getCurrentUser: (): Promise<AxiosResponse<AuthResponse>> => {
    return api.get('/auth/user');
  },

  register: (username: string, password: string): Promise<AxiosResponse> => {
    return api.post('/auth/register', { username, password });
  }
};

// User API
export const userAPI = {
  getUsers: () =>
    api.get('/users'),
  getUser: (id: number) =>
    api.get(`/users/${id}`),
  createUser: (data: any) =>
    api.post('/users', data),
  updateUser: (id: number, data: any) =>
    api.put(`/users/${id}`, data),
  deleteUser: (id: number) =>
    api.delete(`/users/${id}`),
};

// Add more API endpoints as needed based on your backend routes 