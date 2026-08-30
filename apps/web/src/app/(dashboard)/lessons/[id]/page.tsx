"use client";

import React, { useEffect, useState, use } from "react";
import { ChevronLeft, FileText, ArrowRight, Loader2, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { axiosClient } from "@/shared/api/axiosClient";

interface Topic {
  id: string;
  title: string;
  description: string;
  image?: string | null;
  order_no: number;
}

interface LessonDetail {
  id: string;
  course_id: string;
  title: string;
  description: string;
  topics: Topic[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LessonDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const lessonId = resolvedParams.id;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/v1/lessons/${lessonId}`);
        if (response.data && response.data.success) {
          setLesson(response.data.data);
        } else {
          setError("Không thể tải thông tin bài học.");
        }
      } catch (err) {
        console.error("Error fetching lesson detail:", err);
        setError("Có lỗi xảy ra khi kết nối tới hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLessonDetail();
    }
  }, [lessonId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải thông tin bài học...</span>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900">Không tìm thấy bài học</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">{error || "Bài học không khả dụng hoặc đã bị gỡ bỏ."}</p>
        <Button onClick={() => router.push("/courses")} className="h-10 px-6 mx-auto">
          Quay lại danh sách khóa học
        </Button>
      </div>
    );
  }

  // Sort topics by order_no or fallback index
  const sortedTopics = [...lesson.topics].sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0));

  return (
    <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Top Navigation & Action Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/courses/${lesson.course_id}`)}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-bold text-sm group transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại lộ trình bài học
        </button>
      </div>

      {/* Lesson Hero Banner */}
      <div className="relative bg-gradient-to-br from-rose-50/40 via-rose-50/10 to-white border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-3 z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-[#b7152b]">
            <BookOpen size={16} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Bài học chi tiết</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            {lesson.title}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {lesson.description || "Bài học chi tiết với các chủ đề đa dạng giúp củng cố kiến thức từ vựng hoàn hảo."}
          </p>
        </div>

        <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[140px] flex-shrink-0 z-10">
          <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-1">
            <FileText size={14} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Chủ đề</span>
          </div>
          <span className="text-3xl font-extrabold text-zinc-900">
            {sortedTopics.length}
          </span>
        </div>

        {/* Decor */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-rose-100/10 rounded-full blur-[80px]" />
      </div>

      {/* Topics Catalog Grid */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 font-sans mb-6">
          Danh sách chủ đề học tập
        </h2>

        {sortedTopics.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
            Bài học này hiện chưa có chủ đề nào được tạo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTopics.map((topic, idx) => {
              const topicNum = idx + 1;
              return (
                <div
                  key={topic.id}
                  onClick={() => router.push(`/topics/${topic.id}`)}
                  className="bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-md rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden group min-h-[220px] cursor-pointer"
                >
                  <div>
                    {/* Header: order number badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-zinc-50 text-zinc-400 font-extrabold px-2.5 py-0.5 text-[10px] rounded-md border border-zinc-100">
                        Chủ đề {topicNum}
                      </span>
                    </div>

                    {/* Image placeholder or real image */}
                    {topic.image ? (
                      <div className="w-full h-32 rounded-2xl overflow-hidden mb-4 border border-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={topic.image}
                          alt={topic.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      /* Sleek custom background gradient placeholder */
                      <div className="w-full h-12 bg-gradient-to-br from-rose-50/50 to-white rounded-xl mb-4 flex items-center px-3 border border-rose-100/50">
                        <BookOpen size={16} className="text-[#b7152b]/60 mr-2" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Từ vựng & Ví dụ</span>
                      </div>
                    )}

                    <h3 className="text-base font-extrabold text-zinc-900 leading-snug group-hover:text-[#b7152b] transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed line-clamp-3">
                      {topic.description || "Bao gồm danh sách các từ vựng chọn lọc chất lượng cao cùng ví dụ minh họa trực quan."}
                    </p>
                  </div>

                  {/* Start learning button */}
                  <div className="mt-6">
                    <Button
                      variant="unstyled"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/topics/${topic.id}`);
                      }}
                      className="w-full h-10 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center gap-2 group-hover:bg-[#b7152b] group-hover:border-[#b7152b] group-hover:text-white transition-all duration-300"
                    >
                      Luyện tập
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
