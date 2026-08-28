import React from "react";
import { HelpCircle } from "lucide-react";

export const metadata = {
  title: "Trợ giúp | KujiLingo",
};

export default function HelpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm animate-fade-in-up">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b7152b] mb-6">
        <HelpCircle size={32} />
      </div>
      <h1 className="text-2xl font-extrabold text-zinc-950 mb-3">Trung tâm trợ giúp</h1>
      <p className="text-zinc-500 max-w-md">Liên hệ đội ngũ hỗ trợ KujiLingo hoặc tìm kiếm nhanh câu trả lời trong phần tài liệu hướng dẫn.</p>
    </div>
  );
}
