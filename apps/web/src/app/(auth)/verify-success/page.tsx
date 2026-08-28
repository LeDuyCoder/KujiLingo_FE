import { AuthLayout, VerificationSuccess } from "@/features/authentication";

export const metadata = {
  title: "Xác minh tài khoản | KujiLingo",
  description: "Xác minh tài khoản KujiLingo thành công.",
};

export default function VerificationSuccessPage() {
  return (
    <AuthLayout>
      <VerificationSuccess />
    </AuthLayout>
  );
}
