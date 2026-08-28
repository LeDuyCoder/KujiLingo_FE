"use client";

import React, { useEffect, useState } from "react";
import { Lock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useAuthStore } from "@/features/authentication/stores/auth.store";

interface Course {
  id: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  title: string;
  lesson_count: number;
  progress?: number;
  status: "active" | "not_started" | "locked";
}

interface ApiCourse {
  id: string;
  title: string | null;
  description: string | null;
  image: string | null;
  order_no: number | null;
  lesson_count: number;
}

export default function CourseCatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch courses list
        const coursesResponse = await fetch("/api-proxy/courses");
        if (!coursesResponse.ok) throw new Error("Failed to fetch courses");
        const coursesResult = await coursesResponse.json();
        
        // 2. Fetch learning progress overview (requires auth token)
        let progressData: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
        try {
          const token = useAuthStore.getState().accessToken;
          if (token) {
            const progressResponse = await fetch("/api-proxy/api/v1/learning-progress", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (progressResponse.ok) {
              const progressResult = await progressResponse.json();
              if (progressResult.success && progressResult.data?.by_jlpt) {
                progressData = progressResult.data.by_jlpt;
              }
            }
          }
        } catch (progressErr) {
          console.error("Error fetching learning progress:", progressErr);
        }

        if (coursesResult.success && coursesResult.data) {
          // Map backend data to our UI format using real progress from API
          const mapped: Course[] = coursesResult.data.map((item: ApiCourse) => {
            const levelMatch = item.title ? item.title.match(/N[1-5]/i) : null;
            const level = levelMatch ? (levelMatch[0].toUpperCase() as Course["level"]) : "N5";
            
            const startedCount = progressData[level] || 0;
            const totalForLevel = item.lesson_count || 100;
            
            // Calculate progress percentage based on startedCount
            const progress = startedCount > 0 
              ? Math.min(Math.round((startedCount / totalForLevel) * 100), 100)
              : undefined;

            // Determine status based on actual progress logic:
            // N5 is always unlocked. Others unlock if the previous one is started (progress > 0)
            let status: Course["status"] = "locked";
            
            if (level === "N5") {
              status = progress !== undefined && progress > 0 ? "active" : "not_started";
            } else {
              const levelsOrder: Course["level"][] = ["N5", "N4", "N3", "N2", "N1"];
              const currentLevelIndex = levelsOrder.indexOf(level);
              const prevLevel = levelsOrder[currentLevelIndex - 1];
              const prevStartedCount = progressData[prevLevel] || 0;
              
              if (prevStartedCount > 0) {
                status = startedCount > 0 ? "active" : "not_started";
              } else {
                status = "locked";
              }
            }

            const cleanTitle = item.title ? item.title.replace(/JLPT\s+N[1-5]\s+/i, "") : "Untitled Course";

            return {
              id: item.id,
              level,
              title: cleanTitle,
              lesson_count: totalForLevel,
              progress: status === "locked" ? undefined : (progress || 0),
              status,
            };
          });
          setCourses(mapped);
        }
      } catch (err) {
        console.error("Error fetching courses from API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getLevelColors = (level: string) => {
    switch (level) {
      case "N5":
        return {
          bg: "bg-blue-600",
          text: "text-blue-600",
          gradient: "from-blue-50/50 to-white",
          progressBg: "bg-blue-600",
          buttonBg: "bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100",
        };
      case "N4":
        return {
          bg: "bg-emerald-600",
          text: "text-emerald-600",
          gradient: "from-emerald-50/50 to-white",
          progressBg: "bg-emerald-600",
          buttonBg: "bg-zinc-100 hover:bg-zinc-200 text-zinc-800",
        };
      case "N3":
        return {
          bg: "bg-amber-500",
          text: "text-amber-500",
          gradient: "from-amber-50/40 to-white",
          progressBg: "bg-amber-500",
          buttonBg: "bg-zinc-50 border border-zinc-200 text-zinc-400 cursor-not-allowed",
        };
      case "N2":
        return {
          bg: "bg-violet-600",
          text: "text-violet-600",
          gradient: "from-violet-50/50 to-white",
          progressBg: "bg-violet-600",
          buttonBg: "bg-zinc-50 border border-zinc-200 text-zinc-400 cursor-not-allowed",
        };
      default:
        return {
          bg: "bg-red-600",
          text: "text-red-600",
          gradient: "from-red-50/50 to-white",
          progressBg: "bg-red-600",
          buttonBg: "bg-zinc-50 border border-zinc-200 text-zinc-400 cursor-not-allowed",
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-fade-in-up">
        {/* Header Info Skeleton */}
        <div>
          <div className="h-10 w-64 bg-zinc-200 rounded-md animate-pulse mb-3" />
          <div className="h-4 w-96 bg-zinc-100 rounded-md animate-pulse" />
        </div>
        
        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between overflow-hidden animate-pulse min-h-[320px]">
              <div className="flex items-center justify-between">
                <div className="h-6 w-12 bg-zinc-200 rounded-lg" />
                <div className="h-6 w-16 bg-zinc-100 rounded-full" />
              </div>
              <div className="my-8">
                <div className="h-6 w-3/4 bg-zinc-200 rounded-md" />
                <div className="h-4 w-1/2 bg-zinc-200 rounded-md mt-2" />
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-3 w-1/3 bg-zinc-100 rounded-md" />
                <div className="h-2 w-full bg-zinc-100 rounded-full" />
              </div>
              <div className="h-11 w-full bg-zinc-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-12 animate-fade-in-up">
        {/* Header Info */}
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">
            Course Catalog
          </h1>
          <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
            Master Japanese from N5 to N1 with structured, intuitive lessons designed for modern learners.
          </p>
        </div>
        
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
          <p className="text-zinc-500 mb-2">Không tìm thấy khóa học nào trong cơ sở dữ liệu.</p>
          <p className="text-zinc-400 text-xs">Vui lòng chạy kịch bản seed dữ liệu hoặc thêm khóa học từ trang quản trị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Header Info */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">
          Course Catalog
        </h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Master Japanese from N5 to N1 with structured, intuitive lessons designed for modern learners.
        </p>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => {
          const colors = getLevelColors(course.level);
          const isLocked = course.status === "locked";

          return (
            <div
              key={course.id}
              className={`relative bg-gradient-to-br ${colors.gradient} border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-300 flex flex-col justify-between overflow-hidden`}
            >
              {/* Card Header Top Badges */}
              <div className="flex items-center justify-between">
                <span
                  className={`${colors.bg} text-white font-extrabold px-3.5 py-1 text-xs rounded-lg tracking-wider`}
                >
                  {course.level}
                </span>
                
                <span className="flex items-center gap-1 bg-zinc-50 border border-zinc-100 text-zinc-500 px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm">
                  <FileText size={12} className="text-zinc-400" />
                  {course.lesson_count}
                </span>
              </div>

              {/* Title */}
              <div className="my-8">
                <h3 className="text-xl font-extrabold text-zinc-900 leading-snug">
                  {course.title}
                </h3>
              </div>

              {/* Progress Section */}
              <div className="space-y-4 mb-6">
                {course.progress !== undefined ? (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                      <span>Progress</span>
                      <span className="text-blue-600 font-bold">{course.progress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${colors.progressBg} rounded-full transition-all duration-500`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                    <span>Status</span>
                    <span className="text-zinc-500 font-bold flex items-center gap-1">
                      {isLocked ? "Locked" : "Not Started"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div>
                {isLocked ? (
                  <Button
                    disabled
                    variant="unstyled"
                    className="w-full h-11 rounded-xl text-zinc-400 border border-zinc-200 bg-zinc-50/50 flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock size={14} className="text-zinc-400" />
                    Locked
                  </Button>
                ) : (
                  <Button
                    variant="unstyled"
                    className={`w-full h-11 rounded-xl font-bold transition-all ${colors.buttonBg}`}
                  >
                    {course.status === "active" ? "Continue" : "Start"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Spaced Repetition Pro Banner */}
      <div className="relative bg-slate-900 rounded-[32px] p-8 lg:p-12 overflow-hidden text-white shadow-xl shadow-slate-900/10 flex flex-col items-center justify-center text-center">
        {/* Glow effect overlays */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center max-w-3xl">
          <span className="inline-block bg-red-600/15 text-red-500 border border-red-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-full mb-6">
            Pro Feature
          </span>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Master Kanji faster with <span className="text-yellow-400">spaced repetition.</span>
          </h2>

          <p className="text-slate-400 text-sm lg:text-base leading-relaxed mb-8">
            Unlock all structured decks and personalized learning paths designed to get you from N5 to N1 efficiently.
          </p>

          <Button variant="unstyled" className="bg-white hover:bg-zinc-100 text-slate-950 font-bold px-8 h-12.5 rounded-full transition-colors flex items-center justify-center gap-2">
            Upgrade to Pro Now
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
