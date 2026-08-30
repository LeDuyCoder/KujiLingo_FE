"use client";

import React, { useEffect, useState, use } from "react";
import {
  ChevronLeft,
  Loader2,
  BookOpen,
  Heart,
  Volume2,
  Star,
  FileText,
  Play,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/Button";
import { axiosClient } from "@/shared/api/axiosClient";

interface Vocabulary {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  word_type: string | null;
  jlpt: string | null;
  meaning: string | null;
  is_favorited: boolean;
  learning_status: string;
}

interface GrammarPoint {
  id: string;
  title_jp: string;
  structure: string | null;
  meaning_vi: string;
  explanation: string | null;
  usage: string | null;
  jlpt_level: string;
}

interface TopicDetail {
  id: string;
  lesson_id: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  vocabularies: Vocabulary[];
  grammar_points: GrammarPoint[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TopicDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const topicId = resolvedParams.id;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoritingIds, setFavoritingIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar">("vocab");

  // Flashcards practice states
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyResults, setStudyResults] = useState<{ id: string; correct: boolean }[]>([]);
  const [isPracticeFinished, setIsPracticeFinished] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchTopicDetail = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/api/v1/topics/${topicId}`);
        if (response.data && response.data.success) {
          setTopic(response.data.data);
        } else {
          setError("Không thể tải thông tin chủ đề.");
        }
      } catch (err) {
        console.error("Error fetching topic detail:", err);
        setError("Có lỗi xảy ra khi kết nối tới hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    if (topicId) {
      fetchTopicDetail();
    }
  }, [topicId, refreshTrigger]);

  const toggleFavorite = async (vocabId: string, currentFav: boolean) => {
    if (favoritingIds.has(vocabId)) return;
    setFavoritingIds((prev) => new Set(prev).add(vocabId));

    try {
      if (currentFav) {
        await axiosClient.delete(`/api/v1/favorite-vocabularies/${vocabId}`);
      } else {
        await axiosClient.post("/api/v1/favorite-vocabularies", {
          vocabulary_id: vocabId,
        });
      }
      // Update local state
      setTopic((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vocabularies: prev.vocabularies.map((v) =>
            v.id === vocabId ? { ...v, is_favorited: !currentFav } : v
          ),
        };
      });
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavoritingIds((prev) => {
        const next = new Set(prev);
        next.delete(vocabId);
        return next;
      });
    }
  };

  const speakWord = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const handleReviewSubmit = async (correct: boolean) => {
    if (!topic || topic.vocabularies.length === 0) return;
    const currentVocab = topic.vocabularies[currentCardIndex];

    // Track results locally for the summary screen
    setStudyResults((prev) => [...prev, { id: currentVocab.id, correct }]);

    // Submit review progress to backend
    try {
      await axiosClient.post("/api/v1/learning-progress/review", {
        vocabulary_id: currentVocab.id,
        correct,
      });
    } catch (err) {
      console.error("Error submitting vocabulary review:", err);
    }

    // Advance to next card or finish
    setIsFlipped(false);
    if (currentCardIndex === topic.vocabularies.length - 1) {
      setIsPracticeFinished(true);
    } else {
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const closePractice = () => {
    setIsPracticeOpen(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setStudyResults([]);
    setIsPracticeFinished(false);
    // Reload topic detail to update vocabulary status labels
    setRefreshTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MASTERED":
        return { label: "Thành thạo", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "REVIEWING":
        return { label: "Đang ôn", color: "bg-amber-50 text-amber-600 border-amber-100" };
      case "LEARNING":
        return { label: "Đang học", color: "bg-blue-50 text-blue-600 border-blue-100" };
      default:
        return { label: "Mới", color: "bg-zinc-50 text-zinc-500 border-zinc-100" };
    }
  };

  const getJlptColor = (jlpt: string | null) => {
    switch (jlpt) {
      case "N5": return "bg-blue-100 text-blue-700";
      case "N4": return "bg-emerald-100 text-emerald-700";
      case "N3": return "bg-amber-100 text-amber-700";
      case "N2": return "bg-violet-100 text-violet-700";
      case "N1": return "bg-red-100 text-red-700";
      default: return "bg-zinc-100 text-zinc-500";
    }
  };

  const cardStyle = {
    perspective: "1000px",
  };

  const cardInnerStyle = {
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
    transformStyle: "preserve-3d" as const,
  };

  const cardSideStyle = {
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
  };

  if (loading && !topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải chủ đề...</span>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-16 h-16 bg-red-50 text-[#b7152b] rounded-full flex items-center justify-center mx-auto">
          <BookOpen size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900">Không tìm thấy chủ đề</h2>
        <p className="text-zinc-500 text-sm leading-relaxed">{error || "Chủ đề không khả dụng."}</p>
        <Button onClick={() => router.back()} className="h-10 px-6 mx-auto">
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-16 animate-fade-in-up">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (topic.lesson_id) {
              router.push(`/lessons/${topic.lesson_id}`);
            } else {
              router.back();
            }
          }}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-bold text-sm group transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Quay lại danh sách chủ đề
        </button>
      </div>

      {/* Topic Hero Banner */}
      <div className="relative bg-gradient-to-br from-rose-50/40 via-rose-50/10 to-white border border-zinc-100 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-3 z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-[#b7152b]">
            <BookOpen size={16} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Chủ đề học tập</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            {topic.title || "Chủ đề"}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {topic.description || "Chủ đề bao gồm các từ vựng và ngữ pháp chọn lọc."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 z-10 flex-shrink-0">
          <div className="flex gap-3 flex-shrink-0">
            <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[110px] flex-shrink-0">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1 whitespace-nowrap">
                <FileText size={12} />
                <span className="text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">Từ vựng</span>
              </div>
              <span className="text-2xl font-extrabold text-zinc-900">{topic.vocabularies.length}</span>
            </div>
            <div className="bg-white border border-zinc-100 p-4 rounded-2xl shadow-sm text-center min-w-[110px] flex-shrink-0">
              <div className="flex items-center justify-center gap-1 text-zinc-400 mb-1 whitespace-nowrap">
                <Star size={12} />
                <span className="text-[9px] font-extrabold uppercase tracking-wider whitespace-nowrap">Ngữ pháp</span>
              </div>
              <span className="text-2xl font-extrabold text-zinc-900">{topic.grammar_points.length}</span>
            </div>
          </div>

          {topic.vocabularies.length > 0 && (
            <Button
              onClick={() => setIsPracticeOpen(true)}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-[#b7152b] hover:bg-[#961223] text-white font-bold text-sm shadow-lg shadow-rose-500/10 flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
            >
              <Play size={14} fill="currentColor" />
              Bắt đầu học
            </Button>
          )}
        </div>

        <div className="absolute -top-32 -right-32 w-80 h-80 bg-rose-100/10 rounded-full blur-[80px]" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border border-zinc-100 bg-zinc-50/50 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab("vocab")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "vocab"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-100"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Từ vựng ({topic.vocabularies.length})
        </button>
        <button
          onClick={() => setActiveTab("grammar")}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === "grammar"
              ? "bg-white text-zinc-900 shadow-sm border border-zinc-100"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          Ngữ pháp ({topic.grammar_points.length})
        </button>
      </div>

      {/* Vocabulary Tab */}
      {activeTab === "vocab" && (
        <div className="space-y-3">
          {topic.vocabularies.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              Chủ đề này chưa có từ vựng nào.
            </div>
          ) : (
            topic.vocabularies.map((vocab) => {
              const statusBadge = getStatusBadge(vocab.learning_status);
              return (
                <div
                  key={vocab.id}
                  className="bg-white border border-zinc-100 hover:border-zinc-200 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-sm group"
                >
                  <div className="flex items-center gap-5 min-w-0">
                    {/* Kanji display */}
                    <div 
                      className="min-w-[56px] h-14 px-3.5 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ width: "fit-content" }}
                    >
                      <span 
                        className="text-xl font-extrabold text-zinc-900 select-all"
                        style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}
                      >
                        {vocab.kanji || vocab.hiragana || "—"}
                      </span>
                    </div>

                    {/* Word info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-lg font-extrabold text-zinc-900 leading-tight">
                          {vocab.kanji || vocab.hiragana || "—"}
                        </span>
                        {vocab.jlpt && (
                          <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${getJlptColor(vocab.jlpt)}`}>
                            {vocab.jlpt}
                          </span>
                        )}
                        {vocab.word_type && (
                          <span className="text-[9px] text-zinc-400 font-semibold uppercase">
                            {vocab.word_type}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-zinc-500 font-medium">
                        {vocab.hiragana && vocab.kanji && (
                          <span>{vocab.hiragana}</span>
                        )}
                        {vocab.romaji && (
                          <span className="text-zinc-400">• {vocab.romaji}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-600 mt-0.5 font-medium truncate max-w-md">
                        {vocab.meaning || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Action items */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    <button
                      onClick={() => speakWord(vocab.kanji || vocab.hiragana || "")}
                      className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center transition-colors"
                    >
                      <Volume2 size={14} className="text-zinc-400" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(vocab.id, vocab.is_favorited)}
                      disabled={favoritingIds.has(vocab.id)}
                      className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Heart
                        size={14}
                        className={vocab.is_favorited ? "text-red-500 fill-red-500" : "text-zinc-400"}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Grammar Tab */}
      {activeTab === "grammar" && (
        <div className="space-y-4">
          {topic.grammar_points.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center text-zinc-400">
              Chủ đề này chưa có ngữ pháp nào.
            </div>
          ) : (
            topic.grammar_points.map((gp) => (
              <div
                key={gp.id}
                className="bg-white border border-zinc-100 hover:border-zinc-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-sm space-y-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-extrabold text-zinc-900">{gp.title_jp}</span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${getJlptColor(gp.jlpt_level)}`}>
                    {gp.jlpt_level}
                  </span>
                </div>
                {gp.structure && (
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Cấu trúc</span>
                    <span className="text-sm font-bold text-zinc-800">{gp.structure}</span>
                  </div>
                )}
                <div className="text-sm text-zinc-700 font-medium leading-relaxed">
                  <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Ý nghĩa</span>
                  {gp.meaning_vi}
                </div>
                {gp.explanation && (
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Giải thích</span>
                    {gp.explanation}
                  </div>
                )}
                {gp.usage && (
                  <div className="text-xs text-zinc-500 leading-relaxed">
                    <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block mb-0.5">Cách sử dụng</span>
                    {gp.usage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      </div>

      {/* Flashcards Interactive Modal */}
      {isPracticeOpen && topic.vocabularies.length > 0 && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-100 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh] animate-scale-up my-auto">
            {/* Modal Header */}
            <div className="border-b border-zinc-100 px-6 py-4 flex items-center justify-between bg-zinc-50/50">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-[#b7152b] uppercase tracking-wider">Học từ vựng</span>
                <h3 className="font-extrabold text-sm text-zinc-950 truncate max-w-[280px]">
                  {topic.title}
                </h3>
              </div>
              <button 
                onClick={closePractice}
                className="text-zinc-400 hover:text-zinc-600 font-bold text-sm bg-white border border-zinc-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col items-center justify-center flex-grow min-h-[350px]">
              {!isPracticeFinished ? (
                <div className="w-full flex flex-col items-center space-y-6">
                  {/* Progress Indicators */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                      <span>Tiến độ</span>
                      <span>{currentCardIndex + 1} / {topic.vocabularies.length} từ</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#b7152b] transition-all duration-300"
                        style={{ width: `${((currentCardIndex + 1) / topic.vocabularies.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 3D Flip Card Container */}
                  <div 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full aspect-[4/3] max-w-sm cursor-pointer relative"
                    style={cardStyle}
                  >
                    <div 
                      className="w-full h-full relative"
                      style={cardInnerStyle}
                    >
                      {/* FRONT OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between items-center"
                        style={{ ...cardSideStyle, zIndex: isFlipped ? 0 : 2 }}
                      >
                        <div className="w-full flex justify-between items-center text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          <span>Thẻ từ vựng</span>
                          <span>Bấm để xem nghĩa</span>
                        </div>
                        <div className="text-center space-y-2">
                          <span 
                            className="text-5xl font-extrabold text-zinc-950 select-none block tracking-tight"
                            style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}
                          >
                            {topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana}
                          </span>
                        </div>
                        <div className="w-full flex justify-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              speakWord(topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana || "");
                            }}
                            className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 transition-colors shadow-sm"
                          >
                            <Volume2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* BACK OF THE CARD */}
                      <div 
                        className="absolute inset-0 bg-white border-2 border-[#b7152b] rounded-2xl p-6 shadow-lg flex flex-col justify-between items-center"
                        style={{ ...cardSideStyle, transform: "rotateY(180deg)", zIndex: isFlipped ? 2 : 0 }}
                      >
                        <div className="w-full flex justify-between items-center text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">
                          <span>Ý nghĩa & Cách đọc</span>
                          <span>Bấm để lật lại</span>
                        </div>
                        <div className="text-center space-y-3">
                          <span 
                            className="text-3xl font-extrabold text-[#b7152b] select-none block leading-tight"
                            style={{ whiteSpace: "nowrap", wordBreak: "keep-all" }}
                          >
                            {topic.vocabularies[currentCardIndex].kanji || topic.vocabularies[currentCardIndex].hiragana}
                          </span>
                          <div className="space-y-1">
                            <span className="text-base font-extrabold text-zinc-900 block select-none">
                              {topic.vocabularies[currentCardIndex].hiragana}
                            </span>
                            {topic.vocabularies[currentCardIndex].romaji && (
                              <span className="text-xs font-bold text-zinc-400 block select-none uppercase tracking-wider">
                                {topic.vocabularies[currentCardIndex].romaji}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-zinc-600 bg-zinc-50 border border-zinc-100 px-4 py-1.5 rounded-xl block max-w-[240px] select-none">
                            {topic.vocabularies[currentCardIndex].meaning}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {topic.vocabularies[currentCardIndex].jlpt && (
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded ${getJlptColor(topic.vocabularies[currentCardIndex].jlpt)}`}>
                              {topic.vocabularies[currentCardIndex].jlpt}
                            </span>
                          )}
                          {topic.vocabularies[currentCardIndex].word_type && (
                            <span className="bg-zinc-50 text-zinc-400 border border-zinc-200 px-2 py-0.5 text-[9px] font-extrabold rounded uppercase">
                              {topic.vocabularies[currentCardIndex].word_type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-4 w-full max-w-sm">
                    <button
                      onClick={() => handleReviewSubmit(false)}
                      className="flex-1 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ✕ Chưa thuộc
                    </button>
                    <button
                      onClick={() => handleReviewSubmit(true)}
                      className="flex-1 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ✓ Đã thuộc
                    </button>
                  </div>
                </div>
              ) : (
                /* Completion Summary Screen */
                <div className="w-full flex flex-col items-center text-center space-y-5 py-6">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-extrabold text-zinc-950">Học bài hoàn tất!</h4>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      Bạn đã hoàn thành việc ôn tập {topic.vocabularies.length} từ vựng thuộc chủ đề này.
                    </p>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 w-full max-w-sm flex justify-around">
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Đã thuộc</span>
                      <span className="text-xl font-extrabold text-emerald-600">
                        {studyResults.filter(r => r.correct).length}
                      </span>
                    </div>
                    <div className="border-r border-zinc-200" />
                    <div>
                      <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Chưa thuộc</span>
                      <span className="text-xl font-extrabold text-rose-600">
                        {studyResults.filter(r => !r.correct).length}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={closePractice}
                    className="w-full max-w-sm h-11 rounded-xl bg-[#b7152b] hover:bg-[#961223] text-white font-bold text-xs shadow-md"
                  >
                    Hoàn thành & Quay lại
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
