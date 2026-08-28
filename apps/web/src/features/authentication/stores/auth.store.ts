import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_premium: boolean;
  jlpt_target_level?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string, deviceName?: string) => Promise<boolean>;
  register: (payload: {
    email: string;
    password: string;
    password_confirmation: string;
    display_name: string;
    accepted_terms: boolean;
    jlpt_target_level?: string;
  }) => Promise<{ success: boolean; code?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message?: string; code?: string }>;
  logout: () => void;
  clearError: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password, deviceName) => {
        set({ isLoading: true, error: null });
        const safeDeviceName = (deviceName || 'Web Browser').slice(0, 100);
        const targetUrl = `${API_URL}/auth/login`;
        console.log('Fetching login endpoint:', targetUrl);
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              device_name: safeDeviceName,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            const errorMessage = data.error?.message || 'Login failed. Please check your credentials.';
            set({ error: errorMessage, isLoading: false });
            return false;
          }

          if (data.success && data.data) {
            set({
              user: data.data.user,
              accessToken: data.data.access_token,
              refreshToken: data.data.refresh_token,
              error: null,
              isLoading: false,
            });
            return true;
          } else {
            set({ error: 'Unexpected response format.', isLoading: false });
            return false;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unable to connect to the authentication server.';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },
        
      register: async (payload) => {
        set({ isLoading: true, error: null });
        const targetUrl = `${API_URL}/auth/register`;
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (response.status === 201) {
            set({ isLoading: false });
            return { success: true, code: data.code };
          } else {
            let errorMessage = 'Registration failed.';
            if (data.code === 'REGISTER_DUPLICATE_EMAIL') {
              errorMessage = 'An account with this email already exists.';
            } else if (data.code === 'REGISTER_INTERNAL_SERVER_ERROR') {
              errorMessage = 'An unexpected error occurred. Please try again later.';
            } else if (data.error?.message) {
              errorMessage = data.error.message;
            }
            set({ error: errorMessage, isLoading: false });
            return { success: false, code: data.code };
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unable to connect to the server.';
          set({ error: errorMessage, isLoading: false });
          return { success: false };
        }
      },

      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        const targetUrl = `${API_URL}/auth/verify-email`;
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
          const data = await response.json();
          if (response.ok) {
            set({ isLoading: false });
            return { success: true, message: data.message };
          } else {
            const errorMessage = data.error?.message || data.code || 'Email verification failed.';
            set({ error: errorMessage, isLoading: false });
            return { success: false, code: data.error?.code || data.code, message: errorMessage };
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unable to connect to the server.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      },

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, error: null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
