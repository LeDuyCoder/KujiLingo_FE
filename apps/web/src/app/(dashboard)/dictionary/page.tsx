import React from "react";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Từ điển | KujiLingo",
};

export default function DictionaryPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm animate-fade-in-up">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b7152b] mb-6">
        <BookOpen size={32} />
      </div>
      <h1 className="text-2xl font-extrabold text-zinc-950 mb-3">Từ điển KujiLingo</h1>
      <p className="text-zinc-500 max-w-md">Tra cứu từ vựng tiếng Nhật, Hán tự và các mẫu ngữ pháp JLPT từ N5 đến N1.</p>
    </div>
  );
}
