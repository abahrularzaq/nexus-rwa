import axios from 'axios';
import type { ApiResponse } from '@nexus-rwa/shared';

// Instance terpusat — semua fetch lewat sini
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: tambah API key kalau ada
apiClient.interceptors.request.use((config) => {
  const apiKey = typeof window !== 'undefined'
    ? localStorage.getItem('nexus_api_key')
    : null;
  if (apiKey) config.headers['X-API-Key'] = apiKey;
  return config;
});

// Response interceptor: normalize error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 402 Payment Required
    if (error.response?.status === 402) {
      console.warn('X402 Payment Required:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Helper typed fetch
export async function apiFetch<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint);
  return response.data;
}