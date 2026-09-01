"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ChevronRight, 
  Flame, 
  Star, 
  Award, 
  CheckCircle2, 
  Clock, 
  Layers, 
  BrainCircuit, 
  Gamepad2,
  Folder as FolderIcon
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";

interface FolderContents {
  folder_id: string;
  name: string;
  system_vocabularies: unknown[];
  user_vocabularies: unknown[];
}

interface UserStats {
  level: number | null;
  exp: number | null;
  streak: number | null;
  total_reviews: number;
  correct_reviews: number;
  accuracy_percent: number | null;
  total_mastered: number;
}

interface LearningProgress {
  by_status: {
    NEW: number;
    LEARNING: number;
    REVIEWING: number;
    MASTERED: number;
  };
  total_started: number;
  total_mastered: number;
  platform_total_vocabulary: number;
}

export default function LearnFolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [folderData, setFolderData] = useState<FolderContents | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!folderId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [folderRes, statsRes, progressRes] = await Promise.all([
          axiosClient.get(`/folders/${folderId}/contents`),
          axiosClient.get("/statistics/me"),
          axiosClient.get("/learning-progress")
        ]);

        if (folderRes.data?.success) {
          const folder = folderRes.data.data;
          const wordCount = (folder.system_vocabularies?.length || 0) + (folder.user_vocabularies?.length || 0);
          
          if (wordCount < 10) {
            router.push("/my-words");
            return;
          }
          
          setFolderData(folder);
        }
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        if (progressRes.data?.success) {
          setProgress(progressRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-zinc-500 font-semibold">Loading your learning dashboard...</p>
      </div>
    );
  }

  if (!folderData) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 font-semibold">Folder not found.</p>
        <Link href="/my-words" className="text-[#b7152b] hover:underline font-bold mt-2 inline-block">
          Return to My Words
        </Link>
      </div>
    );
  }

  const totalWords = (folderData.system_vocabularies?.length || 0) + (folderData.user_vocabularies?.length || 0);
  
  // REAL DATA fetched from the global learning progress API
  const learned = progress ? progress.by_status.LEARNING + progress.by_status.REVIEWING + progress.by_status.MASTERED : 0;
  const needReview = progress ? progress.by_status.REVIEWING : 0;
  const mastered = progress ? progress.by_status.MASTERED : 0;
  
  // We use totalWords for progress percentage, bounding it between 0 and 100
  const progressPercent = totalWords === 0 ? 0 : Math.min(100, Math.round((learned / totalWords) * 100));
  const estTimeMins = totalWords === 0 ? 0 : Math.ceil(totalWords * 0.5); // roughly 30s per word

  return (
    <div className="space-y-6 pb-16 animate-fade-in-up max-w-[1200px] mx-auto">
      
      {/* Breadcrumbs & Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 mb-4">
          <Link href="/home" className="hover:text-zinc-800 transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href="/my-words" className="hover:text-zinc-800 transition-colors">My Folder</Link>
          <ChevronRight size={14} />
          <span className="text-zinc-800 font-bold">{folderData.name}</span>
        </div>
        
        <h1 className="text-3xl font-extrabold text-zinc-950 font-sans tracking-tight">
          {folderData.name} Vocabulary
        </h1>
        <p className="text-zinc-500 text-sm mt-1.5 font-medium">
          Master all vocabulary using multiple learning modes.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Content Area (Left) */}
        <div className="flex-1 space-y-6">
          
          {/* Folder Stats Card */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <FolderIcon size={28} className="text-[#b7152b]" fill="currentColor" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">TOTAL WORDS</p>
                  <p className="text-3xl font-extrabold text-zinc-900">{totalWords}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 sm:gap-10">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">LEARNED</p>
                  <p className="text-3xl font-extrabold text-[#b7152b]">{learned}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">NEED REVIEW</p>
                  <p className="text-3xl font-extrabold text-[#b7152b]">{needReview}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">MASTERED</p>
                  <p className="text-3xl font-extrabold text-blue-600">{mastered}</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#b7152b] rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-extrabold text-zinc-800">{progressPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Clock size={14} />
                Estimated Learning Time: {estTimeMins} mins
              </div>
            </div>
          </div>

          {/* Learning Modes */}
          <div>
            <h2 className="text-xl font-bold text-zinc-900 font-sans mb-4">Choose Your Learning Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Flashcards */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all flex flex-col justify-between group cursor-pointer">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#b7152b]">
                      <Layers size={24} />
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-500 rounded-lg">Easy</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 mb-1">Flashcards</h3>
                  <p className="text-xs text-zinc-500 font-semibold line-clamp-2">
                    Classic spaced repetition review.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <Clock size={14} />
                    5 mins
                  </div>
                  <button className="px-4 py-1.5 text-xs font-bold text-[#b7152b] border border-[#b7152b] rounded-xl hover:bg-red-50 transition-colors">
                    Start
                  </button>
                </div>
              </div>

              {/* Quiz Test */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all flex flex-col justify-between group cursor-pointer">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#b7152b]">
                      <BrainCircuit size={24} />
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-red-50 text-[#b7152b] rounded-lg border border-red-100">Hard</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 mb-1">Quiz Test</h3>
                  <p className="text-xs text-zinc-500 font-semibold line-clamp-2">
                    Beat the clock. Fast recall required.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b7152b]">
                    <Clock size={14} />
                    60s
                  </div>
                  <button className="px-4 py-1.5 text-xs font-bold text-white bg-[#b7152b] rounded-xl hover:bg-[#9a1022] transition-colors">
                    Start
                  </button>
                </div>
              </div>

              {/* Mini Games */}
              <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all flex flex-col justify-between group cursor-pointer">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Gamepad2 size={24} />
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-zinc-100 text-zinc-500 rounded-lg">Fun</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-900 mb-1">Mini Games</h3>
                  <p className="text-xs text-zinc-500 font-semibold line-clamp-2">
                    Learn through interactive challenges.
                  </p>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                    <Clock size={14} />
                    10 mins
                  </div>
                  <button className="px-4 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors">
                    Play
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar (Right) */}
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm sticky top-24">
            <h3 className="text-lg font-extrabold text-zinc-900 mb-5">Achievements</h3>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Streak */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Flame size={28} className="text-[#b7152b] mb-2" fill="currentColor" />
                <p className="text-xl font-extrabold text-zinc-900">{stats?.streak || 0}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-1">Day Streak</p>
              </div>

              {/* XP */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Star size={28} className="text-blue-500 mb-2" fill="currentColor" />
                <p className="text-xl font-extrabold text-zinc-900">
                  {stats?.exp ? (stats.exp >= 1000 ? `${(stats.exp / 1000).toFixed(1)}k` : stats.exp) : 0}
                </p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-1">XP</p>
              </div>

              {/* Rank/Level */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Award size={28} className="text-indigo-500 mb-2" />
                <p className="text-xl font-extrabold text-zinc-900">Lvl {stats?.level || 1}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-1">Rank</p>
              </div>

              {/* Accuracy */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <div className="relative mb-2">
                  <CheckCircle2 size={28} className="text-red-500" fill="#fee2e2" />
                </div>
                <p className="text-xl font-extrabold text-zinc-900">{stats?.accuracy_percent || 0}%</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-1">Accuracy</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
