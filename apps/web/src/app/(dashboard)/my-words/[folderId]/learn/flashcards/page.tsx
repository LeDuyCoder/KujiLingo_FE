"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  X, 
  Folder as FolderIcon,
  ChevronLeft,
  ChevronRight,
  Target
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";

interface Vocabulary {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  meaning: string | null;
  jlpt?: string | null;
  note?: string | null;
}

interface LearningProgress {
  by_status: {
    NEW: number;
    LEARNING: number;
    REVIEWING: number;
    MASTERED: number;
  };
}

interface UserStats {
  level: number;
  exp: number;
}

export default function FlashcardsPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [loading, setLoading] = useState(true);
  const [folderName, setFolderName] = useState("");
  
  // Data
  const [cards, setCards] = useState<Vocabulary[]>([]);
  const [progressData, setProgressData] = useState<LearningProgress | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [sessionStreak, setSessionStreak] = useState(0);

  // Drag State
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(0);

  // Audio Ref
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

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
          setFolderName(folder.name || "Folder");
          const systemWords = folder.system_vocabularies || [];
          const userWords = folder.user_vocabularies || [];
          const allWords = [...systemWords, ...userWords];
          
          if (allWords.length < 10) {
            router.push("/my-words");
            return;
          }
          
          // Basic shuffle
          const shuffled = [...allWords].sort(() => Math.random() - 0.5);
          setCards(shuffled);
        }
        
        if (statsRes.data?.success) {
          setUserStats(statsRes.data.data);
        }
        
        if (progressRes.data?.success) {
          setProgressData(progressRes.data.data);
        }
        
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId, router]);

  const handleRating = useCallback(async (correct: boolean) => {
    if (currentIndex >= cards.length) return;
    const currentCard = cards[currentIndex];

    // Optimistic UI update
    if (correct) {
       setCorrectCount(c => c + 1);
       setCombo(c => {
          const n = c + 1;
          setMaxCombo(m => Math.max(m, n));
          return n;
       });
       setXpGained(x => x + 10);
       setSessionStreak(s => s + 1);
    } else {
       setWrongCount(c => c + 1);
       setCombo(0);
       setSessionStreak(0);
    }

    // Call API in background
    try {
       await axiosClient.post("/learning-progress/review", {
         vocabulary_id: currentCard.id,
         correct: correct
       });
    } catch(e) {
       console.error("Failed to submit review", e);
    }

    // Move to next card
    setIsFlipped(false);
    setExitDirection(0);
    setDragOffset(0);
    setTimeout(() => {
       setCurrentIndex(prev => prev + 1);
    }, 150);
  }, [currentIndex, cards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for space
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
        return;
      }

      if (isFlipped) {
        if (e.key === '1' || e.key === '2') {
           e.preventDefault();
           handleRating(false);
        } else if (e.key === '3' || e.key === '4') {
           e.preventDefault();
           handleRating(true);
        }
      } else {
        if (e.code === 'ArrowLeft') {
          setCurrentIndex(p => Math.max(0, p - 1));
          setIsFlipped(false);
        } else if (e.code === 'ArrowRight') {
          setCurrentIndex(p => Math.min(cards.length - 1, p + 1));
          setIsFlipped(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleRating, cards.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStart(e.clientX);
    setIsDragging(true);
    setExitDirection(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - dragStart);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragOffset > 100) {
      // Swipe Right -> Good
      setExitDirection(1);
      setTimeout(() => handleRating(true), 200);
    } else if (dragOffset < -100) {
      // Swipe Left -> Again
      setExitDirection(-1);
      setTimeout(() => handleRating(false), 200);
    } else {
      setDragOffset(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (currentIndex >= cards.length && cards.length > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <Target size={48} />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900">Session Complete!</h1>
        <p className="text-zinc-500 font-medium max-w-sm">
          You've reviewed all {cards.length} cards in this folder. Great job!
        </p>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 min-w-[120px]">
            <p className="text-xs font-bold text-zinc-400 mb-1">XP Gained</p>
            <p className="text-2xl font-extrabold text-[#b7152b]">{xpGained}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 min-w-[120px]">
            <p className="text-xs font-bold text-zinc-400 mb-1">Accuracy</p>
            <p className="text-2xl font-extrabold text-blue-600">
              {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
            </p>
          </div>
        </div>
        <Link 
          href={`/my-words/${folderId}/learn`}
          className="mt-6 px-8 py-3 bg-[#b7152b] text-white rounded-xl font-bold hover:bg-[#9a1022] transition-colors"
        >
          Return to Folder
        </Link>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  
  // Calculate stats
  const totalAnswered = correctCount + wrongCount;
  const accuracy = totalAnswered === 0 ? 100 : Math.round((correctCount / totalAnswered) * 100);
  const sessionProgressPercent = Math.round((currentIndex / cards.length) * 100);

  const globalLearned = progressData ? progressData.by_status.LEARNING + progressData.by_status.REVIEWING + progressData.by_status.MASTERED : 0;
  const globalReview = progressData ? progressData.by_status.REVIEWING : 0;
  const globalMastered = progressData ? progressData.by_status.MASTERED : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 font-sans flex flex-col">
      
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#b7152b] text-white rounded-lg flex items-center justify-center font-bold text-lg">
            K
          </div>
          <span className="font-extrabold text-lg tracking-tight">KujiLingo</span>
        </div>
        
        <div className="flex items-center text-xs font-semibold text-zinc-500 gap-1.5">
          <span>Folders</span>
          <ChevronRight size={14} />
          <span>{folderName}</span>
          <ChevronRight size={14} />
          <span className="text-zinc-900 font-bold">Review Session</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-500">
          <button className="hover:text-zinc-900 transition-colors">
            <Settings size={20} />
          </button>
          <Link href={`/my-words/${folderId}/learn`} className="hover:text-zinc-900 transition-colors">
            <X size={20} />
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          
          {/* Current Folder */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-4">Current Folder</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 text-[#b7152b] rounded-xl flex items-center justify-center font-bold">
                N5
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-900">{folderName}</h3>
                <p className="text-xs text-zinc-500 font-medium">Japanese Core</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-4">Statistics (Global)</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-zinc-600 font-medium">Learned</span>
                </div>
                <span className="font-bold text-zinc-900">{globalLearned}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm text-zinc-600 font-medium">Need Review</span>
                </div>
                <span className="font-bold text-zinc-900">{globalReview}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-zinc-600 font-medium">Mastered</span>
                </div>
                <span className="font-bold text-zinc-900">{globalMastered}</span>
              </div>
            </div>
          </div>

          {/* Today's Progress */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-6 self-start">Session Progress</p>
            
            {/* Simple CSS Circle */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="#b7152b" strokeWidth="10" 
                  strokeDasharray={`${sessionProgressPercent * 2.83} 283`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-extrabold text-zinc-900">{sessionProgressPercent}%</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 font-medium">Folder Completion</p>
          </div>

        </div>

        {/* Main Area */}
        <div className="col-span-1 lg:col-span-6 flex flex-col items-center pt-4">
          
          {/* Top Progress */}
          <div className="w-full max-w-2xl mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-extrabold text-zinc-900">Card {currentIndex + 1} <span className="text-zinc-400 font-medium">of {cards.length}</span></span>
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                <span className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  <Target size={14} />
                  {accuracy}% Accuracy
                </span>
                <span className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                  🔥 {sessionStreak} Streak
                </span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#b7152b] transition-all duration-300"
                style={{ width: `${(currentIndex / cards.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Flashcard Area */}
          <div className="relative w-full max-w-2xl flex items-center justify-center mb-10 group/nav">
            
            <button 
              onClick={() => { setCurrentIndex(p => Math.max(0, p - 1)); setIsFlipped(false); }}
              className="absolute left-[-60px] w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:shadow-md transition-all z-10 disabled:opacity-0"
              disabled={currentIndex === 0}
            >
              <ChevronLeft size={24} />
            </button>

            <div 
              className="w-full aspect-[4/3] sm:aspect-[16/10] perspective-1000 cursor-grab active:cursor-grabbing touch-none select-none"
              onClick={() => {
                if (Math.abs(dragOffset) < 10) {
                  setIsFlipped(!isFlipped);
                }
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{
                transform: `translateX(${exitDirection !== 0 ? exitDirection * 500 : dragOffset}px) rotate(${(exitDirection !== 0 ? exitDirection * 500 : dragOffset) * 0.05}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                opacity: exitDirection !== 0 ? 0 : 1
              }}
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl hover:shadow-2xl rounded-[40px] ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-[40px] flex flex-col items-center justify-center backface-hidden p-8">
                  <span className="text-6xl sm:text-7xl font-extrabold text-zinc-900 mb-6">
                    {currentCard?.kanji || currentCard?.hiragana || "No Word"}
                  </span>
                  {currentCard?.kanji && (
                    <span className="text-xl sm:text-2xl text-zinc-500 font-medium tracking-widest">
                      {currentCard?.hiragana}
                    </span>
                  )}
                </div>

                {/* Back */}
                <div className="absolute inset-0 w-full h-full bg-white rounded-[40px] flex flex-col items-center justify-center backface-hidden p-8 rotate-y-180">
                  <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 mb-6 text-center">
                    {currentCard?.meaning || "No meaning provided"}
                  </span>
                  <div className="flex flex-col items-center text-zinc-500 font-medium space-y-2 text-lg">
                     <span>{currentCard?.kanji}</span>
                     <span>{currentCard?.hiragana}</span>
                  </div>
                  {currentCard?.note && (
                    <div className="mt-8 px-6 py-4 bg-yellow-50 text-yellow-800 rounded-2xl text-sm max-w-sm text-center">
                      <span className="font-bold block mb-1">Note:</span>
                      {currentCard.note}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setCurrentIndex(p => Math.min(cards.length - 1, p + 1)); setIsFlipped(false); }}
              className="absolute right-[-60px] w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:shadow-md transition-all z-10 disabled:opacity-0"
              disabled={currentIndex === cards.length - 1}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Action Buttons (visible when flipped) */}
          <div className={`flex items-center gap-3 sm:gap-4 w-full max-w-2xl transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <button 
              onClick={() => handleRating(false)}
              className="flex-1 h-14 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm transition-colors"
            >
              <span className="flex items-center gap-2">
                Again <span className="opacity-50 text-xs hidden sm:inline">(1)</span>
              </span>
            </button>
            <button 
              onClick={() => handleRating(false)}
              className="flex-1 h-14 bg-white border border-orange-200 hover:bg-orange-50 text-orange-600 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm transition-colors"
            >
              <span className="flex items-center gap-2">
                Hard <span className="opacity-50 text-xs hidden sm:inline">(2)</span>
              </span>
            </button>
            <button 
              onClick={() => handleRating(true)}
              className="flex-1 h-14 bg-white border border-green-200 hover:bg-green-50 text-green-600 rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm transition-colors"
            >
              <span className="flex items-center gap-2">
                Good <span className="opacity-50 text-xs hidden sm:inline">(3)</span>
              </span>
            </button>
            <button 
              onClick={() => handleRating(true)}
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center shadow-sm transition-colors border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
            >
              <span className="flex items-center gap-2">
                Easy <span className="opacity-80 text-xs hidden sm:inline">(4)</span>
              </span>
            </button>
          </div>

          {!isFlipped && (
            <p className="text-zinc-400 text-sm font-semibold mt-6 animate-pulse">
              Press <kbd className="px-2 py-1 bg-zinc-200 text-zinc-600 rounded-md mx-1">Space</kbd> or click card to flip
            </p>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6">
          
          {/* Session Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-4">Session Stats</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-purple-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-2xl font-extrabold text-purple-700 mb-1">{xpGained}</span>
                <span className="text-[10px] font-bold text-purple-400 uppercase">XP Gained</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-2xl font-extrabold text-orange-600 mb-1">{maxCombo}x</span>
                <span className="text-[10px] font-bold text-orange-400 uppercase">Max Combo</span>
              </div>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-zinc-900">Level {userStats?.level || 1}</p>
                <p className="text-[10px] font-bold text-zinc-500">{userStats?.exp || 0} Total XP</p>
              </div>
              <div className="w-10 h-10 bg-red-100 text-[#b7152b] rounded-full flex items-center justify-center font-bold text-xs">
                L{userStats?.level || 1}
              </div>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-4">Shortcuts</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Flip Card</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Again</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Hard</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">2</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Good</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Swipe Left</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">Again</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500 font-medium">Swipe Right</span>
                <kbd className="px-2.5 py-1 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-lg border border-zinc-200 shadow-sm">Good</kbd>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Global CSS for 3D flip effect */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}
