import React from "react";
import { Award } from "lucide-react";

export const metadata = {
  title: "Thành tích | KujiLingo",
};

export default function AchievementsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm animate-fade-in-up">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b7152b] mb-6">
        <Award size={32} />
      </div>
      <h1 className="text-2xl font-extrabold text-zinc-950 mb-3">Thành tích học tập</h1>
      <p className="text-zinc-500 max-w-md">Theo dõi các cột mốc đã vượt qua và nhận huy hiệu danh giá trên con đường chinh phục tiếng Nhật.</p>
    </div>
  );
}
