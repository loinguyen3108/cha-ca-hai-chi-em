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

interface Product {
  id: number;
  name: string;
  unit_price: number;
  stock_quantity: number;
}

interface Customer {
  id: number;
  name: string;
}

// Auth API
export const authAPI = {
  login: (username: string, password: string): Promise<AxiosResponse<LoginResponse>> => {
    return api.post('/api/v1/auth/login', { username, password });
  },

  logout: (): Promise<AxiosResponse> => {
    return api.post('/api/v1/auth/logout');
  },

  getCurrentUser: (): Promise<AxiosResponse<AuthResponse>> => {
    return api.get('/api/v1/auth/user');
  },

  getProducts: (): Promise<AxiosResponse<Product[]>> => {
    return api.get('/api/v1/products'); // Ensure this matches the backend route
  },

  register: (username: string, password: string): Promise<AxiosResponse> => {
    return api.post('/api/v1/auth/register', { username, password });
  },

  getDashboardStats: (): Promise<AxiosResponse> => {
    return api.get('/api/v1/dashboard/stats');
  },

  importProducts: (data: { 
    import_lines: { productId: number; quantity: number; unit_price: number; total_line_price: number }[]; 
    import_date: string; 
    other_expenses: number; 
  }): Promise<AxiosResponse> => {
    return api.post('/api/v1/product/import', data); // Ensure this matches the backend route
  },

  getCustomers: (): Promise<AxiosResponse<Customer[]>> => {
    return api.get('/api/v1/customers'); // Ensure this matches the backend route
  },
};

// User API
export const userAPI = {
  getUsers: () =>
    api.get('/api/v1/users'),
  getUser: (id: number) =>
    api.get(`/api/v1/users/${id}`),
  createUser: (data: any) =>
    api.post('/api/v1/users', data),
  updateUser: (id: number, data: any) =>
    api.put(`/api/v1/users/${id}`, data),
  deleteUser: (id: number) =>
    api.delete(`/api/v1/users/${id}`),
};

// Add more API endpoints as needed based on your backend routes 

// Add this function to the existing exports in the api.ts file
export const customerAPI = {
  getCustomers: (): Promise<AxiosResponse<Customer[]>> => {
    return api.get('/api/v1/customers'); // Ensure this matches the backend route
  },
}; 