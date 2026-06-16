import axios from 'axios';
import type { ApiResponse } from '@/lib/shared';

// Instance terpusat — semua fetch lewat sini
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor intentionally does not attach browser-stored API keys.
// Developer keys are only used by explicit dashboard/dev flows; production user
// access should rely on short-lived sessions or httpOnly cookies.
apiClient.interceptors.request.use((config) => config);

// Response interceptor: normalize error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 402 Payment Required
    if (error.response?.status === 402) {
      console.warn('X402 Payment Required');
    }
    return Promise.reject(error);
  }
);

// Helper typed fetch
export async function apiFetch<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(endpoint);
  return response.data;
}