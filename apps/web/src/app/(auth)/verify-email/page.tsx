import { Suspense } from "react";
import { AuthLayout, VerifyEmail } from "@/features/authentication";

export const metadata = {
  title: "Xác minh Email | KujiLingo",
  description: "Xác minh địa chỉ Email tài khoản KujiLingo.",
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 text-center">
            <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Đang tải...</h2>
          </div>
        }
      >
        <VerifyEmail />
      </Suspense>
    </AuthLayout>
  );
}
