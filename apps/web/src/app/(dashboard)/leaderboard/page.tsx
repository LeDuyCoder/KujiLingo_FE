"use client";

import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Trophy, 
  Search, 
  Loader2,
  Flame,
  Sparkles,
  Activity
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp_total: number;
  level?: number;
}

interface LeaderboardData {
  period_type: "weekly" | "all_time";
  period_key: string;
  entries: LeaderboardEntry[];
  current_user: {
    rank: number;
    xp_total: number;
  } | null;
}

interface UserStats {
  level: number;
  exp: number;
  streak: number;
  total_reviews: number;
  correct_reviews: number;
  accuracy_percent: number | null;
  total_mastered: number;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<"weekly" | "all_time">("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!mounted || !user) return;
      setLoading(true);
      try {
        const [lbResponse, statsResponse] = await Promise.all([
          axiosClient.get("/api/v1/leaderboard", {
            params: {
              period_type: period,
              limit: 50
            }
          }),
          axiosClient.get("/api/v1/statistics/me")
        ]);

        if (lbResponse.data && lbResponse.data.success) {
          setData(lbResponse.data.data);
        }
        if (statsResponse.data && statsResponse.data.success) {
          setUserStats(statsResponse.data.data);
        }
      } catch (err) {
        console.error("Error fetching leaderboard summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [mounted, user, period]);

  if (!mounted) return null;

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải bảng xếp hạng...</span>
      </div>
    );
  }

  // Filter entries based on search query
  const filteredEntries = data.entries.filter(entry => 
    entry.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split top 3 for the podium
  const top3 = filteredEntries.slice(0, 3);
  const restEntries = filteredEntries.slice(3);

  // Find users for podium positions specifically
  const firstPlace = top3.find(e => e.rank === 1);
  const secondPlace = top3.find(e => e.rank === 2);
  const thirdPlace = top3.find(e => e.rank === 3);

  // Dynamic label based on period basis
  const scoreUnit = "XP";

  // Calculate dynamic sidebar overtake info
  const myRank = data.current_user?.rank ?? 0;
  const myScore = data.current_user?.xp_total ?? 0;
  const nextRankUser = myRank > 1 ? data.entries.find(e => e.rank === myRank - 1) : null;
  const xpToOvertake = nextRankUser ? (nextRankUser.xp_total - myScore) : 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight">Global Leaderboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Thi đua cùng các học viên trên toàn thế giới và thăng tiến trên bảng xếp hạng.
        </p>
      </div>

      {/* Podium Top 3 (Always visible, responsive) */}
      <div className="grid grid-cols-3 gap-4 items-end max-w-3xl mx-auto pt-6 pb-2 relative">
        {/* 2nd Place */}
        <div className="col-span-1 flex flex-col items-center">
          {secondPlace ? (
            <div className="flex flex-col items-center w-full text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-50 border-4 border-slate-200 flex items-center justify-center text-slate-500 text-lg md:text-xl font-bold shadow-md">
                  {secondPlace.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-800 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  2
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-extrabold text-zinc-800 text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] mx-auto">
                  {secondPlace.display_name}
                </h3>
              </div>
              <div className="bg-slate-100/80 border border-slate-200/50 rounded-2xl px-3 py-1.5 w-full max-w-[130px] mx-auto shadow-inner">
                <span className="block text-xs font-black text-slate-700">
                  {secondPlace.xp_total.toLocaleString()}
                </span>
                <span className="block text-[8px] font-extrabold text-slate-400 uppercase tracking-wide">
                  {scoreUnit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-zinc-300 text-xs py-10">Trống</div>
          )}
        </div>

        {/* 1st Place (Center) */}
        <div className="col-span-1 flex flex-col items-center pb-6">
          {firstPlace ? (
            <div className="flex flex-col items-center w-full text-center space-y-3 relative">
              {/* Crown Icon */}
              <div className="absolute -top-7 text-amber-500 animate-[sway_3s_ease-in-out_infinite]">
                <Crown size={28} fill="currentColor" />
              </div>
              
              <div className="relative">
                <div className="w-20 h-20 md:w-26 md:h-26 rounded-full bg-amber-50 border-4 border-amber-300 flex items-center justify-center text-amber-600 text-2xl md:text-3xl font-extrabold shadow-xl">
                  {firstPlace.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                  1
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-black text-zinc-950 text-base md:text-lg truncate max-w-[100px] md:max-w-[140px] mx-auto">
                  {firstPlace.display_name}
                </h3>
              </div>
              <div className="bg-amber-50 border border-amber-200/50 rounded-2xl px-4 py-2 w-full max-w-[150px] mx-auto shadow-inner">
                <span className="block text-sm font-black text-amber-600">
                  {firstPlace.xp_total.toLocaleString()}
                </span>
                <span className="block text-[8px] font-extrabold text-amber-500 uppercase tracking-wide">
                  {scoreUnit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-zinc-300 text-xs py-10">Trống</div>
          )}
        </div>

        {/* 3rd Place */}
        <div className="col-span-1 flex flex-col items-center">
          {thirdPlace ? (
            <div className="flex flex-col items-center w-full text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-orange-50 border-4 border-orange-200 flex items-center justify-center text-orange-600 text-lg md:text-xl font-bold shadow-md">
                  {thirdPlace.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  3
                </div>
              </div>
              <div className="pt-2">
                <h3 className="font-extrabold text-zinc-800 text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] mx-auto">
                  {thirdPlace.display_name}
                </h3>
              </div>
              <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl px-3 py-1.5 w-full max-w-[130px] mx-auto shadow-inner">
                <span className="block text-xs font-black text-orange-700">
                  {thirdPlace.xp_total.toLocaleString()}
                </span>
                <span className="block text-[8px] font-extrabold text-orange-400 uppercase tracking-wide">
                  {scoreUnit}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full text-center text-zinc-300 text-xs py-10">Trống</div>
          )}
        </div>
      </div>

      {/* Main Grid: List (8 cols) and Sidebar (4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Leaderboard List (8 cols) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          
          {/* Controls Bar: Period Switch & Search */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Time period options */}
            <div className="flex bg-zinc-50 border border-zinc-100 rounded-full p-1">
              <button 
                onClick={() => setPeriod("weekly")}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-colors ${
                  period === "weekly" ? "bg-white text-[#b7152b] shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Weekly (Tuần này)
              </button>
              <button 
                onClick={() => setPeriod("all_time")}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-colors ${
                  period === "all_time" ? "bg-white text-[#b7152b] shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                All Time (Mọi lúc)
              </button>
            </div>

            {/* User Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học viên..."
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200/60 rounded-full text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#b7152b] placeholder-zinc-400 text-zinc-800"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-zinc-100 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
                    <th className="px-6 py-4 text-center w-20">Hạng</th>
                    <th className="px-6 py-4">Học viên</th>
                    <th className="px-6 py-4 text-center w-24">Cấp độ</th>
                    <th className="px-6 py-4 text-right pr-8">Tổng {scoreUnit}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm font-semibold text-zinc-700">
                  {restEntries.map((entry) => {
                    const isMe = entry.user_id === user?.id;
                    return (
                      <tr 
                        key={entry.user_id} 
                        className={`transition-colors hover:bg-zinc-50/40 ${
                          isMe 
                            ? "bg-red-50/60 hover:bg-red-50/80 border-y-2 border-[#b7152b]/15 text-[#b7152b]" 
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-4.5 text-center font-black">
                          {entry.rank}
                        </td>

                        {/* User Display Name */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shadow-inner shrink-0 ${
                              isMe ? "bg-[#b7152b]/10 border-[#b7152b]/20 text-[#b7152b]" : "bg-zinc-100 border-zinc-200 text-zinc-600"
                            }`}>
                              {entry.display_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-extrabold text-zinc-900 block leading-tight">
                                {isMe ? `Bạn (${entry.display_name})` : entry.display_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-6 py-4.5 text-center">
                          <span className="px-2.5 py-1 text-[10px] font-extrabold bg-zinc-100 text-zinc-500 rounded-lg">
                            Lv {entry.level || 1}
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="px-6 py-4.5 text-right pr-8 font-black text-zinc-950">
                          {entry.xp_total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 font-bold">
                        Không tìm thấy học viên trùng khớp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-zinc-50/50 px-6 py-4 flex justify-between items-center text-xs font-bold text-zinc-400 border-t border-zinc-100">
              <span>Hiển thị 1 đến {filteredEntries.length} của {filteredEntries.length} học viên</span>
              
              <div className="flex gap-1.5">
                <button className="w-7 h-7 rounded-lg border border-zinc-100 bg-white flex items-center justify-center text-zinc-300 cursor-not-allowed" disabled>&lt;</button>
                <button className="w-7 h-7 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-800 shadow-sm">1</button>
                <button className="w-7 h-7 rounded-lg border border-zinc-100 bg-white flex items-center justify-center text-zinc-400 cursor-not-allowed" disabled>&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Stats & Targets (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* User Rankings Card */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#b7152b]/5 border-2 border-[#b7152b]/20 text-[#b7152b] flex items-center justify-center text-xl font-black shadow-inner">
                {user?.display_name?.charAt(0).toUpperCase() || "H"}
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-950 text-base leading-tight">
                  {user?.display_name || "Học viên"}
                </h3>
                <span className="text-xs font-bold text-zinc-400 block mt-0.5">
                  Xếp hạng hiện tại: <span className="text-[#b7152b] font-black">#{myRank || "N/A"}</span>
                </span>
              </div>
            </div>

            {/* Next Rank progress calculations */}
            {nextRankUser ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <span>{myScore.toLocaleString()} {scoreUnit}</span>
                  <span className="text-[#b7152b]">Hạng tiếp theo: #{myRank - 1}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#b7152b] rounded-full animate-pulse" 
                    style={{ width: `${Math.min(100, (myScore / nextRankUser.xp_total) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 font-bold leading-normal italic text-center">
                  &ldquo;Chỉ cần {xpToOvertake.toLocaleString()} {scoreUnit} nữa để vượt qua {nextRankUser.display_name}!&rdquo;
                </p>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 font-bold italic text-center py-2 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
                🎉 Bạn đang dẫn đầu bảng xếp hạng!
              </div>
            )}

            <hr className="border-zinc-100" />

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center bg-zinc-50 border border-zinc-100 rounded-2xl p-3">
                <span className="text-zinc-400 text-[10px] font-extrabold uppercase block tracking-wider">Chuỗi ngày</span>
                <span className="text-zinc-900 text-lg font-black mt-1 block flex items-center justify-center gap-1">
                  <Flame size={16} className="text-amber-500 fill-amber-500" />
                  {userStats?.streak || 0}
                </span>
              </div>
              <div className="text-center bg-zinc-50 border border-zinc-100 rounded-2xl p-3">
                <span className="text-zinc-400 text-[10px] font-extrabold uppercase block tracking-wider">Cấp độ</span>
                <span className="text-zinc-900 text-lg font-black mt-1 block flex items-center justify-center gap-1">
                  <Trophy size={16} className="text-yellow-500" />
                  {userStats?.level || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Stats Card (Replacing mock panels with 100% database stats) */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-zinc-900 text-base">Thống kê học tập</h3>
            
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl p-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#b7152b] flex items-center justify-center shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Tổng lượt ôn tập</span>
                  <span className="text-sm font-black text-zinc-950 mt-0.5 block">
                    {userStats?.total_reviews?.toLocaleString() ?? 0} lần
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl p-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles size={16} fill="currentColor" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Tỷ lệ chính xác</span>
                  <span className="text-sm font-black text-zinc-950 mt-0.5 block">
                    {userStats?.accuracy_percent ? `${userStats.accuracy_percent}%` : "Chưa có dữ liệu"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-zinc-50 border border-zinc-100 rounded-2xl p-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <Trophy size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Từ vựng thành thạo</span>
                  <span className="text-sm font-black text-zinc-950 mt-0.5 block">
                    {userStats?.total_mastered?.toLocaleString() ?? 0} từ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}