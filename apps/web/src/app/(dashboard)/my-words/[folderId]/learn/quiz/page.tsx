"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  X, 
  Volume2,
  Folder as FolderIcon,
  Layers,
  ListOrdered,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Target,
  Flame,
  Award
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";

interface Vocabulary {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  meaning: string | null;
  jlpt?: string | null;
}

interface Question {
  vocab: Vocabulary;
  options: string[];
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.folderId as string;

  const [loading, setLoading] = useState(true);
  const [folderName, setFolderName] = useState("");
  
  // Data
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Session State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [isFinished, setIsFinished] = useState(false);

  // Fetch Data
  useEffect(() => {
    if (!folderId) return;

    const fetchData = async () => {
      try {
        const [folderRes] = await Promise.all([
          axiosClient.get(`/folders/${folderId}/contents`)
        ]);

        if (folderRes.data?.success) {
          const folder = folderRes.data.data;
          setFolderName(folder.name);
          
          let allVocabs: Vocabulary[] = [
            ...(folder.system_vocabularies || []),
            ...(folder.user_vocabularies || [])
          ];
          
          if (allVocabs.length < 4) {
            router.push(`/my-words/${folderId}/learn`);
            return;
          }

          // Shuffle and limit to max 30 questions
          allVocabs = allVocabs.sort(() => Math.random() - 0.5).slice(0, 30);
          
          // Generate questions
          const generatedQuestions: Question[] = allVocabs.map(vocab => {
            const correctAnswer = vocab.meaning || "";
            const wrongOptions = allVocabs
              .filter(v => v.id !== vocab.id)
              .map(v => v.meaning || "")
              .sort(() => Math.random() - 0.5)
              .slice(0, 3);
              
            const options = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
            return { vocab, options };
          });

          setQuestions(generatedQuestions);
        }
      } catch (err) {
        console.error("Error fetching folder:", err);
        router.push("/my-words");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId, router]);

  // Timer
  useEffect(() => {
    if (loading || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isFinished]);

  const currentQuestion = questions[currentIndex];
  
  const playAudio = useCallback((text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedAnswer || isSubmitted) return;
    
    setIsSubmitted(true);
    const isCorrect = selectedAnswer === currentQuestion.vocab.meaning;
    
    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setCurrentCombo(c => {
        const n = c + 1;
        setBestCombo(m => Math.max(m, n));
        return n;
      });
      setScore(s => s + 10 + (currentCombo * 2));
    } else {
      setWrongCount(c => c + 1);
      setCurrentCombo(0);
    }

    try {
      await axiosClient.post("/learning-progress/review", {
        vocabulary_id: currentQuestion.vocab.id,
        correct: isCorrect
      });
    } catch (e) {
      console.error("Submit failed", e);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsSubmitted(false);
      } else {
        setIsFinished(true);
      }
    }, 1000);
  };

  const handleSkip = () => {
    if (isSubmitted) return;
    setWrongCount(c => c + 1);
    setCurrentCombo(0);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="w-10 h-10 border-4 border-[#b7152b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col h-screen bg-zinc-50 items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-zinc-900">Quiz Complete!</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <span className="text-sm font-bold text-zinc-500 block mb-1">Score</span>
              <span className="text-2xl font-black text-[#b7152b]">{score}</span>
            </div>
            <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <span className="text-sm font-bold text-zinc-500 block mb-1">Accuracy</span>
              <span className="text-2xl font-black text-emerald-600">
                {Math.round((correctCount / questions.length) * 100) || 0}%
              </span>
            </div>
          </div>
          <Link href={`/my-words/${folderId}/learn`} className="block w-full py-4 bg-[#b7152b] text-white rounded-2xl font-bold text-lg hover:bg-[#9a1022] transition-colors">
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  const accuracy = correctCount + wrongCount > 0 
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100) 
    : 100;
  
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      {/* Top Header */}
      <div className="px-6 py-4 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb & Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold text-zinc-500 flex items-center gap-2">
              <Link href="/my-words" className="hover:text-zinc-900 transition-colors">Home</Link>
              <span>›</span>
              <Link href={`/my-words/${folderId}/learn`} className="hover:text-zinc-900 transition-colors">{folderName || "Folder"}</Link>
              <span>›</span>
              <span className="text-zinc-900 font-bold">Vocabulary Quiz</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-full transition-all">
                <Settings size={20} />
              </button>
              <button onClick={() => router.push(`/my-words/${folderId}/learn`)} className="w-10 h-10 flex items-center justify-center text-[#b7152b] hover:bg-red-50 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <h1 className="text-2xl font-black text-zinc-900 mb-2">Vocabulary Quiz Challenge</h1>
          <p className="text-sm text-zinc-500 font-medium mb-6">Test your vocabulary knowledge and improve your mastery.</p>

