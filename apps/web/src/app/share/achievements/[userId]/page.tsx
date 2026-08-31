"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { 
  Award, 
  Trophy, 
  Zap, 
  Flame, 
  BookOpen, 
  ArrowRight,
  Loader2
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import Link from "next/link";

interface SharedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "STREAK" | "EXP" | "VOCAB_MASTER" | "QUIZ_PERFECT";
  unlocked_at: string;
}

interface ShowcaseResponse {
  user_id: string;
  display_name: string;
  items: SharedAchievement[];
  count: number;
}

export default function PublicShowcasePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params?.userId as string;
  const highlightId = searchParams?.get("highlight");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ShowcaseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Update document title dynamically
  useEffect(() => {
    if (data?.display_name) {
      document.title = `Thành tựu của ${data.display_name} | KujiLingo`;
    } else {
      document.title = "Tủ trưng bày thành tựu | KujiLingo";
    }
  }, [data?.display_name]);

  useEffect(() => {
    const fetchShowcase = async () => {
      if (!userId) return;
      try {
        const response = await axiosClient.get(`/api/v1/users/${userId}/achievements/showcase`);
        if (response.data?.success) {
          setData(response.data.data);
        } else {
          setError("Không tìm thấy thông tin chia sẻ.");
        }
      } catch (err) {
        console.error("Error fetching public showcase:", err);
        setError("Không tìm thấy thông tin người dùng hoặc tủ trưng bày trống.");
      } finally {
        setLoading(false);
      }
    };

    fetchShowcase();
  }, [userId]);

  const getAchievementIcon = (type: string, size = 24) => {
    switch (type) {
      case "STREAK":
        return <Flame size={size} className="text-amber-500 fill-amber-500/10" />;
      case "EXP":
        return <Zap size={size} className="text-violet-500 fill-violet-500/10" />;
      case "VOCAB_MASTER":
        return <BookOpen size={size} className="text-blue-500 fill-blue-500/10" />;
      case "QUIZ_PERFECT":
        return <Trophy size={size} className="text-yellow-500 fill-yellow-500/10" />;
      default:
        return <Award size={size} className="text-rose-500 fill-rose-500/10" />;
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "STREAK":
        return "bg-amber-50 border-amber-100";
      case "EXP":
        return "bg-violet-50 border-violet-100";
      case "VOCAB_MASTER":
        return "bg-blue-50 border-blue-100";
      case "QUIZ_PERFECT":
        return "bg-yellow-50 border-yellow-100";
      default:
        return "bg-rose-50 border-rose-100";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 text-zinc-900 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-500 font-semibold">Đang tải tủ trưng bày thành tựu...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 text-zinc-900 p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#b7152b]">
          <Award size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Tủ trưng bày rỗng hoặc không tồn tại</h1>
          <p className="text-zinc-500 text-sm max-w-sm">Người dùng này chưa có thành tựu nào được ghim vào tủ trưng bày công khai.</p>
        </div>
        <Link href="/">
          <button className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md">
            Quay lại Trang chủ
          </button>
        </Link>
      </div>
    );
  }

  const highlightedItem = data.items.find(item => item.id === highlightId);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative elements */}
      <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-rose-100/50 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main card container */}
      <div className="w-full max-w-xl bg-white border border-zinc-200/60 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] relative z-10 my-auto space-y-8 animate-fade-in-up">
        
        {/* Branding header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#b7152b] flex items-center justify-center font-bold text-sm text-white shadow-sm">
              K
            </div>
            <span className="font-extrabold text-sm tracking-tight text-zinc-900">KujiLingo</span>
          </div>
          <span className="text-[10px] font-black tracking-widest text-[#b7152b] bg-rose-50 px-3 py-1.5 rounded-full uppercase border border-rose-100">
            Showcase
          </span>
        </div>

        {/* User profile statement */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 leading-tight">
            Thành tựu của <span className="text-[#b7152b]">{data.display_name}</span>
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm font-semibold max-w-xs mx-auto leading-relaxed">
            Hành trình học tiếng Nhật và tích lũy huy hiệu danh giá trên KujiLingo.
          </p>
        </div>

        {/* Highlighted item showcase */}
        {highlightedItem && (
          <div className="bg-gradient-to-br from-white to-zinc-50/50 border-2 border-[#b7152b]/10 rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden shadow-sm group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="w-24 h-24 rounded-3xl bg-white border border-zinc-100 flex items-center justify-center shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] z-10">
              {getAchievementIcon(highlightedItem.type, 44)}
            </div>
            <div className="text-center sm:text-left space-y-2.5 flex-1 z-10">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#b7152b] text-white">
                Thành tựu nổi bật
              </span>
              <h3 className="font-black text-zinc-900 text-xl leading-tight">{highlightedItem.title}</h3>
              <p className="text-zinc-600 text-xs font-semibold leading-relaxed line-clamp-2">{highlightedItem.description}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
                <Award size={12} />
                Đạt được ngày: {formatDate(highlightedItem.unlocked_at)}
              </div>
            </div>
          </div>
        )}

        {/* Other achievements list */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] text-left ml-1">
            Huy hiệu đã đạt ({data.items.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.items
              .filter(item => item.id !== highlightId)
              .map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-zinc-100 rounded-2xl p-4 flex items-center gap-4 hover:border-[#b7152b]/20 hover:shadow-md transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${getIconBgColor(item.type)}`}>
                    {getAchievementIcon(item.type, 22)}
                  </div>
                  <div className="text-left min-w-0">
                    <h4 className="font-extrabold text-zinc-900 text-[13px] leading-snug line-clamp-1">
                      {item.title}
                    </h4>
                    <p className="text-zinc-500 text-[10px] font-medium leading-relaxed line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                    <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1.5">
                      {formatDate(item.unlocked_at)}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {data.items.filter(item => item.id !== highlightId).length === 0 && !highlightedItem && (
            <div className="py-12 bg-zinc-50/50 rounded-3xl border border-dashed border-zinc-200 text-center">
               <Award className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
               <p className="text-sm font-bold text-zinc-400">Tủ trưng bày hiện đang trống.</p>
            </div>
          )}
        </div>

        {/* CTA (Call to action) */}
        <div className="pt-6 border-t border-zinc-100 flex flex-col items-center gap-5">
          <span className="text-zinc-500 text-xs font-semibold">Bạn cũng muốn có bộ sưu tập này?</span>
          <Link href="/" className="w-full">
            <button className="w-full h-14 bg-[#b7152b] hover:bg-red-700 text-white font-black text-[13px] rounded-2xl transition-all shadow-[0_10px_30px_-5px_rgba(183,21,43,0.3)] flex items-center justify-center gap-2.5 group">
              Tham gia học cùng KujiLingo miễn phí
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </Link>
        </div>

      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-2 mb-4 z-10">
        <div className="h-px w-8 bg-zinc-200 mb-2" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
          © 2026 KujiLingo
        </span>
      </div>

    </div>
  );
}
