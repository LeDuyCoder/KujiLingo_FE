/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Flame, Bell, User, Menu, Trophy, Zap, Coins, Gem, LogOut, Award, CheckCircle2, X, BookOpen, GraduationCap, Languages, Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { useLanguage } from "@/shared/i18n/language";

interface HeaderProps {
  onMenuClick?: () => void;
}

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
}

interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  kind: "achievement" | "streak" | "goal";
  href: string;
}

interface AchievementNotice {
  id: string;
  title: string;
  description: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

type HeaderSearchItem = {
  id: string;
  kind: "course" | "lesson" | "vocabulary";
  title: string;
  subtitle: string;
  href: string;
};

type SearchCourse = { id: string; title: string | null; lesson_count?: number };
type SearchLesson = { id: string; title: string | null };
type SearchVocabulary = {
  id: string;
  term_jp: string;
  reading_hiragana?: string;
  meaning_vi?: string;
  meaning_en?: string;
  jlpt_level?: string;
};

function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi");
}

function getVietnamDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsReadLoaded, setNotificationsReadLoaded] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [wallet, setWallet] = useState<{ coins: number; gems: number } | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [headerSearchItems, setHeaderSearchItems] = useState<HeaderSearchItem[]>([]);
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);
  const [headerSearchLoading, setHeaderSearchLoading] = useState(false);
  const [headerSearchFailed, setHeaderSearchFailed] = useState(false);
  const [headerSearchActiveIndex, setHeaderSearchActiveIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [equippedItems, setEquippedItems] = useState<any[] | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const courseSearchIndexRef = useRef<Promise<HeaderSearchItem[]> | null>(null);

  // Click outside dropdown logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setHeaderSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCourseSearchIndex = useCallback(() => {
    if (!courseSearchIndexRef.current) {
      courseSearchIndexRef.current = axiosClient.get("/courses", { params: { page: 1, limit: 20 } })
        .then(async (response) => {
          const courses = (response.data?.data ?? []) as SearchCourse[];
          const details = await Promise.allSettled(
            courses.map((course) => axiosClient.get(`/courses/${course.id}`))
          );

          return courses.flatMap((course, index) => {
            const courseTitle = course.title?.trim() || "Khóa học";
            const courseItem: HeaderSearchItem = {
              id: `course:${course.id}`,
              kind: "course",
              title: courseTitle,
              subtitle: `${course.lesson_count ?? 0} bài học`,
              href: `/courses/${course.id}`,
            };
            const detail = details[index];
            const lessons = detail?.status === "fulfilled"
              ? ((detail.value.data?.data?.lessons ?? []) as SearchLesson[])
              : [];
            const lessonItems: HeaderSearchItem[] = lessons
              .filter((lesson) => Boolean(lesson.title?.trim()))
              .map((lesson) => ({
                id: `lesson:${lesson.id}`,
                kind: "lesson",
                title: lesson.title!.trim(),
                subtitle: courseTitle,
                href: `/lessons/${lesson.id}`,
              }));

            return [courseItem, ...lessonItems];
          });
        })
        .catch((error) => {
          courseSearchIndexRef.current = null;
          throw error;
        });
    }
    return courseSearchIndexRef.current!;
  }, []);

  useEffect(() => {
    const query = headerSearchQuery.trim();
    if (query.length < 1) {
      const timer = window.setTimeout(() => {
        setHeaderSearchItems([]);
        setHeaderSearchLoading(false);
        setHeaderSearchFailed(false);
        setHeaderSearchActiveIndex(0);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setHeaderSearchLoading(true);
      setHeaderSearchFailed(false);

      const [courseResult, vocabularyResult] = await Promise.allSettled([
        query.length >= 2 ? getCourseSearchIndex() : Promise.resolve([]),
        axiosClient.get("/dictionary/search", {
          params: { q: query },
          signal: controller.signal,
        }),
      ]);

      if (!active) return;

      const normalizedQuery = normalizeSearchText(query);
      const courseMatches = courseResult.status === "fulfilled"
        ? courseResult.value.filter((item) => normalizeSearchText(`${item.title} ${item.subtitle}`).includes(normalizedQuery))
        : [];
      const vocabularies = vocabularyResult.status === "fulfilled"
        ? (vocabularyResult.value.data?.data ?? []) as SearchVocabulary[]
        : [];
      const vocabularyMatches: HeaderSearchItem[] = vocabularies.slice(0, 5).map((entry) => ({
        id: `vocabulary:${entry.id}`,
        kind: "vocabulary",
        title: entry.term_jp,
        subtitle: [entry.reading_hiragana, (language === "en" ? entry.meaning_en || entry.meaning_vi : entry.meaning_vi || entry.meaning_en), entry.jlpt_level].filter(Boolean).join(" · "),
        href: `/dictionary?q=${encodeURIComponent(entry.term_jp)}`,
      }));
      const uniqueCourseMatches = courseMatches.filter((item, index, items) => items.findIndex((match) => match.id === item.id) === index);

      setHeaderSearchItems([...uniqueCourseMatches.slice(0, 6), ...vocabularyMatches].slice(0, 10));
      setHeaderSearchFailed(courseResult.status === "rejected" && vocabularyResult.status === "rejected");
      setHeaderSearchActiveIndex(0);
      setHeaderSearchLoading(false);
    }, 250);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [getCourseSearchIndex, headerSearchQuery, language]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (!user?.id) {
        setReadNotificationIds([]);
        setNotificationsReadLoaded(false);
        return;
      }
      try {
        const storedIds = localStorage.getItem(`kujilingo-notifications-read:${user.id}`);
        const parsed = storedIds ? JSON.parse(storedIds) : [];
        setReadNotificationIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
      } catch {
        setReadNotificationIds([]);
      } finally {
        setNotificationsReadLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const fetchWallet = async () => {
    try {
      const res = await axiosClient.get("/api/v1/shop/wallet");
      if (res.data?.success) {
        setWallet(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching wallet inside header:", err);
    }
  };

  const toggleProfileDropdown = () => {
    const nextState = !isProfileDropdownOpen;
    setIsProfileDropdownOpen(nextState);
    if (nextState) {
      fetchWallet();
    }
  };

  const refreshAchievementNotifications = async () => {
    try {
      const response = await axiosClient.get("/api/v1/achievements/me", { params: { unlocked_only: true } });
      const unlocked = response.data?.data?.items as AchievementNotice[] | undefined;
      if (!unlocked) return;

      const achievementNotifications = unlocked.filter((item) => item.is_unlocked).map((item) => ({
        id: `achievement:${item.id}`,
        title: `Mở khóa thành tựu: ${item.title}`,
        message: item.description,
        createdAt: item.unlocked_at || new Date().toISOString(),
        kind: "achievement" as const,
        href: "/achievements",
      }));
      setNotifications((current) => [
        ...current.filter((item) => item.kind !== "achievement"),
        ...achievementNotifications,
      ].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, 12));
    } catch (err) {
      console.error("Error refreshing achievement notifications:", err);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const [dashboardRes, equippedRes, achievementsRes] = await Promise.all([
          axiosClient.get("/dashboard"),
          axiosClient.get("/api/v1/shop/equipped").catch(() => null),
          axiosClient.get("/api/v1/achievements/me", { params: { unlocked_only: true } }).catch(() => null),
        ]);
        const nextNotifications: AppNotification[] = [];
        if (dashboardRes.data && dashboardRes.data.success) {
          const summary = dashboardRes.data.data as DashboardData;
          setDashboardData(summary);
          const today = getVietnamDateKey();
          if (summary?.streak?.is_at_risk) {
            nextNotifications.push({
              id: `streak-risk:${today}`,
              title: "Giữ chuỗi học tập nhé!",
              message: `Bạn đang có chuỗi ${summary.streak.current_streak_days} ngày. Hãy học một chút hôm nay để duy trì nhé.`,
              createdAt: new Date().toISOString(),
              kind: "streak",
              href: "/home",
            });
          }
          if (summary?.daily_goal_progress?.percent >= 100) {
            nextNotifications.push({
              id: `daily-goal:${today}`,
              title: "Bạn đã hoàn thành mục tiêu hôm nay!",
              message: `Bạn đã học đủ ${summary.daily_goal_progress.goal_minutes} phút. Tuyệt vời, tiếp tục giữ nhịp nhé!`,
              createdAt: new Date().toISOString(),
              kind: "goal",
              href: "/home",
            });
          }
        }
        if (equippedRes?.data?.success) {
          setEquippedItems(equippedRes.data.data);
        }
        const unlocked = achievementsRes?.data?.data?.items as AchievementNotice[] | undefined;
        unlocked?.filter((item) => item.is_unlocked).forEach((item) => {
          nextNotifications.push({
            id: `achievement:${item.id}`,
            title: `Mở khóa thành tựu: ${item.title}`,
            message: item.description,
            createdAt: item.unlocked_at || new Date().toISOString(),
            kind: "achievement",
            href: "/achievements",
          });
        });
        nextNotifications.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
        setNotifications(nextNotifications.slice(0, 12));
        setNotificationsLoaded(true);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setNotificationsLoaded(true);
      } finally {
        setNotificationsLoading(false);
      }
    };

    if (mounted && user) {
      const handle = setTimeout(() => {
        setNotificationsLoading(true);
        fetchDashboardSummary();
      }, 0);
      return () => clearTimeout(handle);
    } else if (mounted) {
      const handle = setTimeout(() => {
        setNotificationsLoading(false);
        setNotificationsLoaded(true);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [mounted, user]);

  // Send activity ping to backend every 60 seconds to track study minutes & active streak
  useEffect(() => {
    if (!mounted || !user) return;

    const sendPing = async () => {
      // Optimization: Only ping if the browser window/tab is active and visible to the user
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      // Optimization: Skip ping if today's study target goal has already been fully completed (100%)
      if (dashboardData && dashboardData.daily_goal_progress.percent >= 100) {
        return;
      }

      try {
        const response = await axiosClient.post("/api/v1/statistics/ping", {});
        if (response.data && response.data.success && response.data.data) {
          const { streak: newStreak, minutes_studied_today: newMins, percent: newPercent } = response.data.data;
          if (newPercent >= 100) {
            const today = getVietnamDateKey();
            setNotifications((current) => current.some((item) => item.id === `daily-goal:${today}`)
              ? current
              : [{
                  id: `daily-goal:${today}`,
                  title: "Bạn đã hoàn thành mục tiêu hôm nay!",
                  message: `Bạn đã học đủ ${dashboardData?.daily_goal_progress.goal_minutes ?? 15} phút. Tuyệt vời, tiếp tục giữ nhịp nhé!`,
                  createdAt: new Date().toISOString(),
                  kind: "goal" as const,
                  href: "/home",
                }, ...current].slice(0, 12));
          }
          setDashboardData((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              streak: {
                ...prev.streak,
                current_streak_days: newStreak
              },
              daily_goal_progress: {
                ...prev.daily_goal_progress,
                minutes_studied_today: newMins,
                percent: newPercent
              }
            };
          });
        }
      } catch (err) {
        console.error("Error sending activity ping:", err);
      }
    };

    // Send initial ping after 5 seconds of active session
    const initialTimeout = setTimeout(sendPing, 5000);

    const intervalId = setInterval(sendPing, 60000); // 60 seconds
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user, dashboardData?.daily_goal_progress.percent]);

  const displayName = mounted && user?.display_name ? user.display_name : "...";
  const isPremium = mounted && user?.is_premium ? user.is_premium : false;
  const planStatus = isPremium ? t("premium.membership") : t("wallet.freePlan");
  const unreadCount = notificationsLoaded && notificationsReadLoaded
    ? notifications.filter((item) => !readNotificationIds.includes(item.id)).length
    : 0;

  const markNotificationRead = (notificationId: string) => {
    const nextIds = Array.from(new Set([...readNotificationIds, notificationId])).slice(-300);
    setReadNotificationIds(nextIds);
    if (user?.id) localStorage.setItem(`kujilingo-notifications-read:${user.id}`, JSON.stringify(nextIds));
  };

  const markAllNotificationsRead = () => {
    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((item) => item.id)])).slice(-300);
    setReadNotificationIds(nextIds);
    if (user?.id) localStorage.setItem(`kujilingo-notifications-read:${user.id}`, JSON.stringify(nextIds));
  };

  const formatNotificationDate = (value: string) => {
    const date = new Date(value);
    const locale = language === "vi" ? "vi-VN" : "en-US";
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  };

  const selectHeaderSearchItem = (href: string) => {
    setHeaderSearchOpen(false);
    setHeaderSearchQuery("");
    const target = new URL(href, window.location.origin);
    if (target.pathname === "/dictionary" && target.searchParams.has("q")) {
      window.dispatchEvent(new CustomEvent("kujilingo:global-search", {
        detail: { query: target.searchParams.get("q") ?? "" },
      }));
    }
    router.push(href);
  };

  const handleHeaderSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setHeaderSearchOpen(false);
      return;
    }
    if (event.key === "ArrowDown" && headerSearchItems.length) {
      event.preventDefault();
      setHeaderSearchActiveIndex((index) => (index + 1) % headerSearchItems.length);
      setHeaderSearchOpen(true);
      return;
    }
    if (event.key === "ArrowUp" && headerSearchItems.length) {
      event.preventDefault();
      setHeaderSearchActiveIndex((index) => (index - 1 + headerSearchItems.length) % headerSearchItems.length);
      setHeaderSearchOpen(true);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = headerSearchItems[headerSearchActiveIndex];
      if (selected) selectHeaderSearchItem(selected.href);
      else if (headerSearchQuery.trim().length >= 1) {
        selectHeaderSearchItem(`/dictionary?q=${encodeURIComponent(headerSearchQuery.trim())}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-4 sm:px-6 lg:px-9">
      {/* Mobile Menu Toggle & Search */}
      <div className="flex items-center flex-1 max-w-md mr-4">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-3 lg:hidden p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label={t("header.toggleNavigation")}
          >
            <Menu size={22} />
          </button>
        )}
        <div ref={searchContainerRef} className="relative flex-1">
          {headerSearchLoading
            ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" size={18} aria-hidden="true" />
            : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} aria-hidden="true" />}
          <input
            type="text"
            placeholder={t("header.searchPlaceholder")}
            value={headerSearchQuery}
            role="combobox"
            aria-label={t("header.searchLabel")}
            aria-autocomplete="list"
            aria-expanded={headerSearchOpen && headerSearchQuery.trim().length >= 1}
            aria-controls="header-global-search-results"
            aria-activedescendant={headerSearchOpen && headerSearchItems.length ? `header-search-result-${headerSearchActiveIndex}` : undefined}
            onFocus={() => {
              if (headerSearchQuery.trim().length >= 1) setHeaderSearchOpen(true);
            }}
            onChange={(event) => {
              setHeaderSearchQuery(event.target.value);
              setHeaderSearchItems([]);
              setHeaderSearchLoading(event.target.value.trim().length > 0);
              setHeaderSearchFailed(false);
              setHeaderSearchOpen(true);
              setHeaderSearchActiveIndex(0);
            }}
            onKeyDown={handleHeaderSearchKeyDown}
            className="w-full h-11 pl-11 pr-4 bg-zinc-50 border border-zinc-200 rounded-full text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#b7152b]/10 focus:border-[#b7152b] transition-all"
          />
          {headerSearchOpen && headerSearchQuery.trim().length >= 1 && (
            <div
              id="header-global-search-results"
              role="listbox"
              aria-label={t("header.searchResults")}
              className="absolute right-0 top-full z-[70] mt-2 max-h-[min(70vh,480px)] w-[min(420px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 text-left shadow-xl"
            >
              {headerSearchLoading ? (
                <div role="status" className="px-3 py-4 text-center text-sm text-zinc-600">{t("header.searching")}</div>
              ) : headerSearchFailed ? (
                <div role="status" className="px-3 py-4 text-center text-sm text-zinc-600">{t("header.searchFailed")}</div>
              ) : headerSearchItems.length ? (
                <div className="space-y-1">
                  {headerSearchItems.map((item, index) => {
                    const ResultIcon = item.kind === "course" ? GraduationCap : item.kind === "lesson" ? BookOpen : Languages;
                    const kindLabel = item.kind === "course" ? t("header.course") : item.kind === "lesson" ? t("header.lesson") : t("header.vocabulary");
                    return (
                      <Link
                        id={`header-search-result-${index}`}
                        key={item.id}
                        href={item.href}
                        role="option"
                        aria-selected={index === headerSearchActiveIndex}
                        onMouseEnter={() => setHeaderSearchActiveIndex(index)}
                        onClick={(event) => {
                          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                          event.preventDefault();
                          selectHeaderSearchItem(item.href);
                        }}
                        className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${index === headerSearchActiveIndex ? "bg-red-50 text-[#b7152b]" : "text-zinc-800 hover:bg-zinc-50"}`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${index === headerSearchActiveIndex ? "bg-white text-[#b7152b]" : "bg-zinc-100 text-zinc-600"}`}>
                          <ResultIcon size={17} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-zinc-600">{item.subtitle || kindLabel}</span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-zinc-600">{kindLabel}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-zinc-600">{t("header.noResults")}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Upgrade Pro button if not premium */}
        {!isPremium && (
          <Link
            href="/premium"
            className="hidden sm:inline-block text-[#b7152b] text-sm font-semibold hover:text-[#9B1C1C] transition-colors"
          >
                {t("premium.upgradeToday")}
          </Link>
        )}

        {/* Streak Button with Popover */}
        <div
          className="relative"
          onMouseEnter={() => setIsPopoverVisible(true)}
          onMouseLeave={() => setIsPopoverVisible(false)}
        >
          <button
            onClick={() => setIsPopoverVisible(!isPopoverVisible)}
            className="flex items-center gap-1 px-2.5 py-1.5 md:gap-1.5 md:px-3.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/50 rounded-full text-amber-700 text-sm font-bold shadow-sm shadow-amber-50/30 transition-all duration-200 cursor-pointer"
          >
            <Flame size={18} fill="currentColor" className="text-amber-500" />
            <span>{dashboardData?.streak?.current_streak_days ?? 0}</span>
          </button>

          {/* Interactive Streak & Goal Balloon */}
          {isPopoverVisible && dashboardData && (
            <div className="absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-md border border-zinc-100 rounded-3xl p-5 shadow-2xl z-50 animate-scale-up space-y-4">
              {/* Header section with big flame */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shadow-inner">
                  <Flame size={32} fill="currentColor" className="text-amber-500 animate-[sway_3s_ease-in-out_infinite]" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider block">{t("header.streakLabel")}</span>
                  <span className="text-2xl font-black text-zinc-950 leading-tight">
                    {dashboardData.streak.current_streak_days.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t("header.days")}
                  </span>
                </div>
              </div>

              {/* Record / Best Streak */}
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-2.5">
                <Trophy size={14} className="text-yellow-500" />
                <span>{t("header.learningRecord")}</span>
                <span className="text-zinc-800 ml-auto">{dashboardData.streak.longest_streak_days.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} {t("header.days")}</span>
              </div>

              {/* Status indicator message */}
              {dashboardData.streak.is_at_risk ? (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold rounded-2xl p-3.5 leading-relaxed">
                  {t("header.streakAtRisk")}
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-2xl p-3.5 leading-relaxed">
                  {t("header.streakProtected")}
                </div>
              )}

              <hr className="border-zinc-100" />

              {/* Daily progress tracking inside popover */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    <Zap size={11} className="text-amber-500 fill-amber-500" />
                    <span>{t("header.dailyGoal")}</span>
                  </div>
                  <span>{dashboardData.daily_goal_progress.percent}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300"
                    style={{ width: `${dashboardData.daily_goal_progress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                  <span>{t("header.todayMinutes").replace("{minutes}", dashboardData.daily_goal_progress.minutes_studied_today.toLocaleString(language === "vi" ? "vi-VN" : "en-US"))}</span>
                  <span>{t("header.goalMinutes").replace("{minutes}", dashboardData.daily_goal_progress.goal_minutes.toLocaleString(language === "vi" ? "vi-VN" : "en-US"))}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            aria-label={unreadCount ? `${t("header.notifications")}, ${unreadCount} ${t("header.unread")}` : t("header.notifications")}
            aria-expanded={isNotificationsOpen}
            onClick={() => {
              const shouldOpen = !isNotificationsOpen;
              setIsNotificationsOpen(shouldOpen);
              setIsProfileDropdownOpen(false);
              if (shouldOpen) void refreshAchievementNotifications();
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${isNotificationsOpen ? "border-zinc-300 bg-zinc-100 text-zinc-900" : "border-transparent bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-600 px-0.5 text-[8px] font-extrabold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <section aria-label={t("header.notificationList")} className="absolute right-0 top-12 z-[60] w-[min(360px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-zinc-100 bg-white text-left shadow-2xl animate-scale-up">
              <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5">
                <div>
                  <h2 className="text-sm font-extrabold text-zinc-900">{t("header.notifications")}</h2>
                  <p className="mt-0.5 text-[10px] font-semibold text-zinc-400">
                    {unreadCount ? `${unreadCount} ${t("header.notifications").toLocaleLowerCase()} ${t("header.unread")}` : t("header.updated")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button type="button" onClick={markAllNotificationsRead} className="text-[10px] font-bold text-[#b7152b] hover:underline">
                      {t("header.allRead")}
                    </button>
                  )}
                  <button type="button" aria-label={t("header.closeNotifications")} onClick={() => setIsNotificationsOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                    <X size={15} />
                  </button>
                </div>
              </header>

              <div className="max-h-[min(420px,65vh)] overflow-y-auto">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs font-semibold text-zinc-400">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#b7152b]" /> {t("header.loadingNotifications")}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-50 text-zinc-400"><Bell size={19} /></div>
                    <p className="text-xs font-bold text-zinc-600">{t("header.noNotifications")}</p>
                    <p className="mt-1 text-[10px] text-zinc-400">{t("header.notificationHint")}</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isRead = readNotificationIds.includes(notification.id);
                    const NoticeIcon = notification.kind === "achievement" ? Award : notification.kind === "goal" ? CheckCircle2 : Flame;
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(notification.id);
                          setIsNotificationsOpen(false);
                          router.push(notification.href);
                        }}
                        className={`flex w-full gap-3 border-b border-zinc-50 px-4 py-3.5 text-left transition hover:bg-zinc-50 ${isRead ? "bg-white" : "bg-rose-50/50"}`}
                      >
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.kind === "achievement" ? "bg-amber-50 text-amber-600" : notification.kind === "goal" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                          <NoticeIcon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-xs leading-4 ${isRead ? "font-semibold text-zinc-700" : "font-extrabold text-zinc-900"}`}>{notification.title}</span>
                            <span className="shrink-0 text-[9px] font-semibold text-zinc-400">{formatNotificationDate(notification.createdAt)}</span>
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-zinc-500">{notification.message}</span>
                        </span>
                        {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c8102e]" />}
                      </button>
                    );
                  })
                )}
              </div>
              <footer className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-2.5 text-center">
                <Link href="/achievements" onClick={() => setIsNotificationsOpen(false)} className="text-[10px] font-bold text-zinc-500 transition hover:text-[#b7152b]">
                  {t("header.viewAchievements")}
                </Link>
              </footer>
            </section>
          )}
        </div>

        {/* Profile Section with Dropdown Menu */}
        <div 
          ref={dropdownRef}
          className="relative hidden border-l border-zinc-100 pl-3 md:pl-4 lg:block"
        >
          <div 
            onClick={toggleProfileDropdown}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-bold text-zinc-900 leading-none">{displayName}</span>
              <span className="text-[10px] text-zinc-500 font-medium tracking-wide mt-1">{planStatus}</span>
            </div>
            
            <button className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 border border-zinc-200/60 shadow-sm pointer-events-none relative">
              {equippedItems?.find(e => e.item_type === "AVATAR") ? (
                <img src={equippedItems.find(e => e.item_type === "AVATAR")?.image} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={18} strokeWidth={2.5} />
              )}
              {equippedItems?.find(e => e.item_type === "FRAME") && (
                <img 
                  src={equippedItems.find(e => e.item_type === "FRAME")?.image} 
                  alt="Frame" 
                  className="absolute -inset-1.5 w-[130%] h-[130%] max-w-[130%] max-h-[130%] object-cover pointer-events-none scale-110 z-10" 
                />
              )}
            </button>
          </div>

          {/* Profile Dropdown Box */}
          {isProfileDropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white border border-zinc-100 rounded-2xl p-4 shadow-xl z-50 animate-scale-up space-y-3.5 text-left">
              <div>
                <span className="text-[9px] font-black text-[#b7152b] uppercase tracking-wider block">{t("header.account")}</span>
                <span className="text-sm font-bold text-zinc-900 leading-none block mt-0.5">{displayName}</span>
              </div>

              <hr className="border-zinc-50" />

              {/* Wallet balances */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">{t("header.wallet")}</span>
                
                {/* Coins */}
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-amber-50/50 border border-amber-100/50 rounded-xl px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <Coins size={14} className="text-amber-500 fill-amber-500/10" />
                    KujiCoins
                  </span>
                  <span className="text-zinc-950 font-black">
                    {wallet ? wallet.coins.toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "..."}
                  </span>
                </div>

                {/* Gems */}
                <Link 
                  href="/wallet/recharge-gems"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center justify-between text-xs font-bold text-zinc-700 bg-red-50/30 hover:bg-red-50 border border-rose-100/50 hover:border-rose-200 rounded-xl px-3 py-2 cursor-pointer transition-colors block w-full"
                >
                  <span className="flex items-center gap-1.5">
                    <Gem size={14} className="text-[#b7152b] fill-[#b7152b]/10" />
                    KujiGems
                  </span>
                  <span className="text-zinc-950 font-black">
                    {wallet ? wallet.gems.toLocaleString(language === "vi" ? "vi-VN" : "en-US") : "..."}
                  </span>
                </Link>
              </div>

              <hr className="border-zinc-50" />

              {/* Action buttons */}
              <div className="space-y-1">
                <Link href="/profile" onClick={() => setIsProfileDropdownOpen(false)}>
                  <span className="w-full h-9 px-3 hover:bg-zinc-50 rounded-xl text-zinc-700 hover:text-zinc-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer">
                    <User size={13} strokeWidth={2.5} />
                    {t("header.profile")}
                  </span>
                </Link>

                <button 
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full h-9 px-3 hover:bg-rose-50 rounded-xl text-rose-600 hover:text-red-700 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  <LogOut size={13} strokeWidth={2.5} />
                  {t("nav.logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
