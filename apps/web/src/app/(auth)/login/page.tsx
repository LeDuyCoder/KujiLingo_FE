import { AuthLayout, LoginForm } from "@/features/authentication";

export const metadata = {
  title: "Login | KujiLingo",
  description: "Sign in to your KujiLingo account to continue your learning journey.",
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}