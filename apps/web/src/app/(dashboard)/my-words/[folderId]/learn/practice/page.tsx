"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  X, Volume2, Zap, Flame, Mic, Trophy, RefreshCcw, Clock
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAppDialog } from "@/shared/components/ui/AppDialogProvider";
import { useLanguage } from "@/shared/i18n/language";

type Vocabulary = {
  id: string;
  kanji: string | null;
  hiragana: string | null;
  romaji: string | null;
  meaning?: string | null;
  vocabulary_meanings?: { meaning: string }[];
};

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultEvent {
  readonly results: {
    readonly length: number;
    readonly [index: number]: SpeechRecognitionResult;
  };
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type QuestionType = 'AUDIO' | 'TYPING' | 'MATCH' | 'SPEAKING' | 'BUILDER';

interface Question {
  id: string;
  type: QuestionType;
  word: Vocabulary;
  audioOptions?: Vocabulary[]; // for AUDIO
  matchPairs?: { word: Vocabulary; meaning: string }[]; // for MATCH
}

export default function PracticePage() {
  const { t, language } = useLanguage();
  const { alert } = useAppDialog();
  const router = useRouter();
  const params = useParams();
  const folderId = params.folderId as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const [isFinished, setIsFinished] = useState(false);

  // Question specific state
  const [typingInput, setTypingInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'correct' | 'wrong' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [builderSlots, setBuilderSlots] = useState<{id: number, char: string}[]>([]);
  const [builderOptions, setBuilderOptions] = useState<{id: number, char: string, used: boolean}[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchVocabularies = async () => {
      try {
        const response = await axiosClient.get(`/folders/${folderId}/contents`);
        const folder = response.data?.data;
        if (!folder) {
          setLoading(false);
          return;
        }

        const sys = folder.system_vocabularies || [];
        const usr = folder.user_vocabularies || [];
        const all: Vocabulary[] = [...sys, ...usr];
        
        if (all.length === 0) {
          setLoading(false);
          return;
        }

        // Generate 10 questions for demo
        const generated: Question[] = [];
        const types: QuestionType[] = ['AUDIO', 'TYPING', 'SPEAKING', 'BUILDER'];
        
        for (let i = 0; i < 10; i++) {
          const randomWord = all[Math.floor(Math.random() * all.length)];
          const randomType = types[Math.floor(Math.random() * types.length)];
          
          const q: Question = { id: `q-${i}`, type: randomType, word: randomWord };
          
          if (randomType === 'AUDIO') {
            const options = [randomWord];
            while (options.length < 4 && options.length < all.length) {
              const opt = all[Math.floor(Math.random() * all.length)];
              if (!options.find(o => o.id === opt.id)) options.push(opt);
            }
            q.audioOptions = options.sort(() => Math.random() - 0.5);
          }
          generated.push(q);
        }
        
        setQuestions(generated);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchVocabularies();
  }, [folderId]);

  // Timer
  useEffect(() => {
    if (isFinished || loading) return;
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, loading]);

  // Setup builder state when question changes
  useEffect(() => {
    if (questions.length === 0) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const question = questions[currentIdx];
      if (question.type !== 'BUILDER') return;
      const targetWord = (question.word.kanji || question.word.hiragana || question.word.romaji || "").trim();
      const chars = targetWord.split('');
      const shuffled = chars.map((char, i) => ({ id: i, char, used: false })).sort(() => Math.random() - 0.5);
      setBuilderOptions(shuffled);
      setBuilderSlots([]);
    });
    return () => { cancelled = true; };
  }, [currentIdx, questions]);

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'ja-JP';
      msg.rate = 0.9; // Tốc độ hơi chậm lại một chút để dễ nghe hơn
      
      // Bắt buộc tìm và sử dụng giọng đọc tiếng Nhật thay vì giọng mặc định của OS (có thể là tiếng Việt/Anh)
      const voices = window.speechSynthesis.getVoices();
      const jpVoice = voices.find(v => v.lang.includes('ja-JP') || v.lang.includes('ja_JP') || v.lang.includes('ja'));
      if (jpVoice) {
        msg.voice = jpVoice;
      }
      
      window.speechSynthesis.speak(msg);
    }
  };

  const handleNext = () => {
    setTypingInput("");
    setIsChecking(false);
    setCheckResult(null);
    setIsListening(false);
    setSpeechFeedback(null);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const submitAnswer = async (isCorrect: boolean, vocabId: string) => {
    if (isCorrect) {
      setScore(s => s + 100 + (streak * 10));
      setCorrectCount(c => c + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
      setWrongCount(c => c + 1);
    }
    try {
      await axiosClient.post('/api/v1/learning-progress/review', {
        vocabulary_id: vocabId,
        correct: isCorrect
      });
    } catch {}
  };

  const checkTyping = () => {
    if (!typingInput.trim()) return; // Prevent empty submission
    setIsChecking(true);
    const q = questions[currentIdx];
    const inputStr = typingInput.toLowerCase().trim();
    const correctRomaji = (q.word.romaji || "").toLowerCase().trim();
    const correctKanji = (q.word.kanji || "").toLowerCase().trim();
    const correctHiragana = (q.word.hiragana || "").toLowerCase().trim();
    
    const isCorrect = inputStr !== "" && (
                      inputStr === correctRomaji || 
                      (correctKanji !== "" && inputStr === correctKanji) || 
                      (correctHiragana !== "" && inputStr === correctHiragana)
                    );
                      
    setCheckResult(isCorrect ? 'correct' : 'wrong');
    submitAnswer(isCorrect, q.word.id);
    setTimeout(handleNext, 1500);
  };

  const checkAudio = (selectedId: string) => {
    setIsChecking(true);
    const q = questions[currentIdx];
    const isCorrect = selectedId === q.word.id;
    setCheckResult(isCorrect ? 'correct' : 'wrong');
    submitAnswer(isCorrect, q.word.id);
    setTimeout(handleNext, 1500);
  };

  const startSpeaking = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      void alert({ title: "Không hỗ trợ nhận diện giọng nói", description: "Trình duyệt của bạn chưa hỗ trợ tính năng này. Hãy thử dùng Chrome hoặc Edge." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 10;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechFeedback(null);
    };

    recognition.onresult = (event) => {
      let defaultTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        defaultTranscript += event.results[i][0].transcript;
      }
      
      setIsListening(false);
      
      if (!defaultTranscript.trim()) {
        setSpeechFeedback({ isCorrect: false, text: "(Không nghe rõ)" });
        return;
      }
      
      const q = questions[currentIdx];
      const targetKanji = (q.word.kanji || "").trim();
      const targetHiragana = (q.word.hiragana || "").trim();
      const targetRomaji = (q.word.romaji || "").trim().toLowerCase();
      
      let isCorrect = false;
      let matchedTranscript = defaultTranscript;
      
      // Helper function to calculate Levenshtein distance for fuzzy matching
      const getEditDistance = (a: string, b: string) => {
        if (!a || !b) return (a || b).length;
        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
          }
        }
        return matrix[a.length][b.length];
      };

      // Katakana to Hiragana converter
      const toHiragana = (str: string) => {
        return str.replace(/[\u30a1-\u30f6]/g, match => String.fromCharCode(match.charCodeAt(0) - 0x60));
      };

      // Duyệt qua TẤT CẢ các biến thể (alternatives) mà Google/trình duyệt nghe được
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          const altTranscript = event.results[i][j].transcript;
          const cleaned = altTranscript.replace(/[。、.?! ]/g, '').trim().toLowerCase();
          const hiraganaCleaned = toHiragana(cleaned);
          
          // Exact match
          if (cleaned === targetKanji || cleaned === targetHiragana || cleaned === targetRomaji ||
              hiraganaCleaned === targetHiragana) {
            isCorrect = true;
            matchedTranscript = altTranscript;
            break;
          }
          
          // Fuzzy match on Romaji (allows 1-2 character mistakes for issues like "sore" -> "sorry")
          if (targetRomaji) {
             const dist = getEditDistance(cleaned, targetRomaji);
             const allowedDist = targetRomaji.length <= 3 ? 1 : 2;
             if (dist <= allowedDist) {
               isCorrect = true;
               matchedTranscript = altTranscript; // Vẫn hiện những gì nó nghe được nhưng tính là đúng
               break;
             }
          }
        }
        if (isCorrect) break;
      }
      
      // Nếu không khớp toàn bộ, thử dọn dẹp kết quả mặc định lần cuối
      if (!isCorrect) {
        const cleanedDefault = defaultTranscript.replace(/[。、.?! ]/g, '').trim().toLowerCase();
        if (cleanedDefault === targetKanji || cleanedDefault === targetHiragana || cleanedDefault === targetRomaji) {
          isCorrect = true;
          matchedTranscript = defaultTranscript;
        }
      }

      setSpeechFeedback({ isCorrect, text: matchedTranscript });
      
      if (isCorrect) {
        setIsChecking(true);
        submitAnswer(true, q.word.id);
        setTimeout(handleNext, 2500);
      } else {
        // Submit answer as wrong but don't advance, allowing user to retry
        submitAnswer(false, q.word.id);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      void alert({ title: "Lỗi nhận diện giọng nói", description: `Không thể nhận diện giọng nói (${event.error}). Vui lòng thử lại.` });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleBuilderClick = (opt: {id: number, char: string, used: boolean}) => {
    if (isChecking || opt.used) return;
    setBuilderOptions(prev => prev.map(o => o.id === opt.id ? { ...o, used: true } : o));
    setBuilderSlots(prev => [...prev, { id: opt.id, char: opt.char }]);
  };

  const handleSlotClick = (slot: {id: number, char: string}) => {
    if (isChecking) return;
    setBuilderOptions(prev => prev.map(o => o.id === slot.id ? { ...o, used: false } : o));
    setBuilderSlots(prev => prev.filter(s => s.id !== slot.id));
  };

  const handleDragStart = (e: React.DragEvent, opt: {id: number, char: string, used: boolean}) => {
    e.dataTransfer.setData('text/plain', opt.id.toString());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const opt = builderOptions.find(o => o.id.toString() === id);
    if (opt && !opt.used && !isChecking) {
      handleBuilderClick(opt);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleOptionsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isChecking) return;
    const fromIdxStr = e.dataTransfer.getData('text/slot');
    if (fromIdxStr !== "") {
      const fromIdx = parseInt(fromIdxStr, 10);
      const slot = builderSlots[fromIdx];
      if (slot) {
        handleSlotClick(slot);
      }
    }
  };

  const handleSlotDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/slot', index.toString());
  };

  const handleSlotDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isChecking) return;

    // Handle drag from options
    const optId = e.dataTransfer.getData('text/plain');
    if (optId) {
      const opt = builderOptions.find(o => o.id.toString() === optId);
      if (opt && !opt.used) {
        setBuilderOptions(prev => prev.map(o => o.id === opt.id ? { ...o, used: true } : o));
        setBuilderSlots(prev => {
          const next = [...prev];
          next.splice(targetIndex, 0, { id: opt.id, char: opt.char });
          return next;
        });
      }
      return;
    }

    // Handle reordering within slots
    const fromIdxStr = e.dataTransfer.getData('text/slot');
    if (fromIdxStr !== "") {
      const fromIdx = parseInt(fromIdxStr, 10);
      if (fromIdx === targetIndex) return;
      
      setBuilderSlots(prev => {
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(targetIndex, 0, moved);
        return next;
      });
    }
  };

  const checkBuilder = () => {
    const q = questions[currentIdx];
    const targetWord = (q.word.kanji || q.word.hiragana || q.word.romaji || "").trim();
    const userWord = builderSlots.map(s => s.char).join('');
    
    setIsChecking(true);
    const isCorrect = userWord === targetWord;
    setCheckResult(isCorrect ? 'correct' : 'wrong');
    submitAnswer(isCorrect, q.word.id);
    setTimeout(handleNext, 1500);
  };

  const getMeaning = (w: Vocabulary) => w.vocabulary_meanings?.[0]?.meaning || w.meaning || "Unknown";
  const getJp = (w: Vocabulary) => w.kanji || w.hiragana || w.romaji || "";

  if (loading) return <div className="min-h-screen flex items-center justify-center">{t("practice.loading")}</div>;
  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center">{t("practice.noWords")}</div>;

  const currentQ = questions[currentIdx];

  const renderTopBar = () => {
    const progressPercent = questions.length > 0 ? (currentIdx / questions.length) * 100 : 0;
    
    return (
      <div className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-8">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-800 transition-colors shrink-0">
            <X size={28} />
          </button>
          
          <div className="flex-1 max-w-2xl flex items-center gap-4">
            <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-zinc-400 font-bold text-sm shrink-0">{currentIdx}/{questions.length}</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-bold text-zinc-600 shrink-0">
            <div className="flex items-center gap-1.5"><Clock size={18} className="text-blue-400"/> {Math.floor(timeSpent/60)}:{(timeSpent%60).toString().padStart(2,'0')}</div>
            <div className="flex items-center gap-1.5"><Zap size={18} className="text-yellow-400"/> {score}</div>
            <div className="flex items-center gap-1.5 text-orange-500"><Flame size={18} fill="currentColor"/> x{streak}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    if (isFinished) {
      const totalAttempts = correctCount + wrongCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

      return (
        <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Big animated trophy */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-yellow-400 blur-[50px] opacity-20 rounded-full animate-pulse"></div>
            <div className="w-40 h-40 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-full border-4 border-yellow-200 flex items-center justify-center relative z-10 shadow-2xl shadow-yellow-100/50">
              <Trophy size={72} className="text-yellow-500 drop-shadow-md" fill="currentColor"/>
            </div>
          </div>
          
          {/* Huge Title */}
          <h1 className="text-5xl font-black text-zinc-900 mb-4 text-center tracking-tight">{t("practice.complete")}</h1>
          <p className="text-xl font-bold text-zinc-500 mb-12 text-center flex items-center justify-center gap-2">
            {t("practice.youEarned")} <span className="text-amber-500 bg-amber-50 px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-amber-100"><Zap size={20} fill="currentColor"/> {score.toLocaleString(language === "vi" ? "vi-VN" : "en-US")} XP</span> {t("practice.today")}
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-14">
             <div className="bg-white p-6 rounded-[2rem] border-2 border-zinc-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
               <span className="text-emerald-500 font-black text-4xl mb-2">{accuracy}%</span>
               <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{t("practice.accuracy")}</span>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-2 border-zinc-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
               <span className="text-blue-500 font-black text-4xl mb-2">{correctCount}</span>
               <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{t("practice.correct")}</span>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-2 border-zinc-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
               <span className="text-rose-500 font-black text-4xl mb-2">{wrongCount}</span>
               <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{t("practice.incorrect")}</span>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border-2 border-zinc-100 shadow-sm flex flex-col items-center justify-center transition-transform hover:-translate-y-1">
               <span className="text-amber-500 font-black text-4xl mb-2">{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</span>
               <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{t("practice.time")}</span>
             </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg">
            <button onClick={() => window.location.reload()} className="w-full px-8 py-5 bg-white border-2 border-zinc-200 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-50 hover:border-zinc-300 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm">
              <RefreshCcw size={20} /> {t("practice.tryAgain")}
            </button>
            <Link href={`/my-words/${folderId}/learn`} className="w-full px-8 py-5 bg-[#b7152b] text-white font-bold rounded-2xl hover:bg-[#9a1022] transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95">
              {t("practice.continue")} <span className="text-red-200">→</span>
            </Link>
          </div>
        </div>
      );
    }

    switch (currentQ.type) {
      case 'TYPING':
        return (
          <div className="bg-white rounded-3xl p-12 shadow-xl w-full text-center">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6">{t("practice.translate")}</div>
            <h2 className="text-4xl font-black text-zinc-900 mb-10">&quot;{getMeaning(currentQ.word)}&quot;</h2>
            <div className="relative max-w-md mx-auto mb-6">
              <input 
                type="text" 
                value={typingInput}
                onChange={e => setTypingInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isChecking && checkTyping()}
                disabled={isChecking}
                placeholder={t("practice.answerPlaceholder")}
                className="w-full border-2 border-zinc-200 rounded-2xl py-4 px-6 text-center text-2xl font-bold text-zinc-900 focus:outline-none focus:border-rose-400" 
              />
            </div>
            {checkResult && (
               <div className={`mb-6 font-bold text-lg ${checkResult === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {checkResult === 'correct' ? t("practice.correctResult") : t("practice.incorrectTarget")} {getJp(currentQ.word)}
               </div>
            )}
            <div className="flex justify-center gap-4 mb-12">
              <button onClick={() => playAudio(getJp(currentQ.word))} className="px-6 py-2 bg-zinc-100 rounded-full font-bold text-sm text-zinc-500 flex items-center gap-2 hover:bg-zinc-200">
                <Volume2 size={16} /> {t("practice.playAudio")}
              </button>
            </div>
            <button disabled={isChecking} onClick={checkTyping} className="px-12 py-4 bg-[#ef4444] text-white font-bold text-lg rounded-2xl hover:bg-red-600 transition-colors shadow-md flex items-center justify-center gap-2 mx-auto disabled:opacity-50">
              {t("practice.submitAnswer")} ↵
            </button>
          </div>
        );

      case 'AUDIO':
        return (
          <div className="bg-white rounded-3xl p-10 shadow-xl w-full text-center">
            <h2 className="text-3xl font-black text-zinc-900 mb-2">{t("practice.listen")}</h2>
            <p className="text-zinc-500 font-semibold mb-10">{t("practice.selectMatch")}</p>
            <button onClick={() => playAudio(getJp(currentQ.word))} className="w-24 h-24 bg-[#ef4444] rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:scale-105 transition-transform shadow-lg shadow-red-200">
              <Volume2 size={40} />
            </button>
            <div className="text-xs font-black text-[#ef4444] uppercase tracking-widest mb-12">{t("practice.playAudio")}</div>
            <div className="grid grid-cols-2 gap-4 mb-12">
              {currentQ.audioOptions?.map((opt, i) => (
                <button disabled={isChecking} onClick={() => checkAudio(opt.id)} key={i} className="p-6 bg-white border-2 border-zinc-100 rounded-2xl hover:border-zinc-300 transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50">
                  <span className="text-3xl font-black text-zinc-800">{getJp(opt)}</span>
                  <span className="text-sm font-semibold text-zinc-400">{getMeaning(opt)}</span>
                </button>
              ))}
            </div>
            {checkResult && (
               <div className={`mb-6 font-bold text-lg ${checkResult === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {checkResult === 'correct' ? '✅ Correct!' : '❌ Incorrect! Target:'} {getJp(currentQ.word)}
               </div>
            )}
          </div>
        );

      case 'SPEAKING':
        return (
          <div className="bg-white rounded-3xl p-10 shadow-xl w-full text-center">
            <p className="text-zinc-500 font-bold mb-8">{t("practice.readAloud")}</p>
            <div className="text-7xl font-black text-zinc-900 mb-4">{getJp(currentQ.word)}</div>
            <div className="text-3xl font-semibold text-zinc-500 mb-16">{currentQ.word.romaji || ""}</div>
            
            <button 
              onClick={startSpeaking}
              disabled={isChecking}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-xl transition-all ${
                isListening ? "bg-rose-500 animate-pulse shadow-rose-200 scale-110" : "bg-[#b7152b] shadow-red-200 hover:scale-105"
              } disabled:opacity-50`}
            >
              <Mic size={32} />
            </button>
            
            <div className="min-h-[3rem] flex flex-col items-center justify-center">
              {isListening ? (
                <div className="text-xs font-bold text-[#b7152b] animate-bounce">{t("practice.listening")}</div>
              ) : speechFeedback ? (
                <div className="flex flex-col items-center gap-4 mt-2">
                  <div className={`text-lg font-bold ${speechFeedback.isCorrect ? "text-emerald-500" : "text-rose-500"}`}>
                    Bạn đọc là: &quot;{speechFeedback.text}&quot; {speechFeedback.isCorrect ? "✅ Đúng!" : "❌ Sai"}
                  </div>
                  {!speechFeedback.isCorrect && (
                    <button 
                      onClick={handleNext}
                      className="px-6 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-colors text-sm flex items-center gap-2"
                    >
                      {t("practice.skip")} <span className="text-zinc-400">→</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs font-bold text-zinc-400">{t("practice.micHint")}</div>
              )}
            </div>
          </div>
        );
        
      case 'BUILDER':
         return (
          <div className="bg-white rounded-3xl p-10 shadow-xl w-full text-center">
            <h2 className="text-3xl font-black text-zinc-900 mb-8 leading-tight">{t("practice.spell")}</h2>
             <div className="bg-zinc-100 px-6 py-4 rounded-2xl relative mb-10 max-w-xs mx-auto">
                <span className="text-lg font-bold text-zinc-700">&quot;{getMeaning(currentQ.word)}&quot;</span>
              </div>
            
            <div 
              className="h-20 border-2 border-dashed border-rose-200 bg-rose-50/30 rounded-2xl mb-8 flex items-center justify-center gap-2 px-6 transition-colors hover:bg-rose-50/50"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {builderSlots.length === 0 && (
                <span className="text-zinc-300 font-semibold select-none">{t("practice.dragHint")}</span>
              )}
              {builderSlots.map((slot, i) => (
                <button 
                  key={slot.id} 
                  draggable={!isChecking}
                  onDragStart={(e) => handleSlotDragStart(e, i)}
                  onDrop={(e) => handleSlotDrop(e, i)}
                  onDragOver={handleDragOver}
                  onClick={() => handleSlotClick(slot)}
                  disabled={isChecking}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-rose-300 rounded-xl text-rose-500 font-bold text-xl hover:bg-rose-50 shadow-sm transition-transform active:scale-95 cursor-grab active:cursor-grabbing"
                >
                  {slot.char}
                </button>
              ))}
            </div>

            <div 
              className="flex flex-wrap justify-center gap-3 mb-12 min-h-[4rem] p-4 bg-zinc-50/50 rounded-2xl border-2 border-transparent transition-colors hover:border-zinc-200"
              onDrop={handleOptionsDrop}
              onDragOver={handleDragOver}
            >
              {builderOptions.map(opt => (
                <button 
                  key={opt.id}
                  draggable={!opt.used && !isChecking}
                  onDragStart={(e) => handleDragStart(e, opt)}
                  disabled={opt.used || isChecking}
                  onClick={() => handleBuilderClick(opt)}
                  className={`w-12 h-12 flex items-center justify-center bg-white border-2 rounded-xl font-bold text-xl transition-all cursor-grab active:cursor-grabbing ${
                    opt.used ? "opacity-0 invisible scale-50" : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:shadow-sm active:scale-95"
                  }`}
                >
                  {opt.char}
                </button>
              ))}
            </div>

            {checkResult && (
               <div className={`mb-6 font-bold text-lg ${checkResult === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {checkResult === 'correct' ? '✅ Correct!' : '❌ Incorrect! Target:'} {getJp(currentQ.word)}
               </div>
            )}

            <button 
              onClick={checkBuilder}
              disabled={isChecking || builderSlots.length !== builderOptions.length}
              className="px-12 py-4 bg-[#b7152b] text-white font-bold text-lg rounded-2xl hover:bg-[#9a1022] transition-colors w-full max-w-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("practice.checkAnswer")}
            </button>
          </div>
         );

      default:
        return <div>{t("practice.demoMode")}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans relative">
      {!isFinished && renderTopBar()}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-6 max-w-6xl mx-auto w-full">
          
          <div className="w-full max-w-2xl flex items-center justify-center">
            {renderQuestion()}
          </div>

          {!isFinished && (
            <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-48 shrink-0 justify-center flex-wrap">
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col items-center justify-center min-w-[8rem] flex-1 lg:flex-none transition-transform hover:-translate-y-1">
                 <div className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-1">{t("practice.correct")}</div>
                 <div className="font-black text-3xl text-blue-500">{correctCount}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col items-center justify-center min-w-[8rem] flex-1 lg:flex-none transition-transform hover:-translate-y-1">
                 <div className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-1">{t("practice.incorrect")}</div>
                 <div className="font-black text-3xl text-rose-500">{wrongCount}</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col items-center justify-center min-w-[8rem] flex-1 lg:flex-none transition-transform hover:-translate-y-1">
                 <div className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-1">{t("practice.accuracy")}</div>
                 <div className="font-black text-3xl text-emerald-500">
                   {correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0}%
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
