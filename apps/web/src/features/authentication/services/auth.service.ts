import { RegisterFormData } from "../schemas/register.schema";

export const authService = {
  login: async (_email: string, _password: string, _rememberMe: boolean) => {
    console.warn("Backend login is not implemented yet.");
    throw new Error("Sign In backend is not connected yet.");
  },
  register: async (data: RegisterFormData) => {
    // TODO: Connect to real backend API when available
    console.warn("Backend registration is not implemented yet. Form data:", data);
    throw new Error("Registration API is not connected yet.");
  },
  loginWithGoogle: async () => {
    console.warn("Google OAuth backend is not implemented yet.");
    throw new Error("Google OAuth backend is not implemented yet.");
  },
};
