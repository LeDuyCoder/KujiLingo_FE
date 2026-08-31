"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { createPortal } from "react-dom";
import { 
  User, Lock, Key, Flame, Globe, Star, Loader2, CheckCircle2, Flag
} from "lucide-react";

interface UserStats {
  level: number;
  exp: number;
  streak: number;
  total_reviews: number;
  accuracy_percent: number | null;
  total_mastered: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [targetJLPT, setTargetJLPT] = useState(user?.jlpt_target_level || "N5");
  const [dailyGoal, setDailyGoal] = useState(user?.learning_goal_minutes || 15);
  const [joinedDate, setJoinedDate] = useState("");
  
  // Notification states
  const [showToast, setShowToast] = useState(false);
  const [saving, setSaving] = useState(false);

  // Change password states
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    document.title = "Chỉnh sửa hồ sơ | KujiLingo";

    const fetchData = async () => {
      try {
        const [statsRes, lbRes, userMeRes] = await Promise.all([
          axiosClient.get("/api/v1/statistics/me"),
          axiosClient.get("/api/v1/leaderboard", { params: { period_type: "all_time", limit: 1 } }).catch(() => null),
          axiosClient.get("/api/v1/auth/me").catch(() => null)
        ]);

        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        if (lbRes?.data?.success && lbRes.data.data.current_user) {
          setRank(lbRes.data.data.current_user.rank);
        }

        // Load current dates & additional metadata from auth/me if available
        if (userMeRes?.data?.success) {
          const authData = userMeRes.data.data;
          if (authData.created_at) {
            const date = new Date(authData.created_at);
            setJoinedDate(date.toISOString().replace("T", " ").substring(0, 19));
          }
        }
      } catch (err) {
        console.error("Error fetching data for edit profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-500 font-semibold">Đang tải biểu mẫu...</span>
      </div>
    );
  }

  const isPremium = user.is_premium;

  const handleReset = () => {
    setDisplayName(user.display_name || "");
    setTargetJLPT(user.jlpt_target_level || "N5");
    setDailyGoal(user.learning_goal_minutes || 15);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    // Client-side validations
    if (!currentPassword) {
      setPwError("Mật khẩu hiện tại không được để trống.");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPwError("Mật khẩu mới phải chứa ít nhất 1 chữ cái và 1 chữ số.");
      return;
    }
    if (newPassword !== newPasswordConfirmation) {
      setPwError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setPwLoading(true);
    try {
      const response = await axiosClient.patch("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });

      if (response.data?.success) {
        setPwSuccess("Đổi mật khẩu thành công!");
        setCurrentPassword("");
        setNewPassword("");
        setNewPasswordConfirmation("");
        
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setPwSuccess("");
        }, 1500);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const resError = axiosError.response?.data?.error;
      if (resError) {
        if (resError.code === "INVALID_CURRENT_PASSWORD") {
          setPwError("Mật khẩu hiện tại không chính xác.");
        } else if (resError.code === "PASSWORD_UNCHANGED") {
          setPwError("Mật khẩu mới phải khác mật khẩu hiện tại.");
        } else if (resError.code === "VALIDATION_ERROR") {
          setPwError("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số.");
        } else {
          setPwError(resError.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
        }
      } else {
        setPwError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Update store state
    updateUser({
      display_name: displayName,
      jlpt_target_level: targetJLPT,
      learning_goal_minutes: dailyGoal
    });

    setSaving(false);
    setShowToast(true);
    
    // Auto-dismiss toast and redirect
    setTimeout(() => {
      setShowToast(false);
      router.push("/profile");
    }, 1500);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-16 text-left relative">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-5 right-5 bg-zinc-950 text-white rounded-2xl px-5 py-3.5 shadow-2xl z-[100] flex items-center gap-3 animate-scale-up border border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <span className="font-extrabold text-xs block">Lưu thành công!</span>
            <span className="text-[10px] text-zinc-400">Thông tin hồ sơ đã được cập nhật.</span>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
        <Link href="/home" className="hover:text-zinc-600">Home</Link>
        <span>&gt;</span>
        <Link href="/profile" className="hover:text-zinc-600">Profile</Link>
        <span>&gt;</span>
        <span className="text-zinc-800 font-bold">Edit Profile</span>
      </div>

      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-zinc-950 tracking-tight">Edit Profile</h1>
        <p className="text-sm font-semibold text-zinc-500">
          Manage your personal information and customize your learning profile.
        </p>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card 1: Personal Information */}
          <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150">
              <User size={18} className="text-zinc-700" />
              <h2 className="text-base font-black text-zinc-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* User ID (Read Only) */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">User ID (Read Only)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={user.id} 
                    disabled 
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-400 focus:outline-none cursor-not-allowed font-mono"
                  />
                  <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all"
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Email (Read Only)</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-400 cursor-not-allowed font-semibold focus:outline-none"
                  />
                  <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>

              {/* Joined Date */}
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Joined Date (Read Only)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={joinedDate || "2023-01-15 08:30:00"} 
                    disabled 
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-400 cursor-not-allowed font-semibold focus:outline-none"
                  />
                  <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>

              {/* Change Password Button */}
              <div className="sm:col-span-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="h-10 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-inner"
                >
                  <Key size={14} />
                  <span>Change Password</span>
                </button>
              </div>

            </div>
          </div>

          {/* Card 2: Learning Preferences */}
          <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150">
              <Flag size={18} className="text-zinc-700" />
              <h2 className="text-base font-black text-zinc-900">Learning Preferences</h2>
            </div>

            {/* Target JLPT Level Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-zinc-800">Target JLPT Level</h3>
                <p className="text-[10px] font-semibold text-zinc-400">Adjust course difficulty based on your goal.</p>
              </div>

              {/* Level Buttons Group */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200/50 rounded-2xl p-1 shrink-0">
                {["N5", "N4", "N3", "N2", "N1"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setTargetJLPT(lvl)}
                    className={`h-9 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${targetJLPT === lvl ? "bg-[#b7152b] text-white shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-800"}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Goal Minutes Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-100">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-zinc-800">Daily Goal</h3>
                <p className="text-[10px] font-semibold text-zinc-400">How long do you want to study daily?</p>
              </div>

              {/* Minutes Buttons Group */}
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200/50 rounded-2xl p-1 shrink-0">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDailyGoal(mins)}
                    className={`h-9 px-5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${dailyGoal === mins ? "bg-[#b7152b] text-white shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-850"}`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Profile Preview Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1">
            Live Preview Card
          </span>

          <div className="bg-white border border-zinc-200/60 rounded-3xl overflow-hidden shadow-md">
            {/* Header Dark Blue */}
            <div className="h-28 bg-[#1e293b] relative" />

            {/* Content Details */}
            <div className="px-5 pb-6 relative text-center">
              
              {/* Avatar overlapping */}
              <div className="relative -mt-14 mb-3 flex flex-col items-center shrink-0">
                <div className="w-24 h-24 bg-white rounded-full p-1 border-2 border-red-500 shadow-md">
                  <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 border border-zinc-200 overflow-hidden">
                    <User size={38} strokeWidth={1.5} />
                  </div>
                </div>
                <div className="absolute -bottom-2 px-2.5 py-0.5 bg-zinc-950 text-white text-[9px] font-black rounded-full border-2 border-white shadow-sm">
                  Lvl {stats?.level || 1}
                </div>
              </div>

              {/* Name & Role */}
              <div className="space-y-1 mt-2.5">
                <h3 className="text-lg font-black text-zinc-950 leading-tight break-words line-clamp-1">
                  {displayName || "..."}
                </h3>
                <span className="text-[10px] font-bold text-zinc-500 block truncate">
                  {user.email}
                </span>
                
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isPremium ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-zinc-100 text-zinc-500 border border-zinc-200"}`}>
                    {isPremium ? <Star size={9} className="fill-amber-500 text-amber-500" /> : null}
                    {isPremium ? "Pro Member" : "Free Plan"}
                  </span>
                </div>
              </div>

              {/* Stats pills vertical stack */}
              <div className="mt-5 pt-4 border-t border-zinc-100 space-y-2">
                
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200/40 rounded-xl px-3.5 py-2">
                  <span className="flex items-center gap-1.5">
                    <Flame size={14} className="text-amber-500 fill-amber-500/10" />
                    Chuỗi học
                  </span>
                  <span className="text-zinc-955 font-black">
                    {stats?.streak || 0} ngày
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-zinc-50 border border-zinc-200/40 rounded-xl px-3.5 py-2">
                  <span className="flex items-center gap-1.5">
                    <Globe size={14} className="text-indigo-500" />
                    Xếp hạng
                  </span>
                  <span className="text-zinc-955 font-black">
                    {rank ? `#${rank}` : "N/A"}
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3.5">
        <button 
          onClick={handleReset}
          className="h-10 px-6 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-955 font-bold text-xs rounded-full transition-all cursor-pointer"
        >
          Reset
        </button>

        <button 
          onClick={handleSaveChanges}
          disabled={saving}
          className="h-10 px-7 bg-[#b7152b] hover:bg-red-700 disabled:bg-zinc-300 text-white font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && mounted && createPortal(
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up relative">
            
            <div className="space-y-1.5 text-center">
              <div className="mx-auto w-12 h-12 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mb-3">
                <Key size={22} />
              </div>
              <h3 className="text-lg font-black text-zinc-955">Change Password</h3>
              <p className="text-xs text-zinc-500 font-semibold">
                Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Mật khẩu hiện tại</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Mật khẩu mới</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-455 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
                <input 
                  type="password"
                  value={newPasswordConfirmation}
                  onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                  className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Status notifications inside modal */}
              {pwError && (
                <div className="bg-red-50 text-[#b7152b] border border-red-100 rounded-xl px-3.5 py-2.5 text-[11px] font-bold">
                  {pwError}
                </div>
              )}

              {pwSuccess && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl px-3.5 py-2.5 text-[11px] font-bold flex items-center gap-1.5 animate-scale-up">
                  <CheckCircle2 size={13} />
                  {pwSuccess}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setPwError("");
                    setPwSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setNewPasswordConfirmation("");
                  }}
                  className="h-10 px-4 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-955 font-bold text-xs rounded-full transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="h-10 px-5 bg-[#b7152b] hover:bg-red-700 disabled:bg-zinc-300 text-white font-bold text-xs rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {pwLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Xác nhận</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
