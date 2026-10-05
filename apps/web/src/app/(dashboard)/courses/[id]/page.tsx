"use client";

import React, { useEffect, useState, use } from "react";
import { 
  ChevronLeft, 
  FileText, 
  Play, 
  Loader2, 
  Award, 
  Check, 
  Lock, 
  BookOpen,
  ClipboardList
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { axiosClient } from "@/shared/api/axiosClient";

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_no: number;
  quiz_count: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  image?: string;
  lessons: Lesson[];
}

interface LessonProgress {
  id: string;
  is_completed: boolean;
  is_unlocked: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetailAndProgress = async () => {
      try {
        setLoading(true);
        // 1. Fetch course details
        const [courseResponse, progressResponse] = await Promise.all([
          axiosClient.get(`/courses/${courseId}`),
          axiosClient.get(`/api/v1/courses/${courseId}/progress`),
        ]);
        if (!courseResponse.data || !courseResponse.data.success) {
          setError("Không thể tải thông tin khóa học.");
          setLoading(false);
          return;
        }

        const courseData = courseResponse.data.data;
        setCourse(courseData);
        const progressData: LessonProgress[] = progressResponse.data.data.lessons || [];
        setLessonProgress(progressData);
        const firstIncompleteUnlocked = progressData.findIndex((lesson) => lesson.is_unlocked && !lesson.is_completed);
        setActiveIndex(firstIncompleteUnlocked >= 0 ? firstIncompleteUnlocked : Math.max(0, (courseData.lessons?.length || 1) - 1));

      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Có lỗi xảy ra khi kết nối tới hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseDetailAndProgress();
    }
  }, [courseId]);

  // Determine JLPT level from title (e.g. "JLPT N5 Core Vocab" or "N5 Kanji")
  const getLevel = () => {
    if (!course?.title) return "N5";
    const match = course.title.match(/N[1-5]/i);
    return match ? match[0].toUpperCase() : "N5";
  };

  const level = getLevel();

  const getLevelColors = (lvl: string) => {
    switch (lvl) {
      case "N5":
        return {
          bg: "bg-blue-600",
          text: "text-blue-600",
          borderClass: "border-blue-600",
          borderDark: "border-b-blue-800",
          ringClass: "ring-blue-500/30",
          lineColor: "bg-blue-500",
          lineStrokeHex: "#2563eb",
          gradient: "from-blue-50/50 via-blue-50/10 to-white",
          btnBg: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10",
        };
      case "N4":
        return {
          bg: "bg-emerald-600",
          text: "text-emerald-600",
          borderClass: "border-emerald-600",
          borderDark: "border-b-emerald-800",
          ringClass: "ring-emerald-500/30",
          lineColor: "bg-emerald-500",
          lineStrokeHex: "#059669",
          gradient: "from-emerald-50/50 via-emerald-50/10 to-white",
          btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10",
        };
      case "N3":
        return {
          bg: "bg-amber-500",
          text: "text-amber-500",
          borderClass: "border-amber-500",
          borderDark: "border-b-amber-700",
          ringClass: "ring-amber-500/30",
          lineColor: "bg-amber-500",
          lineStrokeHex: "#d97706",
          gradient: "from-amber-50/40 via-amber-50/10 to-white",
          btnBg: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10",
        };
      case "N2":
        return {
          bg: "bg-violet-600",
          text: "text-violet-600",
          borderClass: "border-violet-600",
          borderDark: "border-b-violet-800",
          ringClass: "ring-violet-500/30",
          lineColor: "bg-violet-500",
          lineStrokeHex: "#7c3aed",
          gradient: "from-violet-50/50 via-violet-50/10 to-white",
          btnBg: "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/10",
        };
      default:
        return {
          bg: "bg-red-600",
          text: "text-red-600",
          borderClass: "border-red-600",
          borderDark: "border-b-red-800",
          ringClass: "ring-red-500/30",
          lineColor: "bg-red-500",
          lineStrokeHex: "#dc2626",
          gradient: "from-red-50/50 via-red-50/10 to-white",
          btnBg: "bg-red-600 hover:bg-red-700 text-white shadow-red-500/10",
        };
    }
  };

  const colors = getLevelColors(level);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải thông tin khóa học...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mx-auto">
          <Award size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900">Không tìm thấy khóa học</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">{error || "Khóa học không khả dụng hoặc đã bị gỡ bỏ."}</p>
        <Button onClick={() => router.push("/courses")} className="h-10 px-6 mx-auto">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Sort lessons by order_no or fallback index
  const sortedLessons = [...course.lessons].sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0) || a.id.localeCompare(b.id));

  // Tighter node spacing keeps the learning path compact.
  const spacing = 144;
  
  // Calculate center X and offsets: Left (96px), Right (224px), Center (160px) in a 320px SVG container
  const points = sortedLessons.map((_, idx) => {
    const mod = idx % 3;
    let x = 160;
    if (mod === 0) x = 96;       // Left
    if (mod === 1) x = 224;      // Right
    const y = idx * spacing + 40; // Center Y of the circle
    return { x, y };
  });

  const buildPathD = (startIndex: number, endIndex: number) => {
    if (points.length === 0 || startIndex >= points.length) return "";
    let d = `M ${points[startIndex].x} ${points[startIndex].y}`;
    for (let i = startIndex; i < endIndex; i++) {
      if (i + 1 >= points.length) break;
      const p1 = points[i];
      const p2 = points[i + 1];
      const dy = p2.y - p1.y;
      d += ` C ${p1.x} ${p1.y + dy / 2}, ${p2.x} ${p2.y - dy / 2}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const getLessonStatus = (lessonId: string) => {
    const progress = lessonProgress.find((lesson) => lesson.id === lessonId);
    if (progress?.is_completed) return "completed";
    if (progress?.is_unlocked) return "active";
    return "locked";
  };

  const getCircleStyles = (status: "completed" | "active" | "locked") => {
    if (status === "locked") {
      return {
        container: "bg-zinc-100 border-zinc-200 text-zinc-400 border-b-4 border-b-zinc-300 hover:bg-zinc-100 cursor-not-allowed",
        iconColor: "text-zinc-400",
      };
    }
    if (status === "active") {
      return {
        container: `bg-white border-4 ${colors.borderClass} ${colors.text} shadow-lg ring-4 ring-offset-2 ${colors.ringClass}`,
        iconColor: colors.text,
      };
    }
    // completed/mastered
    return {
      container: `${colors.bg} text-white border-b-4 ${colors.borderDark} hover:brightness-105 shadow-md`,
      iconColor: "text-white",
    };
  };

  return (
    <div className="space-y-5 pb-20 animate-fade-in-up sm:space-y-7 md:space-y-8 md:pb-16">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/courses")}
          className="flex min-h-9 items-center gap-1.5 pr-2 text-xs font-bold text-zinc-500 transition-colors group hover:text-zinc-950 sm:gap-2 sm:text-sm"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại khóa học
        </button>
      </div>

      {/* Course Detail Hero Block */}
      <div className={`relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-3xl border border-zinc-100 bg-gradient-to-br ${colors.gradient} p-5 shadow-sm sm:gap-6 sm:p-7 md:flex-row md:items-center md:p-8`}>
        <div className="z-10 max-w-3xl space-y-3 sm:space-y-4">
          <span className={`${colors.bg} text-white font-extrabold px-3.5 py-1 text-[11px] rounded-lg tracking-wider uppercase block w-fit`}>
            JLPT {level}
          </span>
          <h1 className="max-w-2xl text-[clamp(1.65rem,6vw,2rem)] font-extrabold leading-[1.12] tracking-tight text-zinc-900 md:text-3xl">
            {course.title}
          </h1>
          <p className="max-w-2xl text-[13px] font-medium leading-relaxed text-zinc-500 sm:text-sm">
            {course.description || "Khóa học được biên soạn có lộ trình chi tiết giúp học viên làm chủ kiến thức từ vựng hiệu quả."}
          </p>
        </div>

        <div className="z-10 flex w-fit min-w-[124px] flex-col items-center rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-center shadow-sm md:min-w-[140px] md:p-5">
          <div className="mb-0.5 flex items-center justify-center gap-1.5 text-zinc-400 md:mb-1">
            <FileText size={14} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Bài học</span>
          </div>
          <span className="text-3xl font-extrabold text-zinc-900">
            {sortedLessons.length}
          </span>
        </div>

        {/* Dynamic Glow decoration */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-zinc-100/10 rounded-full blur-[80px]" />
      </div>

      {/* Lessons Roadmap / Learning Path Section */}
      <div className="space-y-6 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:space-y-8 sm:p-6 md:rounded-[32px] md:p-12">
        <div>
          <h2 className="font-sans text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
            Lộ trình học tập (Roadmap)
          </h2>
          <p className="mt-1 max-w-xl text-[11px] font-semibold leading-relaxed text-zinc-400 sm:text-xs">
            Bấm vào từng bài học để xem thông tin chi tiết và bắt đầu học.
          </p>
        </div>

        {sortedLessons.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            Khóa học này hiện chưa có bài học nào được tạo.
          </div>
        ) : (
          /* Duolingo style zigzag roadmap track with a curved SVG path */
          <div className="relative flex flex-col items-center py-5 sm:py-8">
            <div 
              className="relative mx-auto w-full max-w-[320px] select-none"
              style={{ height: `${(sortedLessons.length - 1) * spacing + 80}px` }}
            >
              {/* SVG Curved Paths */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox={`0 0 320 ${(sortedLessons.length - 1) * spacing + 80}`}
              >
                {/* Background/Locked path */}
                {points.length > 1 && (
                  <path
                    d={buildPathD(activeIndex, points.length - 1)}
                    fill="none"
                    stroke="#f4f4f5" // zinc-100
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Completed/Active path */}
                {points.length > 1 && activeIndex > 0 && (
                  <path
                    d={buildPathD(0, activeIndex)}
                    fill="none"
                    stroke={colors.lineStrokeHex || "#2563eb"} // dynamic colored path
                    strokeWidth={8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>

              {/* Zigzag Nodes list positioned absolutely using exact coordinates */}
              {sortedLessons.map((lesson, idx) => {
                const pt = points[idx];
                const status = getLessonStatus(lesson.id);
                const isSelected = selectedLessonId === lesson.id;
                const isHovered = hoveredLessonId === lesson.id;
                const isVisible = isSelected || isHovered;
                const circleStyles = getCircleStyles(status);
                const tooltipSide = idx % 3 === 0 ? "left" : idx % 3 === 1 ? "right" : "center";
                const tooltipPosition = tooltipSide === "left"
                  ? "left-0 translate-x-0"
                  : tooltipSide === "right"
                    ? "right-0 translate-x-0"
                    : "left-1/2 -translate-x-1/2";
                const pointerPosition = tooltipSide === "left"
                  ? "left-1/4"
                  : tooltipSide === "right"
                    ? "left-3/4"
                    : "left-1/2";

                return (
                  <div 
                    key={lesson.id} 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${isVisible ? "z-30" : "z-10"}`}
                    style={{ left: `${(pt.x / 320) * 100}%`, top: `${pt.y}px` }}
                    onMouseEnter={() => setHoveredLessonId(lesson.id)}
                    onMouseLeave={() => setHoveredLessonId(null)}
                  >
                    {/* Node Circle Button */}
                    <button
                      onClick={() => setSelectedLessonId(isSelected ? null : lesson.id)}
                      className={`flex h-14 w-14 transform cursor-pointer items-center justify-center rounded-full transition-all duration-150 hover:scale-105 active:scale-95 sm:h-16 sm:w-16 md:h-20 md:w-20 ${circleStyles.container}`}
                    >
                      {status === "completed" && <Check size={28} strokeWidth={3} className={circleStyles.iconColor} />}
                      {status === "active" && <BookOpen size={26} strokeWidth={2.5} className={circleStyles.iconColor} />}
                      {status === "locked" && <Lock size={22} strokeWidth={2.5} className={circleStyles.iconColor} />}
                    </button>

                    {/* Tooltip Balloon */}
                    {isVisible && (
                      <div className={`absolute top-full z-20 mt-3 w-[min(14rem,calc(100vw-3rem))] rounded-2xl border border-zinc-100 bg-white p-3.5 text-center shadow-xl animate-scale-up sm:mt-4 sm:w-64 sm:p-4 ${tooltipPosition}`}>
                        {/* Triangle pointer pointing up */}
                        <div className={`absolute bottom-full -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white ${pointerPosition}`} />
                        <div className={`absolute bottom-full -z-10 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[9px] border-b-zinc-100 ${pointerPosition}`} />

                        <span className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${status === "locked" ? "text-zinc-400" : colors.text}`}>
                          Bài học {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-sm text-zinc-950 mb-1 leading-snug">
                          {lesson.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-normal mb-3 font-medium line-clamp-3">
                          {lesson.description || "Nội dung bài học bao gồm các từ vựng chọn lọc."}
                        </p>

                        {status === "locked" ? (
                          <div className="w-full py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-400 font-extrabold flex items-center justify-center gap-1.5 cursor-not-allowed">
                            <Lock size={12} />
                            Chưa mở khóa
                          </div>
                        ) : (
                          <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/lessons/${lesson.id}`)}
                            className={`h-9 flex-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${colors.btnBg}`}
                          >
                            <Play size={10} fill="currentColor" />
                            Học ngay
                          </Button>
                          {lesson.quiz_count > 0 && (
                            <Button
                              variant="unstyled"
                              onClick={() => router.push(`/lessons/${lesson.id}/quiz`)}
                              className="h-9 flex-1 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:border-[#b7152b] hover:text-[#b7152b] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <ClipboardList size={13} />
                              Quiz
                            </Button>
                          )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
