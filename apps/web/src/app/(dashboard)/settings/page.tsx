"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Target,
  UserRound,
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

interface SettingsUser {
  id: string;
  email: string;
  display_name: string;
  jlpt_target_level: JLPTLevel | null;
  learning_goal_minutes: number | null;
}

interface ProfileValues {
  displayName: string;
  jlptLevel: JLPTLevel;
  dailyGoal: number;
}

const jlptLevels: { level: JLPTLevel; title: string; caption: string }[] = [
  { level: "N5", title: "Sơ cấp", caption: "Bắt đầu" },
  { level: "N4", title: "Sơ cấp", caption: "Cơ bản" },
  { level: "N3", title: "Trung cấp", caption: "Giao tiếp" },
  { level: "N2", title: "Trung cao", caption: "Thành thạo" },
  { level: "N1", title: "Cao cấp", caption: "Nâng cao" },
];

const dailyGoals = [15, 30, 60];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>((user?.jlpt_target_level as JLPTLevel) || "N5");
  const [dailyGoal, setDailyGoal] = useState(user?.learning_goal_minutes || 15);
  const [savedProfile, setSavedProfile] = useState<ProfileValues>({
    displayName: user?.display_name || "",
    jlptLevel: (user?.jlpt_target_level as JLPTLevel) || "N5",
    dailyGoal: user?.learning_goal_minutes || 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    document.title = "Cài đặt tài khoản | KujiLingo";
    let cancelled = false;

    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axiosClient.get("/api/v1/auth/me");
        if (cancelled) return;
        const profile = response.data?.data as SettingsUser | undefined;
        if (profile) {
          setDisplayName(profile.display_name || "");
          setJlptLevel(profile.jlpt_target_level || "N5");
          setDailyGoal(profile.learning_goal_minutes || 15);
          setSavedProfile({
            displayName: profile.display_name || "",
            jlptLevel: profile.jlpt_target_level || "N5",
            dailyGoal: profile.learning_goal_minutes || 15,
          });
        }
      } catch {
        if (!cancelled) setPageError("Không tải được thông tin tài khoản. Bạn vẫn có thể thử lưu lại.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSettings();
    return () => { cancelled = true; };
  }, [user]);

  const saveProfile = async () => {
    setPageError("");
    setSaveMessage("");
    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setPageError("Tên hiển thị không được để trống.");
      return;
    }
    if (normalizedName.length > 100) {
      setPageError("Tên hiển thị tối đa 100 ký tự.");
      return;
    }

    setSaving(true);
    try {
      const response = await axiosClient.patch("/api/v1/auth/me", {
        display_name: normalizedName,
        jlpt_target_level: jlptLevel,
        learning_goal_minutes: dailyGoal,
      });
      const saved = response.data?.data as SettingsUser | undefined;
      if (!saved) throw new Error("Invalid profile response");

      updateUser({
        display_name: saved.display_name,
        jlpt_target_level: saved.jlpt_target_level || undefined,
        learning_goal_minutes: saved.learning_goal_minutes || dailyGoal,
      });
      setDisplayName(saved.display_name);
      setSavedProfile({ displayName: saved.display_name, jlptLevel, dailyGoal });
      setSaveMessage("Đã lưu thay đổi tài khoản.");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      setPageError(axiosError.response?.data?.error?.message || "Không thể lưu cài đặt. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError("Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ cái và chữ số.");
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setPasswordError("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }

    setPasswordBusy(true);
    try {
      await axiosClient.patch("/api/v1/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: passwordConfirmation,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordConfirmation("");
      setPasswordMessage("Đổi mật khẩu thành công.");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const apiError = axiosError.response?.data?.error;
      setPasswordError(apiError?.code === "INVALID_CURRENT_PASSWORD"
        ? "Mật khẩu hiện tại không chính xác."
        : apiError?.code === "PASSWORD_UNCHANGED"
          ? "Mật khẩu mới phải khác mật khẩu hiện tại."
          : apiError?.message || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setPasswordBusy(false);
    }
  };

  const resetProfile = () => {
    setDisplayName(savedProfile.displayName);
    setJlptLevel(savedProfile.jlptLevel);
    setDailyGoal(savedProfile.dailyGoal);
    setPageError("");
    setSaveMessage("");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-[#c8102e]">
          <SettingsIcon size={21} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">Cài đặt tài khoản</h1>
          <p className="mt-1 text-sm text-zinc-500">Quản lý hồ sơ, mục tiêu học tập và bảo mật.</p>
        </div>
      </header>

      {pageError && (
        <div role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 text-sm font-semibold text-rose-700">
          {pageError}
        </div>
      )}
      {saveMessage && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700">
          <CheckCircle2 size={17} /> {saveMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-[#c8102e]"><UserRound size={21} /></div>
            <div>
              <h2 className="font-extrabold text-zinc-900">Hồ sơ cá nhân</h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">Thông tin hiển thị trong tài khoản</p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-zinc-600">Tên hiển thị</span>
              <input
                value={displayName}
                maxLength={100}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Tên của bạn"
                disabled={loading}
                className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100 disabled:bg-zinc-50"
              />
            </label>
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-600">Email</span>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-500">
                <Mail size={16} className="text-zinc-400" /> {user?.email || "—"}
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-zinc-400">Không thể sửa</span>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-zinc-50 px-4 py-3.5">
              <Globe2 size={17} className="mt-0.5 shrink-0 text-zinc-500" />
              <div>
                <p className="text-xs font-bold text-zinc-700">Ngôn ngữ giao diện</p>
                <p className="mt-1 text-xs text-zinc-500">Tiếng Việt · Ngôn ngữ học: Tiếng Nhật</p>
              </div>
              <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-zinc-400">Mặc định</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Target size={21} /></div>
            <div>
              <h2 className="font-extrabold text-zinc-900">Mục tiêu học tập</h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">Điều chỉnh lộ trình theo kế hoạch của bạn</p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-600"><BookOpen size={15} /> Mục tiêu JLPT</div>
            <div className="grid grid-cols-5 gap-2">
              {jlptLevels.map(({ level, title, caption }) => {
                const selected = jlptLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setJlptLevel(level)}
                    aria-pressed={selected}
                    className={`rounded-xl border px-1 py-3 text-center transition ${selected ? "border-[#c8102e] bg-rose-50 text-[#b7152b] ring-2 ring-rose-100" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"}`}
                  >
                    <span className="block text-sm font-extrabold">{level}</span>
                    <span className="mt-1 block text-[9px] font-semibold sm:text-[10px]">{caption}</span>
                    <span className="sr-only">{title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-600"><Clock3 size={15} /> Mục tiêu học mỗi ngày</div>
            <div className="grid grid-cols-3 gap-2">
              {dailyGoals.map((minutes) => {
                const selected = dailyGoal === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setDailyGoal(minutes)}
                    aria-pressed={selected}
                    className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${selected ? "border-[#c8102e] bg-rose-50 text-[#b7152b]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}
                  >
                    {minutes} phút
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-400">Mục tiêu này giúp theo dõi thời gian học và chuỗi học tập.</p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><ShieldCheck size={21} /></div>
            <div>
              <h2 className="font-extrabold text-zinc-900">Bảo mật tài khoản</h2>
              <p className="mt-0.5 text-xs font-medium text-zinc-500">Đổi mật khẩu để bảo vệ tài khoản của bạn</p>
            </div>
          </div>

          <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Mật khẩu hiện tại", value: currentPassword, set: setCurrentPassword, autoComplete: "current-password" },
              { label: "Mật khẩu mới", value: newPassword, set: setNewPassword, autoComplete: "new-password" },
              { label: "Xác nhận mật khẩu mới", value: passwordConfirmation, set: setPasswordConfirmation, autoComplete: "new-password" },
            ].map((field) => (
              <label key={field.label} className="block space-y-2">
                <span className="text-xs font-bold text-zinc-600">{field.label}</span>
                <span className="relative block">
                  <LockKeyhole size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="password"
                    autoComplete={field.autoComplete}
                    required
                    value={field.value}
                    onChange={(event) => field.set(event.target.value)}
                    className="h-12 w-full rounded-xl border border-zinc-200 pl-11 pr-4 text-sm outline-none transition focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100"
                  />
                </span>
              </label>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
              <p className="text-xs text-zinc-400">Dùng ít nhất 8 ký tự, bao gồm chữ cái và chữ số.</p>
              <button type="submit" disabled={passwordBusy} className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60">
                {passwordBusy ? <LoaderCircle size={15} className="animate-spin" /> : <LockKeyhole size={15} />}
                Đổi mật khẩu
              </button>
            </div>
            {(passwordError || passwordMessage) && (
              <p role={passwordError ? "alert" : "status"} className={`flex items-center gap-2 text-xs font-semibold md:col-span-3 ${passwordError ? "text-rose-700" : "text-emerald-700"}`}>
                {passwordMessage && <CheckCircle2 size={15} />}{passwordError || passwordMessage}
              </p>
            )}
          </form>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <Check size={15} className="text-emerald-600" /> Thay đổi hồ sơ và mục tiêu học sẽ được lưu vào tài khoản.
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={resetProfile} disabled={saving || loading} className="h-10 rounded-full px-4 text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-50">Đặt lại</button>
          <button type="button" onClick={saveProfile} disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#b7152b] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#9e1024] disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </main>
  );
}
