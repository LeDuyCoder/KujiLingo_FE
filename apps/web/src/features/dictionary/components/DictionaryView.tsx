"use client";
// Force HMR compile refresh
import React, { useState, useEffect } from "react";
import { 
  Search, 
  Volume2, 
  Bookmark, 
  Heart, 
  X, 
  Plus, 
  Check, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { convertHiraganaToRomaji } from "@/shared/utils/romaji";

interface VocabularyDetail {
  id: string;
  example_sentence_jp?: string;
  example_sentence_vi?: string;
  audio_url?: string;
}

interface KanjiDetail {
  id: string;
  stroke_order_image_url?: string;
  onyomi?: string;
  kunyomi?: string;
}

interface DictionaryEntry {
  id: string;
  term_jp: string;
  reading_hiragana: string;
  meaning_vi: string;
  meaning_en: string;
  part_of_speech?: string;
  jlpt_level?: "N5" | "N4" | "N3" | "N2" | "N1";
  related_vocabulary_id?: string;
  vocabulary?: VocabularyDetail;
  kanji?: KanjiDetail;
  is_favorited?: boolean;
  is_saved?: boolean;
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

import { axiosClient } from "@/shared/api/axiosClient";

export const DictionaryView = () => {
  const { user, accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionProcessing, setActionProcessing] = useState<Record<string, boolean>>({});
  const [kanjiDetails, setKanjiDetails] = useState<Record<string, { reading: string; meaning: string }>>({});

  const fetchFolders = React.useCallback(async () => {
    try {
      const response = await axiosClient.get("/folders");
      const result = response.data;
      if (result.success && result.data) {
        setFolders(result.data);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  }, []);

  useEffect(() => {
    // Fetch folders if user is authenticated
    if (accessToken) {
      const timer = setTimeout(() => {
        fetchFolders();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [accessToken, fetchFolders]);

  const showToast = (message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const getOrCreateDefaultFolderId = async (): Promise<string | null> => {
    if (folders.length > 0) {
      return folders[0].id;
    }
    
    // Create default folder "Từ vựng của tôi"
    try {
      const response = await axiosClient.post("/folders", {
        name: "Từ vựng của tôi",
        color: "#b7152b",
        icon: "folder",
      });

      const result = response.data;
      if (result.success && result.data) {
        const newFolder = result.data;
        setFolders([newFolder]);
        return newFolder.id;
      }
    } catch (err) {
      console.error("Error creating default folder:", err);
    }
    return null;
  };

  const handleSearch = React.useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      showToast("Vui lòng nhập từ khóa tìm kiếm.");
      return;
    }

    setLoading(true);
    setResults([]);
    // Close detail pane on new search
    setSelectedEntryId(null);
    setSelectedEntry(null);

    try {
      let url = `/dictionary/search?q=${encodeURIComponent(searchQuery.trim())}`;
      if (selectedLevel !== "All") {
        url += `&jlpt_level=${selectedLevel}`;
      }

      const response = await axiosClient.get(url);
      const result = response.data;
      if (result.success && result.data) {
        setResults(result.data);
        setLastQuery(searchQuery.trim());
      } else {
        showToast("Đã xảy ra lỗi khi tìm kiếm.");
      }
    } catch (err) {
      console.error("Error searching dictionary:", err);
      showToast("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedLevel]);

  // Perform search automatically when level filter changes and there's a query
  useEffect(() => {
    if (lastQuery) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedLevel, lastQuery, handleSearch]);

  // Fetch detailed entry details when selectedEntryId changes
  useEffect(() => {
    if (!selectedEntryId) return;

    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const response = await axiosClient.get(`/dictionary/${selectedEntryId}`);
        const result = response.data;
        if (result.success && result.data) {
          setSelectedEntry(result.data);
        }
      } catch (err) {
        console.error("Error fetching dictionary detail:", err);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedEntryId]);

  // Helper for displaying romaji
  const getKanjiBreakdown = (term: string) => {
    // Basic kanji identification: regex matching non-kana characters
    const kanjis = term.match(/[\u4e00-\u9faf]/g) || [];
    // Deduplicate
    return Array.from(new Set(kanjis));
  };

  const getRomaji = (entry: DictionaryEntry) => {
    return convertHiraganaToRomaji(entry.reading_hiragana);
  };

  // Fetch breakdown kanji details when selectedEntry changes
  useEffect(() => {
    if (!selectedEntry) {
      const timer = setTimeout(() => setKanjiDetails({}), 0);
      return () => clearTimeout(timer);
    }

    const kanjiChars = getKanjiBreakdown(selectedEntry.term_jp);
    if (kanjiChars.length === 0) return;

    const fetchKanjiDetails = async () => {
      const detailsMap: Record<string, { reading: string; meaning: string }> = {};
      
      await Promise.all(
        kanjiChars.map(async (char) => {
          try {
            const response = await axiosClient.get(`/api/v1/kanji?search=${encodeURIComponent(char)}`);
            const result = response.data;
            if (result.success && result.data && result.data.length > 0) {
              const kanjiData = result.data[0];
              const reading = kanjiData.onyomi || kanjiData.kunyomi || "";
              const meaning = kanjiData.meaning_en || kanjiData.meaning_vi || "";
              detailsMap[char] = { reading, meaning };
            }
          } catch (err) {
            console.error(`Error fetching kanji detail for ${char}:`, err);
          }
        })
      );
      
      setKanjiDetails(detailsMap);
    };

    fetchKanjiDetails();
  }, [selectedEntry]);

  const handleFavoriteToggle = async (entry: DictionaryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast("Vui lòng đăng nhập để yêu thích từ vựng.");
      return;
    }

    const vocabId = entry.related_vocabulary_id;
    if (!vocabId) return;

    // Avoid double clicks
    if (actionProcessing[vocabId]) return;
    setActionProcessing(prev => ({ ...prev, [vocabId]: true }));

    const isCurrentFav = !!entry.is_favorited;

    // Optimistic UI update for results list
    setResults(prev => 
      prev.map(item => 
        item.related_vocabulary_id === vocabId 
          ? { ...item, is_favorited: !isCurrentFav } 
          : item
      )
    );

    // Optimistic UI update for selected entry
    if (selectedEntry && selectedEntry.related_vocabulary_id === vocabId) {
      setSelectedEntry(prev => prev ? { ...prev, is_favorited: !isCurrentFav } : null);
    }

    try {
      if (isCurrentFav) {
        await axiosClient.delete(`/api/v1/favorite-vocabularies/${vocabId}`);
      } else {
        await axiosClient.post(`/api/v1/favorite-vocabularies`, { vocabulary_id: vocabId });
      }
      showToast(isCurrentFav ? "Đã xóa khỏi danh sách yêu thích." : "Đã thêm vào danh sách yêu thích.");
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Revert optimistic update
      setResults(prev => 
        prev.map(item => 
          item.related_vocabulary_id === vocabId 
            ? { ...item, is_favorited: isCurrentFav } 
            : item
        )
      );
      showToast("Không thể kết nối đến máy chủ.");
    } finally {
      setActionProcessing(prev => ({ ...prev, [vocabId]: false }));
    }
  };

  const handleSaveWordToggle = async (entry: DictionaryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast("Vui lòng đăng nhập để lưu từ vựng.");
      return;
    }

    const vocabId = entry.related_vocabulary_id;
    if (!vocabId) return;

    if (actionProcessing[vocabId + "_save"]) return;
    setActionProcessing(prev => ({ ...prev, [vocabId + "_save"]: true }));

    const isCurrentSaved = !!entry.is_saved;

    // Optimistic UI updates
    setResults(prev => 
      prev.map(item => 
        item.related_vocabulary_id === vocabId 
          ? { ...item, is_saved: !isCurrentSaved } 
          : item
      )
    );
    if (selectedEntry && selectedEntry.related_vocabulary_id === vocabId) {
      setSelectedEntry(prev => prev ? { ...prev, is_saved: !isCurrentSaved } : null);
    }

    try {
      const folderId = await getOrCreateDefaultFolderId();
      if (!folderId) {
        showToast("Không thể tạo hoặc lấy thư mục lưu từ.");
        // Revert
        setResults(prev => 
          prev.map(item => 
            item.related_vocabulary_id === vocabId 
              ? { ...item, is_saved: isCurrentSaved } 
              : item
          )
        );
        return;
      }

      if (isCurrentSaved) {
        await axiosClient.delete(`/folders/${folderId}/system-vocabularies/${vocabId}`);
      } else {
        await axiosClient.post(`/folders/${folderId}/system-vocabularies`, { vocabulary_id: vocabId });
      }

      showToast(isCurrentSaved ? "Đã xóa khỏi thư mục lưu trữ." : "Đã lưu từ vựng thành công.");
    } catch (err) {
      console.error("Error toggling save word:", err);
      // Revert optimistic update
      setResults(prev => 
        prev.map(item => 
          item.related_vocabulary_id === vocabId 
            ? { ...item, is_saved: isCurrentSaved } 
            : item
        )
      );
      showToast("Không thể kết nối đến máy chủ.");
    } finally {
      setActionProcessing(prev => ({ ...prev, [vocabId + "_save"]: false }));
    }
  };

  const playAudio = (entry: DictionaryEntry) => {
    const audioUrl = entry.vocabulary?.audio_url;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => {
        console.warn("Failed to play audio url, falling back to TTS:", err);
        speakTerm(entry.term_jp);
      });
    } else {
      speakTerm(entry.term_jp);
    }
  };

  const speakTerm = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      window.speechSynthesis.speak(utterance);
    } else {
      showToast("Thiết bị không hỗ trợ phát âm.");
    }
  };

  const getLevelPillColors = (level?: string) => {
    switch (level) {
      case "N5":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      case "N4":
        return "bg-sky-50 text-sky-600 border border-sky-100";
      case "N3":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "N2":
        return "bg-orange-50 text-orange-600 border border-orange-100";
      case "N1":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      default:
        return "bg-zinc-50 text-zinc-500 border border-zinc-100";
    }
  };

  const highlightTerm = (sentence?: string, term?: string) => {
    if (!sentence || !term) return sentence || "";
    const parts = sentence.split(term);
    return (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="text-[#b7152b] font-bold">{term}</span>
            )}
          </span>
        ))}
      </>
    );
  };





  return (
    <div className="space-y-8 animate-fade-in-up relative pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-xl animate-fade-in-up">
          <AlertCircle size={18} className="text-red-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2 font-serif">
          Dictionary
        </h1>
        <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
          Tra cứu từ vựng tiếng Nhật, Hán tự và các mẫu ngữ pháp JLPT từ N5 đến N1.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left/Center Column: Search & Results */}
        <div className="flex-1 w-full min-w-0 space-y-6">
          {/* Search Card Container */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm space-y-4">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập từ vựng cần tra cứu..."
                  className="w-full h-13 pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-base placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#b7152b]/10 focus:border-[#b7152b] transition-all font-medium"
                />
              </div>
              <Button 
                type="submit"
                disabled={loading}
                variant="unstyled"
                className="h-13 w-auto bg-[#b7152b] hover:bg-[#991120] text-white font-bold px-8 rounded-2xl flex items-center justify-center gap-2 shadow-sm shadow-red-100 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
              </Button>
            </form>

            {/* Level Selector Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-50">
              {["All", "N5", "N4", "N3", "N2", "N1"].map((level) => {
                const isSelected = selectedLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
                    className={`h-9 px-4 rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? level === "All"
                          ? "bg-zinc-900 border-zinc-950 text-white"
                          : level === "N5"
                          ? "bg-blue-600 border-blue-700 text-white"
                          : level === "N4"
                          ? "bg-sky-500 border-sky-600 text-white"
                          : level === "N3"
                          ? "bg-emerald-600 border-emerald-700 text-white"
                          : level === "N2"
                          ? "bg-orange-500 border-orange-600 text-white"
                          : "bg-rose-500 border-rose-600 text-white"
                        : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results section */}
          {loading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-6 h-36 animate-pulse flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-1/3 h-6 bg-zinc-200 rounded" />
                    <div className="w-12 h-5 bg-zinc-100 rounded-full" />
                  </div>
                  <div className="w-2/3 h-4 bg-zinc-200 rounded" />
                  <div className="w-1/2 h-4 bg-zinc-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && lastQuery && (
            <div className="space-y-4">
              <span className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase block mb-1">
                SHOWING RESULTS FOR &quot;{lastQuery}&quot;
              </span>

              {results.length === 0 ? (
                <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center shadow-sm">
                  <p className="text-zinc-500 font-medium">Không tìm thấy từ vựng nào khớp với từ khóa của bạn.</p>
                  <p className="text-zinc-400 text-xs mt-2">Vui lòng kiểm tra lại chính tả hoặc thay đổi bộ lọc cấp độ.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((entry) => {
                    const isSelected = selectedEntryId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px] relative overflow-hidden group ${
                          isSelected 
                            ? "border-l-4 border-l-[#b7152b] border-zinc-200 shadow-md" 
                            : "border-zinc-100 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            {/* Kanji title */}
                            <h3 className="text-2xl font-extrabold text-zinc-900 mb-1 group-hover:text-[#b7152b] transition-colors font-sans">
                              {entry.term_jp}
                            </h3>
                            {/* Reading */}
                            <span className="text-sm text-zinc-500 font-semibold block">
                              {entry.reading_hiragana} • {getRomaji(entry)}
                            </span>
                          </div>

                          {/* JLPT Level Badge */}
                          {entry.jlpt_level && (
                            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${getLevelPillColors(entry.jlpt_level)}`}>
                              {entry.jlpt_level}
                            </span>
                          )}
                        </div>

                        {/* Meaning preview */}
                        <p className="text-sm text-zinc-600 mt-4 leading-relaxed font-medium line-clamp-2 pr-20">
                          {entry.meaning_vi}
                        </p>

                        {/* Action buttons on card (Favorites/Save) */}
                        {entry.related_vocabulary_id && (
                          <div className="absolute bottom-6 right-6 flex items-center gap-2">
                            {/* Save Bookmarks */}
                            <button
                              onClick={(e) => handleSaveWordToggle(entry, e)}
                              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                                entry.is_saved
                                  ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm"
                                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-zinc-700"
                              }`}
                              title={entry.is_saved ? "Saved" : "Save Word"}
                            >
                              <Bookmark size={15} fill={entry.is_saved ? "currentColor" : "none"} />
                            </button>

                            {/* Favorites (Heart) */}
                            <button
                              onClick={(e) => handleFavoriteToggle(entry, e)}
                              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all ${
                                entry.is_favorited
                                  ? "bg-red-50 border-red-200 text-[#b7152b] shadow-sm"
                                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-zinc-700"
                              }`}
                              title={entry.is_favorited ? "Favorited" : "Favorite"}
                            >
                              <Heart size={15} fill={entry.is_favorited ? "currentColor" : "none"} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!lastQuery && !loading && (
            <div className="bg-white border border-zinc-100 rounded-3xl p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-[#b7152b] flex items-center justify-center mx-auto">
                <Search size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-zinc-900">Tra cứu nhanh từ vựng</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                Nhập từ vựng, Hiragana, Hán tự hoặc nghĩa tiếng Việt/tiếng Anh ở khung tìm kiếm phía trên để bắt đầu tra cứu.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Word Detail Pane */}
        {/* Desktop Sticky Container */}
        <div className={`w-full lg:w-[450px] flex-shrink-0 lg:sticky lg:top-24 z-50 lg:z-20 ${
          selectedEntryId 
            ? "fixed inset-0 lg:relative lg:inset-auto bg-white lg:bg-transparent overflow-y-auto lg:overflow-visible block" 
            : "hidden"
        }`}>
          {selectedEntryId && (
            <div className="bg-white border border-zinc-100 lg:rounded-3xl p-6 lg:p-8 shadow-xl lg:shadow-sm min-h-screen lg:h-[calc(100vh-120px)] lg:overflow-y-auto flex flex-col justify-between relative">
              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedEntryId(null);
                  setSelectedEntry(null);
                }}
                className="absolute top-6 right-6 z-50 w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-950 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                <X size={20} />
              </button>

              {detailLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#b7152b]" />
                  <span className="text-xs text-zinc-400 font-semibold">Đang tải chi tiết...</span>
                </div>
              )}

              {!detailLoading && selectedEntry && (
                <div className="space-y-8 animate-fade-in-up">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {selectedEntry.jlpt_level && (
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${getLevelPillColors(selectedEntry.jlpt_level)}`}>
                        {selectedEntry.jlpt_level}
                      </span>
                    )}
                    {selectedEntry.part_of_speech && (
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200/50 uppercase tracking-wider">
                        {selectedEntry.part_of_speech}
                      </span>
                    )}
                  </div>

                  {/* Term and Readings */}
                  <div>
                    <h2 className="text-4xl font-extrabold text-zinc-900 font-sans tracking-tight">
                      {selectedEntry.term_jp}
                    </h2>
                    <span className="text-base text-zinc-400 font-semibold block mt-1.5">
                      {selectedEntry.reading_hiragana} • {getRomaji(selectedEntry)}
                    </span>
                  </div>

                  {/* Actions buttons inside detail pane */}
                  {selectedEntry.related_vocabulary_id && (
                    <div className="flex items-center gap-3">
                      {/* Listen Button */}
                      <button
                        onClick={() => playAudio(selectedEntry)}
                        className="flex-1 h-12 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-bold px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                      >
                        <Volume2 size={16} className="text-zinc-600" />
                        Listen
                      </button>

                      {/* Save Word Button */}
                      <button
                        onClick={(e) => handleSaveWordToggle(selectedEntry, e)}
                        className={`flex-1 h-12 font-bold px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-sm ${
                          selectedEntry.is_saved
                            ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200"
                            : "bg-[#b7152b] hover:bg-[#991120] text-white"
                        }`}
                      >
                        {selectedEntry.is_saved ? (
                          <>
                            <Check size={16} />
                            Saved
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            Save Word
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Meanings */}
                  <div>
                    <span className="text-[10px] font-extrabold tracking-widest text-[#b7152b]/80 uppercase block mb-3.5">
                      MEANING
                    </span>
                    <div className="space-y-4">
                      {/* Vietnamese meaning */}
                      <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4">
                        <span className="text-[9px] font-extrabold text-zinc-400 block tracking-wider uppercase mb-1">
                          Tiếng Việt
                        </span>
                        <p className="text-base font-bold text-zinc-800 font-sans">
                          {selectedEntry.meaning_vi}
                        </p>
                      </div>

                      {/* English meaning */}
                      <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4">
                        <span className="text-[9px] font-extrabold text-zinc-400 block tracking-wider uppercase mb-1">
                          English
                        </span>
                        <p className="text-sm font-semibold text-zinc-600">
                          {selectedEntry.meaning_en}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Example sentences */}
                  {selectedEntry.vocabulary && (selectedEntry.vocabulary.example_sentence_jp || selectedEntry.vocabulary.example_sentence_vi) && (
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest text-[#b7152b]/80 uppercase block mb-3.5">
                        EXAMPLES
                      </span>
                      <div className="bg-zinc-50/30 border border-zinc-100 rounded-2xl p-4 space-y-2">
                        {selectedEntry.vocabulary.example_sentence_jp && (
                          <p className="text-base font-bold text-zinc-800 font-sans leading-relaxed">
                            {highlightTerm(selectedEntry.vocabulary.example_sentence_jp, selectedEntry.term_jp)}
                          </p>
                        )}
                        {selectedEntry.vocabulary.example_sentence_vi && (
                          <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                            {selectedEntry.vocabulary.example_sentence_vi}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kanji breakdown */}
                  {getKanjiBreakdown(selectedEntry.term_jp).length > 0 && (
                    <div>
                      <span className="text-[10px] font-extrabold tracking-widest text-[#b7152b]/80 uppercase block mb-3.5">
                        KANJI BREAKDOWN
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {getKanjiBreakdown(selectedEntry.term_jp).map((kanjiChar) => {
                          const detail = kanjiDetails[kanjiChar];
                          return (
                            <div 
                              key={kanjiChar}
                              className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-4 text-center space-y-1"
                            >
                              <span className="text-3xl font-extrabold text-zinc-900 block font-sans">
                                {kanjiChar}
                              </span>
                              <span className="text-xs text-zinc-500 font-bold block">
                                {detail ? detail.reading : "..."}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium block">
                                {detail ? detail.meaning : "Loading..."}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default DictionaryView;
