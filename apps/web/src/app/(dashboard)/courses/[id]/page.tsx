"use client";

import React, { useEffect, useState, use } from "react";
import { 
  ChevronLeft, 
  FileText, 
  Play, 
  ArrowRight, 
  Loader2, 
  Award, 
  Check, 
  Lock, 
  BookOpen 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

interface Lesson {
  id: string;
  title: string;
  description: string;
  order_no: number;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  image?: string;
  lessons: Lesson[];
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [hoveredLessonId, setHoveredLessonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseDetailAndProgress = async () => {
      try {
        setLoading(true);
        // 1. Fetch course details
        const courseResponse = await axiosClient.get(`/courses/${courseId}`);
        if (!courseResponse.data || !courseResponse.data.success) {
          setError("Không thể tải thông tin khóa học.");
          setLoading(false);
          return;
        }

        const courseData = courseResponse.data.data;
        setCourse(courseData);

        // Determine level
        const levelMatch = courseData.title ? courseData.title.match(/N[1-5]/i) : null;
        const lvl = levelMatch ? levelMatch[0].toUpperCase() : "N5";

        // 2. Fetch progress overview
        let progressPercentage = 0;
        try {
          const token = useAuthStore.getState().accessToken;
          if (token) {
            const progressResponse = await axiosClient.get("/api/v1/learning-progress");
            const progressResult = progressResponse.data;
            if (progressResult.success && progressResult.data?.by_jlpt) {
              const progressData = progressResult.data.by_jlpt;
              const startedCount = progressData[lvl] || 0;
              const totalLessons = courseData.lessons?.length || 1;
              const completedLessons = Math.floor(startedCount / 10);
              
              progressPercentage = totalLessons > 0 
                ? Math.min(completedLessons / totalLessons, 1)
                : 0;
            }
          }
        } catch (progressErr) {
          console.error("Error fetching learning progress:", progressErr);
        }

        const lessonsCount = courseData.lessons?.length || 0;
        const computedActive = Math.min(
          Math.floor(lessonsCount * progressPercentage),
          Math.max(0, lessonsCount - 1)
        );
        setActiveIndex(computedActive);

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
  const sortedLessons = [...course.lessons].sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));

  // Visual layout config: distance between nodes is now 160px
  const spacing = 160;
  
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

  const getLessonStatus = (index: number) => {
    if (index < activeIndex) return "completed";
    if (index === activeIndex) return "active";
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
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/courses")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-bold text-sm group transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại khóa học
        </button>
      </div>

      {/* Course Detail Hero Block */}
      <div className={`relative bg-gradient-to-br ${colors.gradient} border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden`}>
        <div className="space-y-3 z-10 max-w-3xl">
          <span className={`${colors.bg} text-white font-extrabold px-3.5 py-1 text-[11px] rounded-lg tracking-wider uppercase block w-fit`}>
            JLPT {level}
          </span>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            {course.title}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {course.description || "Khóa học được biên soạn có lộ trình chi tiết giúp học viên làm chủ kiến thức từ vựng hiệu quả."}
          </p>
        </div>

        <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[140px] flex-shrink-0 z-10">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
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
      <div className="bg-white border border-zinc-100 rounded-[32px] p-6 md:p-12 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 font-sans tracking-tight">
            Lộ trình học tập (Roadmap)
          </h2>
          <p className="text-zinc-400 text-xs mt-1 font-semibold">
            Bấm vào từng bài học để xem thông tin chi tiết và bắt đầu học.
          </p>
        </div>

        {sortedLessons.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            Khóa học này hiện chưa có bài học nào được tạo.
          </div>
        ) : (
          /* Duolingo style zigzag roadmap track with CURVED SVG PATH and 160px Spacing */
          <div className="flex flex-col items-center py-8 relative">
            <div 
              className="relative w-[320px] mx-auto select-none"
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
                const status = getLessonStatus(idx);
                const isSelected = selectedLessonId === lesson.id;
                const isHovered = hoveredLessonId === lesson.id;
                const isVisible = isSelected || isHovered;
                const circleStyles = getCircleStyles(status);

                return (
                  <div 
                    key={lesson.id} 
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${isVisible ? "z-30" : "z-10"}`}
                    style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
                    onMouseEnter={() => setHoveredLessonId(lesson.id)}
                    onMouseLeave={() => setHoveredLessonId(null)}
                  >
                    {/* Node Circle Button */}
                    <button
                      onClick={() => setSelectedLessonId(isSelected ? null : lesson.id)}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 ${circleStyles.container}`}
                    >
                      {status === "completed" && <Check size={28} strokeWidth={3} className={circleStyles.iconColor} />}
                      {status === "active" && <BookOpen size={26} strokeWidth={2.5} className={circleStyles.iconColor} />}
                      {status === "locked" && <Lock size={22} strokeWidth={2.5} className={circleStyles.iconColor} />}
                    </button>

                    {/* Tooltip Balloon */}
                    {isVisible && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-20 w-64 bg-white border border-zinc-100 rounded-2xl p-4 shadow-xl text-center animate-scale-up">
                        {/* Triangle pointer pointing up */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[9px] border-b-zinc-100 -z-10" />

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
                          <Button
                            onClick={() => router.push(`/lessons/${lesson.id}`)}
                            className={`w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 ${colors.btnBg}`}
                          >
                            <Play size={10} fill="currentColor" />
                            Học ngay
                            <ArrowRight size={10} />
                          </Button>
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
