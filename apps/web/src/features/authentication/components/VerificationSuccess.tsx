import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";

export const VerificationSuccess = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[420px] px-4 animate-fade-in-up">
      {/* Icon Success */}
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b7152b] mb-8">
        <Check size={32} strokeWidth={3} />
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 mb-5 text-center">
        Kích hoạt tài khoản thành công
      </h1>

      {/* Description */}
      <p className="text-zinc-500 text-sm leading-relaxed text-center mb-10 max-w-sm">
        Chào mừng bạn đến với KujiLingo. Tài khoản của bạn đã sẵn sàng để bắt đầu hành trình chinh phục JLPT với kỷ luật thép.
      </p>

      {/* Action Buttons */}
      <div className="w-full">
        <Link href="/login" className="w-full">
          <Button className="w-full h-12">Đăng nhập ngay</Button>
        </Link>
      </div>
    </div>
  );
};
