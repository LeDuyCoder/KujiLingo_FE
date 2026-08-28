"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useAuthStore } from "../stores/auth.store";

export const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  
  const { verifyEmail, clearError } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "error" | "idle">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear previous errors when unmounting or starting
    clearError();
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage("Không tìm thấy mã xác nhận (Token is missing). Vui lòng kiểm tra lại đường dẫn trong email của bạn.");
        }
        return;
      }

      setStatus("loading");
      const result = await verifyEmail(token);

      if (isMounted) {
        if (result.success) {
          // Redirect immediately to the verify-success page which has a beautiful UI
          router.replace("/verify-success");
        } else {
          setStatus("error");
          // Friendly error mapping based on backend code or message
          if (result.code === "TOKEN_ALREADY_USED") {
            setErrorMessage("Mã xác nhận này đã được sử dụng. Tài khoản của bạn có thể đã được kích hoạt thành công từ trước.");
          } else if (result.code === "TOKEN_EXPIRED") {
            setErrorMessage("Mã xác nhận này đã hết hạn. Vui lòng yêu cầu gửi lại email xác nhận.");
          } else if (result.code === "TOKEN_NOT_FOUND") {
            setErrorMessage("Mã xác nhận không hợp lệ hoặc không tồn tại.");
          } else {
            setErrorMessage(result.message || "Đã xảy ra lỗi trong quá trình xác nhận email. Vui lòng thử lại sau.");
          }
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 animate-fade-in-up text-center">
        <div className="w-12 h-12 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Đang xác minh...</h2>
        <p className="text-zinc-500 text-sm">Vui lòng chờ trong giây lát, chúng tôi đang kiểm tra mã xác nhận của bạn.</p>
      </div>
    );
  }

  // Error Status UI
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 animate-fade-in-up text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-600 mb-6">
        <AlertCircle size={32} strokeWidth={2.5} />
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 mb-3">
        Xác minh thất bại
      </h1>

      <p className="text-zinc-600 text-sm leading-relaxed mb-8 max-w-sm">
        {errorMessage}
      </p>

      <div className="w-full">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12">Trở về Đăng nhập</Button>
        </Link>
      </div>
    </div>
  );
};
