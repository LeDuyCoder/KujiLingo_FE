"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Award, 
  Trophy, 
  Zap, 
  Flame, 
  BookOpen, 
  Lock, 
  CheckCircle2, 
  ChevronLeft,
  Loader2, 
  Sparkles, 
  Star, 
  Calendar, 
  Filter, 
  BookMarked
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { Button } from "@/shared/components/ui/Button";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "STREAK" | "EXP" | "VOCAB_MASTER" | "QUIZ_PERFECT";
  condition_value: number;
  reward_exp: number;
  status: "unlocked" | "in_progress" | "not_started";
  is_unlocked: boolean;
  unlocked_at: string | null;
  current_value: number;
  progress_percent: number;
  remaining_value?: number;
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

export default function AchievementsPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "unlocked" | "locked" | "in_progress" | "rare">("all");
  const [sortOrder, setSortOrder] = useState<"default" | "progress" | "reward">("default");
  
  // Data States
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  
  // Detail State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailAchievement, setDetailAchievement] = useState<Achievement | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    document.title = "Thành tựu | KujiLingo";
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  const fetchAchievementsData = useCallback(async () => {
    if (!user) return;
    try {
      const [meRes, statsRes, lbRes] = await Promise.all([
        axiosClient.get("/api/v1/achievements/me"),
        axiosClient.get("/api/v1/statistics/me"),
        axiosClient.get("/api/v1/leaderboard", {
          params: {
            period_type: "all_time",
            limit: 1
          }
        }).catch(() => null)
      ]);

      if (meRes.data?.success) {
        setAchievements(meRes.data.data.items);
      }
      if (statsRes.data?.success) {
        setUserStats(statsRes.data.data);
      }
      if (lbRes && lbRes.data?.success && lbRes.data.data.current_user) {
        setUserRank(lbRes.data.data.current_user.rank);
      }
    } catch (err) {
      console.error("Error fetching achievements data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (mounted && user) {
      const handle = setTimeout(() => {
        fetchAchievementsData();
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [mounted, user, fetchAchievementsData]);

  // Load detailed achievement when selected
  useEffect(() => {
    const fetchDetail = async () => {
      if (!selectedId) {
        setDetailAchievement(null);
        return;
      }
      setDetailLoading(true);
      try {
        const response = await axiosClient.get(`/api/v1/achievements/me/${selectedId}`);
        if (response.data?.success) {
          setDetailAchievement(response.data.data);
        }
      } catch (err) {
        console.error("Error fetching achievement detail:", err);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedId]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải thành tựu KujiLingo...</span>
      </div>
    );
  }

  // Get dynamic icon based on achievement type / title
  const getAchievementIcon = (type: string, size = 20) => {
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

  // Get dynamic icon background color
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

  const getRarityText = (conditionValue: number, type: string) => {
    if (type === "STREAK" && conditionValue >= 30) return "Rare";
    if (type === "EXP" && conditionValue >= 5000) return "Rare";
    if (type === "VOCAB_MASTER" && conditionValue >= 500) return "Rare";
    if (type === "QUIZ_PERFECT" && conditionValue >= 20) return "Rare";
    return "Common";
  };

  // Filter achievements
  const filteredAchievements = achievements.filter((item) => {
    const rarity = getRarityText(item.condition_value, item.type);
    if (activeFilter === "unlocked") return item.is_unlocked;
    if (activeFilter === "locked") return !item.is_unlocked && item.progress_percent === 0;
    if (activeFilter === "in_progress") return !item.is_unlocked && item.progress_percent > 0;
    if (activeFilter === "rare") return rarity === "Rare";
    return true; // "all"
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortOrder === "progress") {
      return b.progress_percent - a.progress_percent;
    }
    if (sortOrder === "reward") {
      return b.reward_exp - a.reward_exp;
    }
    // Default sorting: Unlocked first, then by progress, then title
    if (a.is_unlocked !== b.is_unlocked) {
      return a.is_unlocked ? -1 : 1;
    }
    return b.progress_percent - a.progress_percent;
  });

  // Get unlocked achievements for timeline
  const recentUnlocks = achievements
    .filter((item) => item.is_unlocked && item.unlocked_at)
    .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
    .slice(0, 4);

  // Get rarest achievements for side widget
  const rarestBadges = achievements
    .filter((item) => getRarityText(item.condition_value, item.type) === "Rare")
    .slice(0, 3);

  // Format Date Helper
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render DETAIL VIEW
  if (selectedId && detailLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-zinc-800">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải chi tiết thành tựu...</span>
      </div>
    );
  }

  if (selectedId && detailAchievement) {
    // Find subsequent achievements of the same type
    const subsequentTiers = achievements
      .filter((item) => item.type === detailAchievement.type && item.condition_value > detailAchievement.condition_value)
      .sort((a, b) => a.condition_value - b.condition_value)
      .slice(0, 3);

    return (
      <div className="space-y-8 animate-fade-in-up w-full text-zinc-800">
        {/* Navigation Back Link */}
        <div className="text-left py-1">
          <button 
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-500 hover:text-zinc-800 transition-colors group cursor-pointer"
          >
            <ChevronLeft size={14} strokeWidth={3} className="text-zinc-400 group-hover:text-zinc-650 transition-colors" />
            Quay lại danh sách
          </button>
        </div>

        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight text-left">Chi tiết Thành tựu</h1>

        {/* Detail Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left card: Badge Presentation */}
          <div className="md:col-span-5 bg-white border border-zinc-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#b7152b]/5 rounded-full blur-2xl z-0" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl z-0" />

            {/* Premium badge frame */}
            <div className="relative w-44 h-44 flex items-center justify-center bg-zinc-50 border border-zinc-100 rounded-[2.5rem] shadow-inner mb-6 z-10">
              <div className={`w-32 h-32 rounded-full border-4 border-white flex items-center justify-center shadow-md relative ${getIconBgColor(detailAchievement.type)}`}>
                {getAchievementIcon(detailAchievement.type, 56)}
              </div>
              
              {/* Target lock badge icon */}
              {detailAchievement.is_unlocked ? (
                <div className="absolute -bottom-2 right-4 w-9 h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
              ) : (
                <div className="absolute -bottom-2 right-4 w-9 h-9 bg-zinc-400 text-white rounded-full flex items-center justify-center border-4 border-white shadow-md">
                  <Lock size={14} strokeWidth={2.5} />
                </div>
              )}
            </div>

            <div className="space-y-2 z-10">
              <h2 className="text-2xl font-black text-zinc-950 leading-tight">
                {detailAchievement.title}
              </h2>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-500 border border-zinc-200/50 uppercase tracking-widest">
                {detailAchievement.type === "STREAK" ? "Mục tiêu Chuỗi học" :
                 detailAchievement.type === "EXP" ? "Mục tiêu Kinh nghiệm" :
                 detailAchievement.type === "VOCAB_MASTER" ? "Mục tiêu Từ vựng" : "Mục tiêu Hoàn hảo"}
              </span>
            </div>

            {/* Achievement unlock status bar */}
            <div className="w-full mt-6 pt-6 border-t border-zinc-100 z-10">
              {detailAchievement.is_unlocked ? (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-2xl px-4 py-2.5">
                  <CheckCircle2 size={14} strokeWidth={2.5} />
                  <span>Đã hoàn thành: {formatDate(detailAchievement.unlocked_at)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-50 rounded-2xl px-4 py-2.5">
                  <Lock size={14} />
                  <span>Chưa mở khóa</span>
                </div>
              )}
            </div>
          </div>

          {/* Right card: Mission details & Rewards */}
          <div className="md:col-span-7 bg-white border border-zinc-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-6">
              
              {/* Mission Statement */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider block">Nhiệm vụ</span>
                <p className="text-zinc-600 text-sm md:text-base font-semibold leading-relaxed">
                  {detailAchievement.description}
                </p>
              </div>

              {/* Progress display */}
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-end text-xs font-bold text-zinc-500">
                  <span>Tiến độ hiện tại</span>
                  <span className="text-zinc-955 font-black text-sm text-zinc-950">
                    {detailAchievement.current_value.toLocaleString()} / {detailAchievement.condition_value.toLocaleString()}
                  </span>
                </div>
                
                {/* Progress bar container */}
                <div className="w-full h-3.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/30 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#b7152b] to-rose-600 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${detailAchievement.progress_percent}%` }}
                  />
                </div>
                <span className="text-[10px] font-extrabold text-zinc-400 block text-right uppercase tracking-wider">
                  Đạt {detailAchievement.progress_percent}% mục tiêu
                </span>
              </div>

              {/* Reward Package block */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200/50 text-amber-600 shrink-0">
                    <Trophy size={20} className="fill-amber-500/10" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-extrabold text-amber-500 uppercase tracking-wider block">Phần thưởng</span>
                    <span className="text-zinc-850 font-extrabold text-xs text-zinc-800">Điểm kinh nghiệm thưởng</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-100/50 border border-amber-200/50 rounded-xl px-3 py-1.5 font-black text-sm text-amber-800">
                  +{detailAchievement.reward_exp} EXP
                  <Zap size={14} className="fill-amber-500 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Sharing & action buttons */}
            <div className="pt-8 border-t border-zinc-100 flex gap-4 mt-6">
              <Button 
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/achievements/${user?.id}?highlight=${detailAchievement.id}`;
                  if (navigator.share) {
                    navigator.share({
                      title: `KujiLingo - ${detailAchievement.title}`,
                      text: `Tôi vừa đạt được thành tựu: ${detailAchievement.title}! ${detailAchievement.description}`,
                      url: shareUrl,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Đã sao chép liên kết chia sẻ!");
                  }
                }}
                className="flex-1 h-11 bg-[#b7152b] hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
              >
                Chia sẻ thành tựu
              </Button>
              {detailAchievement.is_unlocked ? (
                <Button className="flex-1 h-11 bg-zinc-100 hover:bg-zinc-100 text-zinc-400 font-bold text-xs rounded-xl cursor-default" disabled>
                  Đã nhận thưởng
                </Button>
              ) : (
                <Button className="flex-1 h-11 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded-xl transition-all">
                  Đang thực hiện
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* Bottom Section: Subsequent Tiers */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-zinc-900 text-left">Các cấp độ thành tựu tiếp theo</h3>
          {subsequentTiers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {subsequentTiers.map((tier) => (
                <div 
                  key={tier.id}
                  onClick={() => setSelectedId(tier.id)}
                  className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:scale-105 transition-transform shrink-0">
                    <Lock size={16} />
                  </div>
                  <div className="space-y-0.5 text-left">
                    <span className="text-xs font-black text-zinc-500 group-hover:text-zinc-800 transition-colors block">
                      {tier.title}
                    </span>
                    <span className="block text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider">
                      Cần {tier.condition_value.toLocaleString()} {tier.type === "STREAK" ? "ngày" : tier.type === "EXP" ? "EXP" : "từ"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-400 text-left">Bạn đã xem cấp độ thành tích cao nhất của thể loại này!</p>
          )}
        </div>
      </div>
    );
  }

  // Calculate user total catalog progress percentage
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.is_unlocked).length;
  const progressPercent = totalAchievements > 0 ? Math.round((unlockedCount / totalAchievements) * 100) : 0;
  const lockedCount = totalAchievements - unlockedCount;

  return (
    <div className="w-full text-zinc-800 space-y-8 animate-fade-in-up">
      
      {/* Page Header (Full Width) */}
      <div className="text-left">
        <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
          <Award className="text-[#b7152b]" />
          Thành tựu
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Theo dõi tiến trình và mở khóa các huy hiệu thông thái KujiLingo.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        
        {/* LEFT SECTION: MAIN LISTING & CAROUSEL */}
        <div className="flex-1 w-full space-y-8">
          
          {/* Mastery Journey banner card */}
          <div className="bg-[#b7152b] text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-red-900/10 relative overflow-hidden min-h-[190px]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-5 text-left max-w-md z-10">
              <div className="space-y-1.5">
                <h2 className="text-xl md:text-2xl font-black">Hành trình Thông thạo</h2>
                <p className="text-red-100 text-xs md:text-sm leading-relaxed font-semibold">
                  Bạn đang tiến bộ rất vững chắc. Hãy mở khóa thêm nhiều thành tựu bằng cách duy trì chuỗi học và tích lũy từ vựng mới mỗi ngày.
                </p>
              </div>
              
              <div className="flex gap-4 md:gap-6 border-t border-white/10 pt-4">
                <div>
                  <span className="text-[9px] font-black text-red-200 uppercase tracking-wider block">Tổng tiến độ</span>
                  <span className="text-lg md:text-xl font-black">{progressPercent}%</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <span className="text-[9px] font-black text-red-200 uppercase tracking-wider block">Đã mở khóa</span>
                  <span className="text-lg md:text-xl font-black">{unlockedCount} / {totalAchievements}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <span className="text-[9px] font-black text-red-200 uppercase tracking-wider block">Còn khóa</span>
                  <span className="text-lg md:text-xl font-black">{lockedCount}</span>
                </div>
              </div>
            </div>

            {/* Trophy progress gauge right */}
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center bg-white/10 rounded-full border border-white/10 z-10">
              <div className="w-22 h-22 rounded-full bg-white flex items-center justify-center text-[#b7152b] shadow-md">
                <Trophy size={32} className="fill-[#b7152b]/10 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Filter tags & Search list */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-100 pb-4">
          <div className="flex flex-wrap gap-2 self-start sm:self-auto">
            {[
              { id: "all", label: "Tất cả" },
              { id: "unlocked", label: "Đã mở khóa" },
              { id: "in_progress", label: "Đang tiến hành" },
              { id: "locked", label: "Còn khóa" },
              { id: "rare", label: "Huy hiệu Hiếm ⭐" }
            ].map((tag) => (
              <button
                key={tag.id}
                onClick={() => setActiveFilter(tag.id as typeof activeFilter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeFilter === tag.id
                    ? "bg-[#b7152b] border-[#b7152b] text-white shadow-sm"
                    : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Sort order options dropdown */}
          <div className="flex gap-2 self-end sm:self-auto">
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-zinc-500 shadow-sm text-xs font-bold gap-1">
              <Filter size={12} />
              <span>Lọc:</span>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-1.5 text-zinc-700 text-xs font-bold focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="default">Mặc định (Ưu tiên đã mở)</option>
              <option value="progress">Tiến độ cao nhất</option>
              <option value="reward">Phần thưởng EXP cao nhất</option>
            </select>
          </div>
        </div>

        {/* Achievements Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAchievements.map((item) => {
            const isUnlocked = item.is_unlocked;
            const isInProgress = !isUnlocked && item.progress_percent > 0;
            const rarity = getRarityText(item.condition_value, item.type);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                  isUnlocked ? "border-emerald-100 ring-2 ring-emerald-500/5" : "border-zinc-100"
                }`}
              >
                {/* Status Badges */}
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${getIconBgColor(item.type)}`}>
                    {item.type}
                  </span>
                  
                  {isUnlocked ? (
                    <span className="text-[9px] font-black text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      <CheckCircle2 size={10} strokeWidth={3} />
                      UNLOCKED
                    </span>
                  ) : isInProgress ? (
                    <span className="text-[9px] font-black text-blue-600 flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded-lg">
                      IN PROGRESS
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-zinc-400 flex items-center gap-0.5 bg-zinc-50 px-2 py-0.5 rounded-lg">
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Main Card Icon & Title */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform ${getIconBgColor(item.type)}`}>
                      {getAchievementIcon(item.type, 18)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-extrabold text-zinc-950 text-sm leading-tight line-clamp-1 group-hover:text-[#b7152b] transition-colors">
                        {item.title}
                      </h3>
                      <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">
                        {rarity === "Rare" ? "⭐ HIẾM" : "THƯỜNG"}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-zinc-500 text-xs text-left line-clamp-2 min-h-[32px] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom stats row (Progress or unlock date) */}
                <div className="mt-5 pt-4 border-t border-zinc-50 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#b7152b]">+{item.reward_exp} XP</span>
                  
                  {isUnlocked ? (
                    <span className="text-zinc-400 font-semibold">{formatDate(item.unlocked_at)}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-[#b7152b] to-rose-600 rounded-full"
                          style={{ width: `${item.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-zinc-700">{item.progress_percent}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {sortedAchievements.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-400 font-bold space-y-2">
              <Award className="w-12 h-12 mx-auto text-zinc-300" />
              <p>Không tìm thấy thành tựu nào khớp với bộ lọc hiện tại.</p>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SIDE SECTION: LEARNING STATS & TIMELINE */}
      <div className="w-full lg:w-[280px] space-y-8 shrink-0">
        
        {/* Learning Stats Card */}
        {userStats && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5 pb-3 border-b border-zinc-100">
              <Star size={16} className="text-yellow-500 fill-yellow-500/10" />
              Thống kê Học tập
            </h3>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Cấp độ hiện tại:</span>
                <span className="font-black text-[#b7152b] uppercase text-right">
                  Lv {userStats.level}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Tổng điểm kinh nghiệm:</span>
                <span className="font-black text-zinc-950 text-right">
                  {userStats.exp.toLocaleString()} XP
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Chuỗi liên tục:</span>
                <span className="font-black text-amber-600 text-right flex items-center gap-0.5">
                  <Flame size={12} className="fill-amber-500 text-amber-500" />
                  {userStats.streak} Ngày
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Từ vựng đã thuộc:</span>
                <span className="font-black text-blue-600 text-right flex items-center gap-0.5">
                  <BookMarked size={12} />
                  {userStats.total_mastered} từ
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-500">Xếp hạng thành tích:</span>
                <span className="bg-rose-50 text-rose-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-rose-100">
                  {userRank ? `Hạng #${userRank}` : "Top 10%"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Recent Unlocks Timeline */}
        {recentUnlocks.length > 0 && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5 pb-3 border-b border-zinc-100">
              <Calendar size={16} className="text-zinc-500" />
              Mở khóa gần đây
            </h3>

            <div className="relative pl-4 border-l border-zinc-100 space-y-5">
              {recentUnlocks.map((item) => (
                <div key={item.id} className="relative space-y-1">
                  {/* Timeline dot */}
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#b7152b] border border-white" />
                  <span className="block text-xs font-black text-zinc-800 leading-tight">
                    {item.title}
                  </span>
                  <span className="block text-[10px] font-semibold text-zinc-400 leading-normal">
                    {item.description}
                  </span>
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                    {formatDate(item.unlocked_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rarest Badges Side List */}
        {rarestBadges.length > 0 && (
          <div className="bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm space-y-4 text-left">
            <h3 className="text-sm font-black text-zinc-900 flex items-center gap-1.5 pb-3 border-b border-zinc-100">
              <Sparkles size={16} className="text-yellow-500" />
              Huy hiệu Hiếm nhất
            </h3>

            <div className="space-y-3.5">
              {rarestBadges.map((badge) => (
                <div 
                  key={badge.id} 
                  onClick={() => setSelectedId(badge.id)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 text-zinc-400 group-hover:scale-105 transition-transform">
                    {getAchievementIcon(badge.type, 14)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-zinc-800 line-clamp-1 group-hover:text-[#b7152b] transition-colors leading-tight">
                      {badge.title}
                    </span>
                    <span className="block text-[9px] font-bold text-zinc-400 leading-normal uppercase">
                      Cần đạt: {badge.condition_value.toLocaleString()}
                    </span>
                  </div>
                  <span className="bg-zinc-50 border border-zinc-100 text-zinc-500 text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                    ⭐ Hiếm
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      </div>

    </div>
  );
}
