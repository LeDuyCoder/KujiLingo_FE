export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export const validateRegisterForm = (data: RegisterFormData) => {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim() === "") {
    errors.fullName = "Full Name is required";
  }

  if (!data.email || data.email.trim() === "") {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email format";
  }

  if (!data.password || data.password.trim() === "") {
    errors.password = "Password is required";
  } else if (data.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (!data.confirmPassword || data.confirmPassword.trim() === "") {
    errors.confirmPassword = "Confirm Password is required";
  } else if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = "You must accept the Terms of Service and Privacy Policy";
  }

  return errors;
};
