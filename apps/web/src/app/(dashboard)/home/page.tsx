"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Flame, 
  Trophy, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  Sparkles
} from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { Button } from "@/shared/components/ui/Button";

interface DashboardData {
  streak: {
    current_streak_days: number;
    longest_streak_days: number;
    is_at_risk: boolean;
  };
  daily_goal_progress: {
    minutes_studied_today: number;
    goal_minutes: number;
    percent: number;
  };
  continue_learning: {
    lesson_id: string;
    lesson_title: string;
    course_title: string;
    reason: "in_progress" | "next_up" | "recommended";
  } | null;
  srs_due_count: number;
  recent_achievements: string[];
}

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axiosClient.get("/dashboard");
        if (response.data && response.data.success) {
          setDashboardData(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard summary:", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
        
        const monday = new Date(today);
        monday.setDate(today.getDate() - distanceToMonday);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const formatDateStr = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const date = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${date}`;
        };

        const response = await axiosClient.get("/api/v1/learning-progress/history", {
          params: {
            start_date: formatDateStr(monday),
            end_date: formatDateStr(sunday)
          }
        });

        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const mapped: Record<string, boolean> = {};
          response.data.data.forEach((item: { date: string; total: number }) => {
            if (item.date && item.total > 0) {
              mapped[item.date] = true;
            }
          });
          setHistoryData(mapped);
        }
      } catch (err) {
        console.error("Error fetching learning progress history:", err);
      }
    };

    if (mounted && user) {
      Promise.all([fetchDashboard(), fetchHistory()]).finally(() => {
        setLoading(false);
      });
    }
  }, [mounted, user]);

  if (!mounted) return null;

  if (loading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải trang tổng quan của bạn...</span>
      </div>
    );
  }

  const displayName = user?.display_name || "Học viên";
  
  // Calculate remaining minutes for daily goal
  const minutesStudiedReal = dashboardData?.daily_goal_progress.minutes_studied_today ?? 0;
  const goalMinutes = dashboardData?.daily_goal_progress.goal_minutes ?? 15;
  const minutesStudied = Math.min(minutesStudiedReal, goalMinutes);
  const remainingMinutes = Math.max(0, goalMinutes - minutesStudiedReal);
  const dailyGoalPercent = dashboardData?.daily_goal_progress.percent ?? 0;

  // Generate calendar days based on actual study history of current week
  const getWeeklyCalendar = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);

    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    
    return labels.map((label, idx) => {
      const targetDay = new Date(monday);
      targetDay.setDate(monday.getDate() + idx);
      
      const year = targetDay.getFullYear();
      const month = String(targetDay.getMonth() + 1).padStart(2, "0");
      const date = String(targetDay.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${date}`;
      
      return {
        label,
        active: historyData[dateStr] || false
      };
    });
  };

  const calendarDays = getWeeklyCalendar();

  // Circular progress math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dailyGoalPercent / 100) * circumference;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Greetings Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Chào mừng quay lại, {displayName}!
        </h1>
        <p className="text-zinc-500 text-sm md:text-base mt-1">
          Hãy tiếp tục hành trình học tiếng Nhật của bạn hôm nay.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: Main Learning Flow (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Continue Learning Course Card */}
          {dashboardData?.continue_learning ? (
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              {/* Background watermark icon */}
              <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 text-zinc-50/70 pointer-events-none -z-10">
                <Trophy size={180} strokeWidth={1} />
              </div>

              <div className="space-y-4 max-w-lg">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1 rounded-full text-[10px] font-extrabold bg-[#b7152b]/5 text-[#b7152b] uppercase tracking-wider">
                    {dashboardData.continue_learning.reason === "in_progress" ? "ĐANG HỌC" : "BÀI TIẾP THEO"}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    {dashboardData.continue_learning.course_title}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <h2 className="text-xl md:text-2xl font-black text-zinc-950">
                    {dashboardData.continue_learning.lesson_title}
                  </h2>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Tiếp tục học các từ vựng mới và củng cố các kỹ năng tiếng Nhật của bạn ngay bây giờ.
                  </p>
                </div>

                {/* Simulated course progress bar */}
                <div className="space-y-1.5 w-64">
                  <div className="flex justify-between text-xs font-bold text-zinc-400">
                    <span>Tiến độ bài học</span>
                    <span className="text-[#b7152b]">35%</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#b7152b] to-[#e02424] w-[35%] rounded-full" />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => router.push(`/lessons/${dashboardData.continue_learning?.lesson_id}`)}
                className="h-12 px-6 bg-gradient-to-r from-[#b7152b] to-[#9b1c1c] hover:from-[#9b1c1c] hover:to-[#7f1d1d] text-white font-bold rounded-2xl shadow-lg shadow-red-500/10 shrink-0 flex items-center gap-2 group w-full md:w-auto justify-center"
              >
                Tiếp tục học
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ) : (
            // Fallback if no course is active
            <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mx-auto">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Bắt đầu học ngay hôm nay!</h3>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto leading-relaxed">
                Bạn chưa kích hoạt khóa học nào. Hãy đăng ký một khóa học N5 - N1 để bắt đầu học tập.
              </p>
              <Button onClick={() => router.push("/courses")} className="h-11 px-6 mx-auto">
                Xem danh sách khóa học
              </Button>
            </div>
          )}

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review Due Card */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-base">Đến lịch ôn tập</h3>
                  <p className="text-zinc-400 text-xs">Củng cố trí nhớ dài hạn của bạn.</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Layers size={18} />
                </div>
              </div>

              <div className="flex justify-between items-end mt-4">
                <span className="text-2xl font-black text-zinc-900">
                  {dashboardData?.srs_due_count ?? 0} <span className="text-xs font-bold text-zinc-400">thẻ từ</span>
                </span>
                
                <button 
                  onClick={() => {
                    if (dashboardData?.continue_learning) {
                      router.push(`/lessons/${dashboardData.continue_learning.lesson_id}`);
                    } else {
                      router.push("/courses");
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Daily Practice Card */}
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[160px] relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-base">Luyện tập hàng ngày</h3>
                  <p className="text-zinc-400 text-xs">Các bài tập nhanh để rèn luyện phản xạ.</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="flex justify-between items-end mt-4">
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 uppercase tracking-wider">
                  Khuyên dùng
                </span>
                
                <button 
                  onClick={() => {
                    if (dashboardData?.continue_learning) {
                      router.push(`/lessons/${dashboardData.continue_learning.lesson_id}`);
                    } else {
                      router.push("/courses");
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Gamification & Streak (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Current Streak Card */}
          {dashboardData && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 text-base">Chuỗi liên tục</h3>
                  <p className="text-[10px] font-bold text-amber-600">
                    {dashboardData.streak.is_at_risk 
                      ? "🔥 Nguy hiểm! Hãy online học ngay hôm nay để bảo vệ chuỗi."
                      : "🎉 An toàn! Chuỗi học tập đã được bảo vệ hôm nay."
                    }
                  </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Flame size={18} fill="currentColor" />
                </div>
              </div>

              <div className="text-3xl font-black text-zinc-950">
                {dashboardData.streak.current_streak_days} <span className="text-sm font-bold text-zinc-400">ngày</span>
              </div>

              {/* Weekly Calendar */}
              <div className="grid grid-cols-7 gap-2 pt-2">
                {calendarDays.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-extrabold text-zinc-400">{day.label}</span>
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs transition-all ${
                        day.active 
                          ? "bg-amber-400 border-amber-400 text-white shadow-sm shadow-amber-400/20" 
                          : "bg-zinc-50 border-zinc-100 text-zinc-300"
                      }`}
                    >
                      {day.active ? (
                        <Flame size={13} fill="currentColor" />
                      ) : (
                        <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Goal Progress Card */}
          {dashboardData && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-zinc-900 text-base">Mục tiêu hàng ngày</h3>
                <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-50 text-[#b7152b] rounded-full uppercase tracking-wider">
                  {dailyGoalPercent}%
                </span>
              </div>

              <div className="flex items-center gap-6">
                {/* SVG Circular progress chart */}
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      className="text-zinc-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Active progress circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      className="text-[#b7152b] transition-all duration-500 ease-out"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-zinc-950 leading-none">{minutesStudied}m</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-zinc-800">
                    {minutesStudied} / {goalMinutes} phút
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    {remainingMinutes > 0 
                      ? `Còn ${remainingMinutes} phút nữa để đạt mục tiêu hôm nay.`
                      : "Bạn đã hoàn thành mục tiêu ngày hôm nay!"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Achievements Card */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 text-base">Thành tích</h3>
              <Link href="/achievements" className="text-xs font-bold text-[#b7152b] hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {dashboardData.recent_achievements.length > 0 ? (
                dashboardData.recent_achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl p-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                      <Sparkles size={16} fill="currentColor" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-zinc-900 block leading-tight">{achievement}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-400">Chưa có thành tích nào gần đây.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
