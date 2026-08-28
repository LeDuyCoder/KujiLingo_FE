import { AuthLayout, RegisterForm } from "@/features/authentication";

export const metadata = {
  title: "Register | KujiLingo",
  description: "Create your KujiLingo account and start learning Japanese today.",
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