          {/* Progress Bar Header */}
          <div className="flex items-center justify-between bg-white border-t border-zinc-100 pt-4 pb-2 text-sm font-bold text-zinc-700">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ListOrdered size={16} className="text-[#b7152b]" />
                <span>Question {currentIndex + 1} <span className="text-zinc-400">/ {questions.length}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-zinc-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-500" />
                <span>Accuracy {accuracy}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <span>Score {score} pts</span>
              </div>
              <div className="px-3 py-1 bg-[#b7152b] text-white rounded-full text-xs flex items-center gap-1 shadow-sm">
                <Flame size={12} fill="currentColor" />
                Streak x{currentCombo}
              </div>
            </div>
          </div>
          {/* Linear Progress */}
          <div className="w-full h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[#b7152b] transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Quiz Info */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-lg border-b border-zinc-100 pb-4">
              <AlertCircle size={20} className="text-[#b7152b]" />
              Quiz Information
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-500 font-semibold"><FolderIcon size={16}/> Folder</span>
                <span className="font-bold text-zinc-900">{folderName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-500 font-semibold"><Layers size={16}/> Type</span>
                <span className="font-bold text-zinc-900">Multiple Choice</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-500 font-semibold"><ListOrdered size={16}/> Questions</span>
                <span className="font-bold text-zinc-900">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-500 font-semibold"><BarChart2 size={16}/> Difficulty</span>
                <span className="font-bold text-zinc-900">Mixed</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-500 font-semibold"><Clock size={16}/> Est. Time</span>
                <span className="font-bold text-zinc-900">10 Minutes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Question */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl p-8 lg:p-10 border border-zinc-100 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <span className="px-4 py-1.5 bg-zinc-100 text-zinc-600 font-bold text-xs rounded-full">
                Q. {currentIndex + 1}
              </span>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-full border border-indigo-100">
                Medium
              </span>
            </div>

            <div className="text-center flex-1 flex flex-col items-center">
              <h2 className="text-xl font-bold text-zinc-700 mb-8">What is the meaning of this Japanese word?</h2>
              
              <div className="text-5xl lg:text-6xl font-black text-zinc-900 mb-6 tracking-wide">
                {currentQuestion.vocab.kanji || currentQuestion.vocab.hiragana}
              </div>
              
              <button 
                onClick={() => playAudio(currentQuestion.vocab.kanji || currentQuestion.vocab.hiragana || "")}
                className="w-14 h-14 bg-red-50 hover:bg-red-100 text-[#b7152b] rounded-full flex items-center justify-center transition-colors mb-10"
              >
                <Volume2 size={24} />
              </button>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedAnswer === opt;
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  
                  // If submitted, show correct/wrong colors
                  let btnClass = "relative flex items-center p-4 rounded-2xl border-2 transition-all cursor-pointer font-bold text-left ";
                  if (isSubmitted) {
                    if (opt === currentQuestion.vocab.meaning) {
                      btnClass += "bg-emerald-50 border-emerald-500 text-emerald-700";
                    } else if (isSelected) {
                      btnClass += "bg-rose-50 border-rose-500 text-rose-700";
                    } else {
                      btnClass += "bg-zinc-50 border-zinc-100 text-zinc-400 opacity-50";
                    }
                  } else {
                    if (isSelected) {
                      btnClass += "bg-[#b7152b] border-[#b7152b] text-white shadow-md";
                    } else {
                      btnClass += "bg-zinc-50 border-zinc-100 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-100";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isSubmitted}
                      onClick={() => setSelectedAnswer(opt)}
                      className={btnClass}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-4 ${isSelected && !isSubmitted ? 'bg-white text-[#b7152b]' : 'bg-white text-zinc-500 border border-zinc-200 shadow-sm'}`}>
                        {label}
                      </span>
                      <span className="flex-1 truncate">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between mt-10">
              <button 
                onClick={handleSkip}
                disabled={isSubmitted}
                className="text-zinc-500 font-bold text-sm hover:text-zinc-900 transition-colors disabled:opacity-50"
              >
                Skip Question ⏭
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitted}
                className="px-8 py-4 bg-[#b7152b] hover:bg-[#9a1022] text-white font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                Submit Answer <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Stats */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm h-full">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-lg border-b border-zinc-100 pb-4 mb-6">
              <BarChart2 size={20} className="text-indigo-500" />
              Live Statistics
            </div>
            
            {/* Circular Progress */}
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="56" className="stroke-zinc-100" strokeWidth="12" fill="none" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    className="stroke-[#b7152b] transition-all duration-1000 ease-out" 
                    strokeWidth="12" fill="none" 
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-zinc-900">{progressPercent}%</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Done</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                <span className="block text-2xl font-black text-emerald-600 mb-1">{correctCount}</span>
                <span className="text-xs font-bold text-emerald-800">Correct</span>
              </div>
              <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100">
                <span className="block text-2xl font-black text-rose-600 mb-1">{wrongCount}</span>
                <span className="text-xs font-bold text-rose-800">Incorrect</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#b7152b] text-white p-4 rounded-2xl shadow-sm">
                <span className="flex items-center gap-2 font-bold text-sm">
                  <Flame size={16} fill="currentColor" />
                  Current Combo
                </span>
                <span className="text-xl font-black">x{currentCombo}</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 text-zinc-700 p-4 rounded-2xl">
                <span className="flex items-center gap-2 font-bold text-sm">
                  <Award size={16} />
                  Best Combo
                </span>
                <span className="text-xl font-black">x{bestCombo}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
