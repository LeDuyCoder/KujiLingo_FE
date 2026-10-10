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
import { useLanguage, type AppLanguage } from "@/shared/i18n/language";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type SettingsUser = {
  id: string;
  email: string;
  display_name: string;
  jlpt_target_level: JLPTLevel | null;
  learning_goal_minutes: number | null;
  preferred_language: AppLanguage;
};

const levels: { level: JLPTLevel; caption: string }[] = [
  { level: "N5", caption: "settings.start" },
  { level: "N4", caption: "settings.basic" },
  { level: "N3", caption: "settings.conversation" },
  { level: "N2", caption: "settings.proficient" },
  { level: "N1", caption: "settings.levelUp" },
];
const dailyGoals = [15, 30, 60];

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { language, setLanguage, t } = useLanguage();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [jlptLevel, setJlptLevel] = useState<JLPTLevel>((user?.jlpt_target_level as JLPTLevel) || "N5");
  const [dailyGoal, setDailyGoal] = useState(user?.learning_goal_minutes || 15);
  const [preferredLanguage, setPreferredLanguage] = useState<AppLanguage>(language);
  const [savedProfile, setSavedProfile] = useState({
    displayName: user?.display_name || "",
    jlptLevel: (user?.jlpt_target_level as JLPTLevel) || "N5",
    dailyGoal: user?.learning_goal_minutes || 15,
    preferredLanguage: language,
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
    document.title = `${t("settings.title")} | KujiLingo`;
  }, [language, t]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await axiosClient.get("/api/v1/auth/me");
        if (cancelled) return;
        const profile = response.data?.data as SettingsUser | undefined;
        if (!profile) return;
        const profileLanguage = profile.preferred_language === "en" ? "en" : "vi";
        setDisplayName(profile.display_name || "");
        setJlptLevel(profile.jlpt_target_level || "N5");
        setDailyGoal(profile.learning_goal_minutes || 15);
        setPreferredLanguage(profileLanguage);
        setSavedProfile({
          displayName: profile.display_name || "",
          jlptLevel: profile.jlpt_target_level || "N5",
          dailyGoal: profile.learning_goal_minutes || 15,
          preferredLanguage: profileLanguage,
        });
      } catch {
        if (!cancelled) setPageError(t("settings.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(Boolean(user));
    void loadSettings();
    return () => { cancelled = true; };
  }, [user?.id, t]);

  const saveProfile = async () => {
    setPageError("");
    setSaveMessage("");
    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setPageError(t("settings.nameRequired"));
      return;
    }
    if (normalizedName.length > 100) {
      setPageError(t("settings.nameTooLong"));
      return;
    }

    setSaving(true);
    try {
      const response = await axiosClient.patch("/api/v1/auth/me", {
        display_name: normalizedName,
        jlpt_target_level: jlptLevel,
        learning_goal_minutes: dailyGoal,
        preferred_language: preferredLanguage,
      });
      const saved = response.data?.data as SettingsUser | undefined;
      if (!saved) throw new Error("Invalid profile response");
      updateUser({
        display_name: saved.display_name,
        jlpt_target_level: saved.jlpt_target_level || undefined,
        learning_goal_minutes: saved.learning_goal_minutes || dailyGoal,
        preferred_language: saved.preferred_language,
      });
      setDisplayName(saved.display_name);
      setPreferredLanguage(saved.preferred_language);
      setLanguage(saved.preferred_language);
      setSavedProfile({
        displayName: saved.display_name,
        jlptLevel: saved.jlpt_target_level || jlptLevel,
        dailyGoal: saved.learning_goal_minutes || dailyGoal,
        preferredLanguage: saved.preferred_language,
      });
      setSaveMessage(t("settings.saved"));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      setPageError(axiosError.response?.data?.error?.message || t("settings.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError(t("settings.passwordInvalid"));
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setPasswordError(t("settings.passwordMismatch"));
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
      setPasswordMessage(t("settings.passwordChanged"));
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: { code?: string; message?: string } } } };
      const apiError = axiosError.response?.data?.error;
      setPasswordError(apiError?.code === "INVALID_CURRENT_PASSWORD"
        ? t("settings.passwordWrong")
        : apiError?.code === "PASSWORD_UNCHANGED"
          ? t("settings.passwordUnchanged")
          : apiError?.message || t("settings.passwordError"));
    } finally {
      setPasswordBusy(false);
    }
  };

  const resetProfile = () => {
    setDisplayName(savedProfile.displayName);
    setJlptLevel(savedProfile.jlptLevel);
    setDailyGoal(savedProfile.dailyGoal);
    setPreferredLanguage(savedProfile.preferredLanguage);
    setPageError("");
    setSaveMessage("");
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-7 pb-12">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-[#c8102e]"><SettingsIcon size={21} /></div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("settings.subtitle")}</p>
        </div>
      </header>

      {pageError && <div role="alert" className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-3.5 text-sm font-semibold text-rose-700">{pageError}</div>}
      {saveMessage && <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17} />{saveMessage}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-[#c8102e]"><UserRound size={21} /></div>
            <div><h2 className="font-extrabold text-zinc-900">{t("settings.profile")}</h2><p className="mt-0.5 text-xs font-medium text-zinc-500">{t("settings.profileDescription")}</p></div>
          </div>
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-zinc-600">{t("settings.displayName")}</span>
              <input value={displayName} maxLength={100} onChange={(event) => setDisplayName(event.target.value)} placeholder={t("settings.yourName")} disabled={loading} className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-800 outline-none transition focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100 disabled:bg-zinc-50" />
            </label>
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-600">{t("settings.email")}</span>
              <div className="flex h-12 items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 text-sm font-semibold text-zinc-500"><Mail size={16} className="text-zinc-400" />{user?.email || "—"}<span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-zinc-400">{t("settings.cannotEdit")}</span></div>
            </div>
            <div className="space-y-3 rounded-2xl border border-zinc-100 p-4">
              <div className="flex items-start gap-3">
                <Globe2 size={17} className="mt-0.5 shrink-0 text-zinc-500" />
                <div><p className="text-xs font-bold text-zinc-700">{t("settings.interfaceLanguage")}</p><p className="mt-1 text-xs text-zinc-500">{t("settings.languageDescription")}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("settings.interfaceLanguage")}>
                {(["vi", "en"] as AppLanguage[]).map((item) => {
                  const selected = preferredLanguage === item;
                  return <button key={item} type="button" onClick={() => setPreferredLanguage(item)} aria-pressed={selected} className={`h-11 rounded-xl border text-sm font-bold transition ${selected ? "border-[#c8102e] bg-rose-50 text-[#b7152b] ring-2 ring-rose-100" : "border-zinc-200 text-zinc-600 hover:border-zinc-300"}`}>{item === "vi" ? t("settings.vietnamese") : t("settings.english")}</button>;
                })}
              </div>
              <p className="text-xs text-zinc-400">{t("settings.learningLanguage")}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Target size={21} /></div>
            <div><h2 className="font-extrabold text-zinc-900">{t("settings.learningGoals")}</h2><p className="mt-0.5 text-xs font-medium text-zinc-500">{t("settings.learningGoalsDescription")}</p></div>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-600"><BookOpen size={15} />{t("settings.jlptGoal")}</div>
            <div className="grid grid-cols-5 gap-2">
              {levels.map(({ level, caption }) => {
                const selected = jlptLevel === level;
                return <button key={level} type="button" onClick={() => setJlptLevel(level)} aria-pressed={selected} className={`rounded-xl border px-1 py-3 text-center transition ${selected ? "border-[#c8102e] bg-rose-50 text-[#b7152b] ring-2 ring-rose-100" : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"}`}><span className="block text-sm font-extrabold">{level}</span><span className="mt-1 block text-[9px] font-semibold sm:text-[10px]">{t(caption)}</span></button>;
              })}
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold text-zinc-600"><Clock3 size={15} />{t("settings.dailyGoal")}</div>
            <div className="grid grid-cols-3 gap-2">
              {dailyGoals.map((minutes) => <button key={minutes} type="button" onClick={() => setDailyGoal(minutes)} aria-pressed={dailyGoal === minutes} className={`rounded-xl border px-2 py-3 text-xs font-bold transition ${dailyGoal === minutes ? "border-[#c8102e] bg-rose-50 text-[#b7152b]" : "border-zinc-200 text-zinc-500 hover:border-zinc-300"}`}>{minutes} {t("settings.minutes")}</button>)}
            </div>
            <p className="mt-3 text-xs text-zinc-400">{t("settings.goalHint")}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm sm:p-8 lg:col-span-2">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600"><ShieldCheck size={21} /></div>
            <div><h2 className="font-extrabold text-zinc-900">{t("settings.security")}</h2><p className="mt-0.5 text-xs font-medium text-zinc-500">{t("settings.securityDescription")}</p></div>
          </div>
          <form onSubmit={changePassword} className="grid gap-4 md:grid-cols-3">
            {[
              { label: t("settings.currentPassword"), placeholder: t("settings.currentPasswordPlaceholder"), value: currentPassword, set: setCurrentPassword, autoComplete: "current-password" },
              { label: t("settings.newPassword"), placeholder: t("settings.newPasswordPlaceholder"), hint: t("settings.passwordHint"), value: newPassword, set: setNewPassword, autoComplete: "new-password" },
              { label: t("settings.confirmPassword"), placeholder: t("settings.confirmPasswordPlaceholder"), value: passwordConfirmation, set: setPasswordConfirmation, autoComplete: "new-password" },
            ].map((field) => <label key={field.label} className="block space-y-2"><span className="text-xs font-bold text-zinc-600">{field.label}</span><span className="relative block"><LockKeyhole size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" /><input type="password" autoComplete={field.autoComplete} placeholder={field.placeholder} required value={field.value} onChange={(event) => field.set(event.target.value)} className="h-12 w-full rounded-xl border border-zinc-200 pl-11 pr-4 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#c8102e] focus:ring-4 focus:ring-rose-100" /></span>{field.hint && <span className="block text-[11px] leading-relaxed text-zinc-500">{field.hint}</span>}</label>)}
            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
              <button type="submit" disabled={passwordBusy} className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 px-5 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60">{passwordBusy ? <LoaderCircle size={15} className="animate-spin" /> : <LockKeyhole size={15} />}{passwordBusy ? t("settings.changingPassword") : t("settings.changePassword")}</button>
            </div>
            {(passwordError || passwordMessage) && <p role={passwordError ? "alert" : "status"} className={`flex items-center gap-2 text-xs font-semibold md:col-span-3 ${passwordError ? "text-rose-700" : "text-emerald-700"}`}>{passwordMessage && <CheckCircle2 size={15} />}{passwordError || passwordMessage}</p>}
          </form>
        </section>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500"><Check size={15} className="text-emerald-600" />{t("settings.profileSavedHint")}</div>
        <div className="flex gap-2">
          <button type="button" onClick={resetProfile} disabled={saving || loading} className="h-10 rounded-full px-4 text-xs font-bold text-zinc-500 transition hover:bg-zinc-100 disabled:opacity-50">{t("settings.reset")}</button>
          <button type="button" onClick={saveProfile} disabled={saving || loading} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#b7152b] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#9e1024] disabled:cursor-not-allowed disabled:opacity-60">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? t("settings.saving") : t("settings.save")}</button>
        </div>
      </div>
    </main>
  );
}
