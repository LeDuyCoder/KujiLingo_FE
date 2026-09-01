"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Folder as FolderIcon, 
  Search, 
  Plus, 
  Check, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  Heart, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List, 
  MoreHorizontal, 
  PlusCircle, 
  Minus,
  Star, 
  FileText,
  GraduationCap,
  Lightbulb,
  BookOpen,
  Brain,
  Flame,
  Tag,
  Compass,
  Sparkles,
  Award,
  Music,
  Smile,
  Coffee,
  Play
} from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import Link from "next/link";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { convertHiraganaToRomaji } from "@/shared/utils/romaji";

interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  system_vocab_count: number;
  user_vocab_count: number;
}

interface SystemVocabulary {
  id: string;
  kanji: string;
  hiragana: string;
  meaning: string;
  jlpt?: string;
  is_favorited?: boolean;
}

interface UserVocabulary {
  id: string;
  kanji: string;
  hiragana: string;
  romaji?: string;
  meaning: string;
  note?: string;
  is_favorited?: boolean;
}

interface FolderContents {
  folder_id: string;
  name: string;
  system_vocabularies: SystemVocabulary[];
  user_vocabularies: UserVocabulary[];
}

interface DictSearchResult {
  id: string;
  term_jp: string;
  reading_hiragana: string;
  meaning_vi: string;
  meaning_en: string;
  jlpt_level?: string;
  related_vocabulary_id: string;
}

export default function MyWordsPage() {
  const { accessToken } = useAuthStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderContents, setFolderContents] = useState<FolderContents | null>(null);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [contentsLoading, setContentsLoading] = useState(false);
  
  // Search & Filter
  const [folderSearch, setFolderSearch] = useState("");
  const [wordSearch, setWordSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination for folders
  const [folderPage, setFolderPage] = useState(1);

  // Pagination for words inside the selected folder
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Folder Modals
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  
  // Folder Form inputs
  const [folderName, setFolderName] = useState("");
  const [folderColor, setFolderColor] = useState("#b7152b");
  const [folderIconName, setFolderIconName] = useState("folder");

  // Add Word Modal
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [addWordTab, setAddWordTab] = useState<"system" | "custom">("system");
  
  // Add System Word Search
  const [dictSearchQuery, setDictSearchQuery] = useState("");
  const [dictSearchResults, setDictSearchResults] = useState<DictSearchResult[]>([]);
  const [dictSearchLoading, setDictSearchLoading] = useState(false);

  // Add Custom Word Form
  const [customWordKanji, setCustomWordKanji] = useState("");
  const [customWordHiragana, setCustomWordHiragana] = useState("");
  const [customWordRomaji, setCustomWordRomaji] = useState("");
  const [customWordMeaning, setCustomWordMeaning] = useState("");
  const [customWordNote, setCustomWordNote] = useState("");

  // Edit Note Modal
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [wordToEditNote, setWordToEditNote] = useState<UserVocabulary | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // Custom Confirm Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Xác nhận");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  // Action process locks
  const [actionProcessing, setActionProcessing] = useState<Record<string, boolean>>({});

  const showToast = (message: string) => {
    setToastMessage(message);
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setOnConfirmCallback(() => onConfirm);
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    if (onConfirmCallback) {
      onConfirmCallback();
    }
    setIsConfirmOpen(false);
  };

  const getRomaji = (kanji: string, hiragana: string) => {
    return convertHiraganaToRomaji(hiragana || kanji);
  };

  // 1. Fetch all folders
  const fetchFolders = useCallback(async () => {
    try {
      setFoldersLoading(true);
      const response = await axiosClient.get("/folders");
      if (response.data && response.data.success) {
        const fetchedFolders = response.data.data;
        setFolders(fetchedFolders);
        // Automatically select the first folder if none is selected
        if (fetchedFolders.length > 0 && !selectedFolderId) {
          setSelectedFolderId(fetchedFolders[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      showToast("Không thể tải danh sách thư mục.");
    } finally {
      setFoldersLoading(false);
    }
  }, [selectedFolderId]);

  // 2. Fetch contents of selected folder
  const fetchFolderContents = useCallback(async (folderId: string) => {
    try {
      setContentsLoading(true);
      const response = await axiosClient.get(`/folders/${folderId}/contents`);
      if (response.data && response.data.success) {
        setFolderContents(response.data.data);
        setCurrentPage(1); // Reset to page 1 on folder switch
      }
    } catch (err) {
      console.error("Error fetching folder contents:", err);
      showToast("Không thể tải nội dung thư mục.");
    } finally {
      setContentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      const timer = setTimeout(() => {
        fetchFolders();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [accessToken, fetchFolders]);

  useEffect(() => {
    if (selectedFolderId) {
      const timer = setTimeout(() => {
        fetchFolderContents(selectedFolderId);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setFolderContents(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedFolderId, fetchFolderContents]);



  // 3. Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      showToast("Tên thư mục không được để trống.");
      return;
    }
    try {
      const response = await axiosClient.post("/folders", {
        name: folderName.trim(),
        color: folderColor,
        icon: folderIconName,
      });
      if (response.data && response.data.success) {
        showToast("Tạo thư mục thành công.");
        setIsCreateFolderOpen(false);
        setFolderName("");
        
        // Refresh folders and select the newly created one
        const newFolder = response.data.data;
        setSelectedFolderId(newFolder.id);
        fetchFolders();
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      showToast("Không thể tạo thư mục.");
    }
  };

  // 4. Update folder
  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderToEdit || !folderName.trim()) return;

    try {
      const response = await axiosClient.put(`/folders/${folderToEdit.id}`, {
        name: folderName.trim(),
        color: folderColor,
        icon: folderIconName,
      });
      if (response.data && response.data.success) {
        showToast("Cập nhật thư mục thành công.");
        setIsEditFolderOpen(false);
        setFolderToEdit(null);
        setFolderName("");
        fetchFolders();
      }
    } catch (err) {
      console.error("Error updating folder:", err);
      showToast("Không thể cập nhật thư mục.");
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    showConfirm(
      "Xóa thư mục",
      "Bạn có chắc chắn muốn xóa thư mục này? Toàn bộ liên kết từ vựng trong thư mục sẽ bị xóa.",
      async () => {
        try {
          const response = await axiosClient.delete(`/folders/${folderId}`);
          if (response.data && response.data.success) {
            showToast("Xóa thư mục thành công.");
            setIsEditFolderOpen(false);
            setFolderToEdit(null);
            
            // Select another folder if we deleted the current active one
            if (selectedFolderId === folderId) {
              const remaining = folders.filter(f => f.id !== folderId);
              setSelectedFolderId(remaining.length > 0 ? remaining[0].id : null);
            }
            fetchFolders();
          }
        } catch (err) {
          console.error("Error deleting folder:", err);
          showToast("Không thể xóa thư mục.");
        }
      }
    );
  };

  // 6. Search platform dictionary for adding system word
  const handleDictSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dictSearchQuery.trim()) return;
    try {
      setDictSearchLoading(true);
      const response = await axiosClient.get(`/dictionary/search?q=${encodeURIComponent(dictSearchQuery.trim())}`);
      if (response.data && response.data.success) {
        setDictSearchResults(response.data.data || []);
      }
    } catch (err) {
      console.error("Error searching dictionary:", err);
      showToast("Không thể tìm kiếm từ vựng hệ thống.");
    } finally {
      setDictSearchLoading(false);
    }
  };

  // 7. Add platform system word to current folder
  const handleAddSystemWord = async (vocabId: string) => {
    if (!selectedFolderId) return;
    setActionProcessing(prev => ({ ...prev, [vocabId]: true }));
    try {
      const response = await axiosClient.post(`/folders/${selectedFolderId}/system-vocabularies`, {
        vocabulary_id: vocabId,
      });
      if (response.data && response.data.success) {
        showToast("Đã thêm từ vựng hệ thống vào thư mục.");
        fetchFolderContents(selectedFolderId);
        fetchFolders(); // Update counts
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { status: number } };
        if (axiosErr.response?.status === 409) {
          showToast("Từ vựng này đã có trong thư mục.");
          return;
        }
      }
      console.error("Error adding system vocab:", err);
      showToast("Không thể thêm từ vựng.");
    } finally {
      setActionProcessing(prev => ({ ...prev, [vocabId]: false }));
    }
  };

  // 8. Add custom word (creates user vocab first, then links it to folder)
  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId) return;
    if (!customWordKanji.trim() || !customWordMeaning.trim()) {
      showToast("Vui lòng điền đầy đủ Từ vựng và Ý nghĩa.");
      return;
    }

    try {
      // Step 1: Create user vocabulary
      const userVocabResponse = await axiosClient.post("/user-vocabularies", {
        kanji: customWordKanji.trim(),
        hiragana: customWordHiragana.trim() || undefined,
        romaji: customWordRomaji.trim() || undefined,
        meaning: customWordMeaning.trim(),
        note: customWordNote.trim() || undefined,
      });

      if (userVocabResponse.data && userVocabResponse.data.success) {
        const userVocabId = userVocabResponse.data.data.id;

        // Step 2: Link to current folder
        const linkResponse = await axiosClient.post(`/folders/${selectedFolderId}/user-vocabularies`, {
          user_vocabulary_id: userVocabId,
        });

        if (linkResponse.data && linkResponse.data.success) {
          showToast("Đã lưu từ vựng tự biên soạn vào thư mục.");
          // Clear inputs
          setCustomWordKanji("");
          setCustomWordHiragana("");
          setCustomWordRomaji("");
          setCustomWordMeaning("");
          setCustomWordNote("");
          
          setIsAddWordOpen(false);
          fetchFolderContents(selectedFolderId);
          fetchFolders(); // Update counts
        }
      }
    } catch (err) {
      console.error("Error creating custom word:", err);
      showToast("Không thể lưu từ vựng.");
    }
  };

  const handleRemoveWord = (wordId: string, isUserVocab: boolean) => {
    if (!selectedFolderId) return;
    showConfirm(
      "Bỏ lưu từ vựng",
      "Bạn có chắc chắn muốn bỏ lưu từ vựng này khỏi thư mục?",
      async () => {
        try {
          const endpoint = isUserVocab 
            ? `/folders/${selectedFolderId}/user-vocabularies/${wordId}`
            : `/folders/${selectedFolderId}/system-vocabularies/${wordId}`;
            
          const response = await axiosClient.delete(endpoint);
          if (response.data && response.data.success) {
            showToast("Đã xóa từ vựng khỏi thư mục.");
            fetchFolderContents(selectedFolderId);
            fetchFolders(); // Update counts
          }
        } catch (err) {
          console.error("Error removing word:", err);
          showToast("Không thể xóa từ vựng khỏi thư mục.");
        }
      }
    );
  };

  // 10. Toggle favorite status for words
  const handleToggleFavorite = async (vocabId: string) => {
    setActionProcessing(prev => ({ ...prev, [vocabId + "_fav"]: true }));
    
    // Find current favorite state from system_vocabularies or user_vocabularies
    let isCurrentFav = false;
    if (folderContents) {
      const sysMatch = folderContents.system_vocabularies.find(v => v.id === vocabId);
      const userMatch = folderContents.user_vocabularies.find(v => v.id === vocabId);
      isCurrentFav = !!(sysMatch?.is_favorited || userMatch?.is_favorited);
    }

    try {
      const url = isCurrentFav 
        ? `/api/v1/favorite-vocabularies/${vocabId}`
        : `/api/v1/favorite-vocabularies`;

      if (isCurrentFav) {
        await axiosClient.delete(url);
      } else {
        await axiosClient.post(url, { vocabulary_id: vocabId });
      }

      showToast(isCurrentFav ? "Đã bỏ yêu thích." : "Đã thêm vào yêu thích.");
      
      // Update local state
      if (folderContents) {
        setFolderContents({
          ...folderContents,
          system_vocabularies: folderContents.system_vocabularies.map(v => 
            v.id === vocabId ? { ...v, is_favorited: !isCurrentFav } : v
          ),
          user_vocabularies: folderContents.user_vocabularies.map(v => 
            v.id === vocabId ? { ...v, is_favorited: !isCurrentFav } : v
          ),
        });
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { status: number } };
        // If adding (POST) but already favorited in DB, treat as success
        if (!isCurrentFav && axiosErr.response?.status === 409) {
          showToast("Đã thêm vào yêu thích.");
          if (folderContents) {
            setFolderContents({
              ...folderContents,
              system_vocabularies: folderContents.system_vocabularies.map(v => 
                v.id === vocabId ? { ...v, is_favorited: true } : v
              ),
              user_vocabularies: folderContents.user_vocabularies.map(v => 
                v.id === vocabId ? { ...v, is_favorited: true } : v
              ),
            });
          }
          return;
        }
        // If removing (DELETE) but already removed in DB (404), treat as success
        if (isCurrentFav && axiosErr.response?.status === 404) {
          showToast("Đã bỏ yêu thích.");
          if (folderContents) {
            setFolderContents({
              ...folderContents,
              system_vocabularies: folderContents.system_vocabularies.map(v => 
                v.id === vocabId ? { ...v, is_favorited: false } : v
              ),
              user_vocabularies: folderContents.user_vocabularies.map(v => 
                v.id === vocabId ? { ...v, is_favorited: false } : v
              ),
            });
          }
          return;
        }
      }
      console.error("Error toggling favorite:", err);
      showToast("Thao tác thất bại.");
    } finally {
      setActionProcessing(prev => ({ ...prev, [vocabId + "_fav"]: false }));
    }
  };

  // 11. Update Custom Word Note
  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordToEditNote || !selectedFolderId) return;
    try {
      const response = await axiosClient.put(`/user-vocabularies/${wordToEditNote.id}`, {
        note: editNoteText.trim(),
      });
      if (response.data && response.data.success) {
        showToast("Cập nhật ghi chú thành công.");
        setIsEditNoteOpen(false);
        setWordToEditNote(null);
        setEditNoteText("");
        fetchFolderContents(selectedFolderId);
      }
    } catch (err) {
      console.error("Error updating word note:", err);
      showToast("Không thể cập nhật ghi chú.");
    }
  };

  // Merge, search and paginate folder contents
  const getFilteredMergedContents = () => {
    if (!folderContents) return [];

    const sysWords = folderContents.system_vocabularies.map(w => ({
      ...w,
      isUserVocab: false,
      romaji: undefined as string | undefined,
      note: "" // System words don't have notes in DB schema
    }));

    const userWords = folderContents.user_vocabularies.map(w => ({
      ...w,
      isUserVocab: true,
      jlpt: "Tự thêm"
    }));

    const merged = [...sysWords, ...userWords];

    if (!wordSearch.trim()) return merged;

    const term = wordSearch.toLowerCase().trim();
    return merged.filter(
      w => 
        (w.kanji && w.kanji.toLowerCase().includes(term)) ||
        (w.hiragana && w.hiragana.toLowerCase().includes(term)) ||
        (w.meaning && w.meaning.toLowerCase().includes(term)) ||
        (w.note && w.note.toLowerCase().includes(term))
    );
  };

  const filteredItems = getFilteredMergedContents();
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getFilteredFolders = () => {
    if (!folderSearch.trim()) return folders;
    return folders.filter(f => f.name.toLowerCase().includes(folderSearch.toLowerCase().trim()));
  };

  const filteredFolders = getFilteredFolders();

  const getPaginatedFolders = () => {
    const combined = [
      ...filteredFolders.map(f => ({ ...f, isCreateBtn: false })),
      { id: "create-btn-placeholder", name: "Create Folder", color: "#b7152b", icon: "folder", system_vocab_count: 0, user_vocab_count: 0, isCreateBtn: true }
    ];

    const limit = viewMode === "grid" ? 4 : 8;
    const totalPages = Math.max(1, Math.ceil(combined.length / limit));
    const activePage = Math.min(folderPage, totalPages);

    const startIndex = (activePage - 1) * limit;
    const items = combined.slice(startIndex, startIndex + limit);

    return {
      items,
      totalPages,
      activePage
    };
  };

  const { items: paginatedFolders, totalPages: totalFolderPages, activePage: activeFolderPage } = getPaginatedFolders();

  const openEditFolderModal = (folder: Folder) => {
    setFolderToEdit(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color || "#b7152b");
    setFolderIconName(folder.icon || "folder");
    setIsEditFolderOpen(true);
  };

  const openCreateFolderModal = () => {
    setFolderName("");
    setFolderColor("#b7152b");
    setFolderIconName("folder");
    setIsCreateFolderOpen(true);
  };

  const openEditNoteModal = (word: UserVocabulary) => {
    setWordToEditNote(word);
    setEditNoteText(word.note || "");
    setIsEditNoteOpen(true);
  };

  const renderFolderIcon = (iconName?: string, size: number = 20, fill: boolean = false) => {
    switch (iconName) {
      case "star":
        return <Star size={size} fill={fill ? "currentColor" : "none"} />;
      case "heart":
        return <Heart size={size} fill={fill ? "currentColor" : "none"} />;
      case "book":
        return <FileText size={size} />;
      case "graduation-cap":
        return <GraduationCap size={size} />;
      case "lightbulb":
        return <Lightbulb size={size} />;
      case "book-open":
        return <BookOpen size={size} />;
      case "brain":
        return <Brain size={size} />;
      case "flame":
        return <Flame size={size} />;
      case "tag":
        return <Tag size={size} />;
      case "compass":
        return <Compass size={size} />;
      case "sparkles":
        return <Sparkles size={size} />;
      case "award":
        return <Award size={size} />;
      case "music":
        return <Music size={size} />;
      case "smile":
        return <Smile size={size} />;
      case "coffee":
        return <Coffee size={size} />;
      case "folder":
      default:
        return <FolderIcon size={size} fill={fill ? "currentColor" : "none"} />;
    }
  };

  return (
    <>
      <div className="space-y-8 pb-16 animate-fade-in-up">
        {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle size={16} className="text-red-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-100 p-8 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 font-sans tracking-tight">
            Vocabulary Management
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Organize and review your personal word lists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search folders..."
              value={folderSearch}
              onChange={(e) => { setFolderSearch(e.target.value); setFolderPage(1); }}
              className="w-48 md:w-64 pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all font-semibold"
            />
          </div>
          <Button onClick={openCreateFolderModal} className="w-auto h-10 px-4 flex items-center gap-2 text-sm">
            <Plus size={16} />
            New Folder
          </Button>
        </div>
      </div>

      {/* Folders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 font-sans">My Folders</h2>
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex items-center gap-1 border border-zinc-200 p-1 rounded-xl bg-zinc-50">
              <button
                onClick={() => { setViewMode("grid"); setFolderPage(1); }}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-400 hover:text-zinc-700"}`}
              >
                <Grid size={15} />
              </button>
              <button
                onClick={() => { setViewMode("list"); setFolderPage(1); }}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white text-zinc-800 shadow-sm" : "text-zinc-400 hover:text-zinc-700"}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {foldersLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3 bg-white border border-zinc-100 rounded-3xl">
            <Loader2 className="w-8 h-8 animate-spin text-[#b7152b]" />
            <span className="text-xs text-zinc-400 font-semibold">Đang tải thư mục...</span>
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <FolderIcon className="text-zinc-300" size={48} />
            <div>
              <h3 className="font-extrabold text-zinc-900">Không có thư mục nào</h3>
              <p className="text-zinc-400 text-xs mt-1">Hãy tạo thư mục mới để bắt đầu lưu từ vựng.</p>
            </div>
            <Button onClick={openCreateFolderModal} className="w-auto h-9 text-xs px-4">
              Tạo thư mục
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Layout – 4 per page */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedFolders.map((item) => {
                if (item.isCreateBtn) {
                  return (
                    <div
                      key="create-btn"
                      onClick={openCreateFolderModal}
                      className="border-2 border-dashed border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50/50 transition-colors group min-h-[130px]"
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-zinc-300 group-hover:border-zinc-400 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
                        <Plus size={18} />
                      </div>
                      <span className="text-zinc-500 group-hover:text-zinc-800 text-xs font-bold mt-3 transition-colors">
                        Tạo thư mục mới
                      </span>
                    </div>
                  );
                }
                const isSelected = selectedFolderId === item.id;
                const totalWords = item.system_vocab_count + item.user_vocab_count;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFolderId(item.id)}
                    className={`bg-white border rounded-3xl p-6 relative cursor-pointer group transition-all duration-300 hover:shadow-md hover:border-zinc-300/80 flex flex-col justify-between min-h-[130px] ${
                      isSelected ? "border-[#b7152b] ring-2 ring-[#b7152b]/5 bg-rose-50/5" : "border-zinc-100"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color || "#b7152b"}15`, color: item.color || "#b7152b" }}
                      >
                        {renderFolderIcon(item.icon, 20, isSelected)}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditFolderModal(item as Folder); }}
                        className="text-zinc-400 hover:text-zinc-900 p-1 hover:bg-zinc-50 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div className="mt-4">
                      <h3 className={`font-extrabold text-base tracking-tight ${isSelected ? "text-[#b7152b]" : "text-zinc-900"}`}>
                        {item.name}
                      </h3>
                      <p className="text-zinc-400 text-xs font-semibold mt-1">{totalWords} từ vựng</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Folder Pagination – Grid */}
            {totalFolderPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setFolderPage(prev => Math.max(1, prev - 1))}
                  disabled={activeFolderPage === 1}
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalFolderPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFolderPage(i + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      activeFolderPage === i + 1
                        ? "bg-[#b7152b] text-white shadow-sm"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setFolderPage(prev => Math.min(totalFolderPages, prev + 1))}
                  disabled={activeFolderPage === totalFolderPages}
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* List/Horizontal View Layout – 8 per page */
          <div className="space-y-4">
            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
              {paginatedFolders.map((item) => {
                if (item.isCreateBtn) {
                  return (
                    <div
                      key="create-btn"
                      onClick={openCreateFolderModal}
                      className="flex-shrink-0 min-w-[180px] border-2 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer transition-colors group"
                    >
                      <PlusCircle size={16} className="text-zinc-400 group-hover:text-zinc-600" />
                      <span className="text-zinc-500 group-hover:text-zinc-800 text-xs font-bold">New Folder</span>
                    </div>
                  );
                }
                const isSelected = selectedFolderId === item.id;
                const totalWords = item.system_vocab_count + item.user_vocab_count;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedFolderId(item.id)}
                    className={`flex-shrink-0 min-w-[180px] bg-white border rounded-2xl p-4 cursor-pointer relative group transition-all hover:border-zinc-300/80 ${
                      isSelected ? "border-[#b7152b] ring-2 ring-[#b7152b]/5 bg-rose-50/10" : "border-zinc-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-500 border border-zinc-100">
                        {totalWords} terms
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditFolderModal(item as Folder); }}
                        className="text-zinc-400 hover:text-zinc-950 p-0.5 hover:bg-zinc-50 rounded-md"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                    <h3 className={`font-extrabold text-sm mt-3 ${isSelected ? "text-[#b7152b]" : "text-zinc-800"}`}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-1">
                      {isSelected ? "Viewing now" : "Updated recent"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Folder Pagination – List */}
            {totalFolderPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                <button
                  onClick={() => setFolderPage(prev => Math.max(1, prev - 1))}
                  disabled={activeFolderPage === 1}
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalFolderPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFolderPage(i + 1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                      activeFolderPage === i + 1
                        ? "bg-[#b7152b] text-white shadow-sm"
                        : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setFolderPage(prev => Math.min(totalFolderPages, prev + 1))}
                  disabled={activeFolderPage === totalFolderPages}
                  className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Folder Contents Section */}
      {selectedFolderId && (
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-zinc-950 tracking-tight">
                {folderContents?.name || "Folder Contents"}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-red-50 text-[#b7152b] border border-red-100/50">
                {filteredItems.length} words
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Filter word in folder..."
                  value={wordSearch}
                  onChange={(e) => setWordSearch(e.target.value)}
                  className="w-48 pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] transition-all font-semibold"
                />
              </div>

              <button
                onClick={() => setIsAddWordOpen(true)}
                className="w-auto h-10 px-4 rounded-xl border border-red-200 hover:bg-red-50/50 text-[#b7152b] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Plus size={14} />
                Add Word
              </button>
              {(() => {
                const folderWordCount = folderContents ? folderContents.system_vocabularies.length + folderContents.user_vocabularies.length : 0;
                const isLearnDisabled = folderWordCount < 10;
                
                if (isLearnDisabled) {
                  return (
                    <div className="relative flex items-center group">
                      <button
                        disabled
                        className="w-auto h-10 px-4 rounded-xl bg-zinc-200 text-zinc-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap cursor-not-allowed"
                      >
                        <Play size={14} fill="currentColor" />
                        Learn
                      </button>
                      {/* Custom Tooltip */}
                      <div className="absolute top-full right-0 mt-2.5 w-max max-w-[200px] bg-zinc-800 text-white text-[11px] px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none text-center font-medium">
                        Cần tối thiểu 10 từ vựng
                        {/* Triangle pointer */}
                        <div className="absolute -top-1 right-6 w-2 h-2 bg-zinc-800 transform rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    href={`/my-words/${selectedFolderId}/learn`}
                    className="w-auto h-10 px-4 rounded-xl bg-[#b7152b] hover:bg-[#9a1022] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    <Play size={14} fill="currentColor" />
                    Learn
                  </Link>
                );
              })()}
            </div>
          </div>

          {/* Words table */}
          {contentsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#b7152b]" />
              <span className="text-xs text-zinc-400 font-semibold">Đang tải từ vựng...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-zinc-50/50 border border-zinc-100 rounded-2xl space-y-3">
              <FileText className="text-zinc-300 mx-auto" size={36} />
              <p className="text-zinc-500 text-xs font-bold">Thư mục chưa có từ vựng nào.</p>
              <Button onClick={() => setIsAddWordOpen(true)} className="w-auto h-8 text-[11px] px-3 mx-auto flex items-center justify-center">
                Thêm từ vựng ngay
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                      <th className="py-3 px-4">Word / Reading</th>
                      <th className="py-3 px-4">Meaning</th>
                      <th className="py-3 px-4">Note</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((word) => (
                      <tr 
                        key={word.id} 
                        className="border-b border-zinc-100/50 hover:bg-zinc-50/30 transition-colors"
                      >
                        {/* Word & Readings */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {word.is_favorited && (
                              <Star size={13} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                            <div>
                              <span className="text-base font-extrabold text-zinc-900 tracking-tight font-sans block">
                                {word.kanji}
                              </span>
                              <span className="text-xs text-zinc-400 font-semibold block mt-0.5">
                                {word.hiragana} {word.romaji ? `(${word.romaji})` : `(${getRomaji(word.kanji, word.hiragana)})`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Meaning */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-700">
                              {word.meaning}
                            </span>
                            {!word.isUserVocab && word.jlpt && (
                              <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-blue-50 text-blue-600 rounded uppercase border border-blue-100/50">
                                {word.jlpt}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Personal Notes */}
                        <td className="py-4 px-4 max-w-xs">
                          {word.isUserVocab ? (
                            <div className="flex items-center gap-1.5 group">
                              <span className="text-xs text-zinc-500 font-medium line-clamp-2">
                                {word.note || <em className="text-zinc-300">Không có ghi chú</em>}
                              </span>
                              <button
                                onClick={() => openEditNoteModal(word as UserVocabulary)}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 p-0.5 rounded transition-opacity"
                                title="Edit note"
                              >
                                <Edit3 size={11} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                              Platform Word
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Star toggles Favorites */}
                            <button
                              onClick={() => handleToggleFavorite(word.id)}
                              disabled={actionProcessing[word.id + "_fav"]}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                word.is_favorited
                                  ? "bg-amber-50 border-amber-200 text-amber-500"
                                  : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-400 hover:text-zinc-700"
                              }`}
                              title={word.is_favorited ? "Bỏ yêu thích" : "Yêu thích"}
                            >
                              <Heart size={13} fill={word.is_favorited ? "currentColor" : "none"} />
                            </button>

                            {/* Delete/Remove word from folder */}
                            <button
                              onClick={() => handleRemoveWord(word.id, word.isUserVocab)}
                              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors"
                              title="Xóa khỏi thư mục"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-100">
                  <span className="text-xs text-zinc-400 font-semibold">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                          currentPage === i + 1
                            ? "bg-[#b7152b] text-white shadow-sm"
                            : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      {/* CREATE FOLDER MODAL */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 border border-zinc-100 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-zinc-950 font-sans">Tạo Thư Mục Mới</h3>
              <button 
                onClick={() => setIsCreateFolderOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tên thư mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Từ vựng N3, Chuyến đi Nhật..."
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] font-semibold"
                />
              </div>

              {/* Color options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Màu sắc hiển thị</label>
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  {["#b7152b", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderColor(color)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {folderColor === color && (
                        <Check size={14} className="text-white font-extrabold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Biểu tượng</label>
                <div className="grid grid-cols-8 gap-2 pt-1 max-w-[320px]">
                  {[
                    "folder", "star", "heart", "book", 
                    "graduation-cap", "lightbulb", "book-open", "brain", 
                    "flame", "tag", "compass", "sparkles", 
                    "award", "music", "smile", "coffee"
                  ].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFolderIconName(icon)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        folderIconName === icon 
                          ? "bg-red-50 border-[#b7152b] text-[#b7152b]" 
                          : "border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                      }`}
                      title={icon}
                    >
                      {renderFolderIcon(icon, 16, folderIconName === icon)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Hủy
                </button>
                <Button type="submit" className="w-auto h-9 text-xs px-4">
                  Tạo Thư Mục
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FOLDER MODAL */}
      {isEditFolderOpen && folderToEdit && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 border border-zinc-100 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-zinc-950 font-sans">Chỉnh sửa thư mục</h3>
              <button 
                onClick={() => setIsEditFolderOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tên thư mục</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] font-semibold"
                />
              </div>

              {/* Color options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Màu sắc hiển thị</label>
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  {["#b7152b", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFolderColor(color)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {folderColor === color && (
                        <Check size={14} className="text-white font-extrabold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Biểu tượng</label>
                <div className="grid grid-cols-8 gap-2 pt-1 max-w-[320px]">
                  {[
                    "folder", "star", "heart", "book", 
                    "graduation-cap", "lightbulb", "book-open", "brain", 
                    "flame", "tag", "compass", "sparkles", 
                    "award", "music", "smile", "coffee"
                  ].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFolderIconName(icon)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        folderIconName === icon 
                          ? "bg-red-50 border-[#b7152b] text-[#b7152b]" 
                          : "border-zinc-200 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                      }`}
                      title={icon}
                    >
                      {renderFolderIcon(icon, 16, folderIconName === icon)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(folderToEdit.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border border-transparent hover:border-red-100"
                >
                  <Trash2 size={13} />
                  Xóa thư mục
                </button>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditFolderOpen(false)}
                    className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <Button type="submit" className="w-auto h-9 text-xs px-4">
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORD MODAL (WITH SYSTEM SEARCH OR CUSTOM CREATE TABS) */}
      {isAddWordOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 border border-zinc-100 max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-950 font-sans">Thêm từ vựng vào thư mục</h3>
                <p className="text-zinc-400 text-[11px] font-semibold mt-0.5">Thêm từ hệ thống hoặc tự soạn từ mới</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddWordOpen(false);
                  setDictSearchResults([]);
                  setDictSearchQuery("");
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200">
              <button
                onClick={() => setAddWordTab("system")}
                className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
                  addWordTab === "system"
                    ? "border-[#b7152b] text-[#b7152b]"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Tra cứu hệ thống
              </button>
              <button
                onClick={() => setAddWordTab("custom")}
                className={`flex-1 pb-3 text-sm font-extrabold transition-all border-b-2 ${
                  addWordTab === "custom"
                    ? "border-[#b7152b] text-[#b7152b]"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Tự soạn từ mới
              </button>
            </div>

            {/* TAB CONTENT: Platform System Search */}
            {addWordTab === "system" && (
              <div className="space-y-4">
                <form onSubmit={handleDictSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input
                      type="text"
                      required
                      placeholder="Tìm chữ Hán, Hiragana, hoặc Nghĩa..."
                      value={dictSearchQuery}
                      onChange={(e) => setDictSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] font-semibold"
                    />
                  </div>
                  <Button type="submit" disabled={dictSearchLoading} className="w-auto h-9 text-xs px-4">
                    {dictSearchLoading ? <Loader2 size={14} className="animate-spin" /> : "Tìm kiếm"}
                  </Button>
                </form>

                {/* Results list */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {dictSearchResults.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 text-xs font-semibold">
                      Chưa có kết quả tìm kiếm. Nhập từ khóa để tra cứu.
                    </div>
                  ) : (
                    dictSearchResults.map((word) => (
                      <div 
                        key={word.id} 
                        className="p-3 bg-zinc-50 border border-zinc-150 rounded-2xl flex items-center justify-between hover:bg-zinc-100/50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-zinc-800 font-sans">{word.term_jp}</span>
                            {word.jlpt_level && (
                              <span className="px-1 py-0.2 text-[8px] font-extrabold bg-blue-50 text-blue-600 rounded border border-blue-100/50 uppercase">
                                {word.jlpt_level}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 font-semibold block mt-0.5">
                            {word.reading_hiragana} • {getRomaji(word.term_jp, word.reading_hiragana)}
                          </span>
                          <span className="text-xs text-zinc-600 font-semibold block mt-1 line-clamp-1">
                            {word.meaning_vi || word.meaning_en}
                          </span>
                        </div>

                        {(() => {
                          const isAlreadyAdded = !!(
                            folderContents?.system_vocabularies.some(
                              (v) => v.id === word.related_vocabulary_id
                            )
                          );
                          const isProcessing = actionProcessing[word.related_vocabulary_id];

                          return (
                            <button
                              onClick={() => {
                                if (isAlreadyAdded) {
                                  handleRemoveWord(word.related_vocabulary_id, false);
                                } else {
                                  handleAddSystemWord(word.related_vocabulary_id);
                                }
                              }}
                              disabled={isProcessing || !word.related_vocabulary_id}
                              className={`p-2 rounded-xl bg-white border transition-colors ${
                                isAlreadyAdded 
                                  ? "border-red-200 text-red-500 hover:bg-red-50" 
                                  : "border-zinc-200 text-[#b7152b] hover:bg-red-50"
                              } disabled:opacity-50 disabled:hover:bg-white`}
                              title={isAlreadyAdded ? "Xóa khỏi thư mục" : "Lưu vào thư mục"}
                            >
                              {isProcessing ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : isAlreadyAdded ? (
                                <Minus size={13} />
                              ) : (
                                <Plus size={13} />
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Create Custom User Vocab */}
            {addWordTab === "custom" && (
              <form onSubmit={handleAddCustomWord} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Từ vựng (Kanji/Kana) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: 頑張る"
                      value={customWordKanji}
                      onChange={(e) => setCustomWordKanji(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b7152b] focus:border-[#b7152b] font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Cách đọc (Hiragana)</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: がんばる"
                      value={customWordHiragana}
                      onChange={(e) => setCustomWordHiragana(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b7152b] focus:border-[#b7152b] font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Romaji</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: ganbaru"
                      value={customWordRomaji}
                      onChange={(e) => setCustomWordRomaji(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b7152b] focus:border-[#b7152b] font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Ý nghĩa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: cố gắng"
                      value={customWordMeaning}
                      onChange={(e) => setCustomWordMeaning(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b7152b] focus:border-[#b7152b] font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Ghi chú cá nhân</label>
                  <textarea
                    rows={3}
                    placeholder="Lưu lại ngữ cảnh học, ví dụ câu, hoặc mẹo ghi nhớ..."
                    value={customWordNote}
                    onChange={(e) => setCustomWordNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#b7152b] focus:border-[#b7152b] font-semibold resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWordOpen(false)}
                    className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <Button type="submit" className="w-auto h-9 text-xs px-4">
                    Lưu từ vựng
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {isEditNoteOpen && wordToEditNote && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6 border border-zinc-100 animate-scale-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-zinc-950 font-sans">Chỉnh sửa ghi chú</h3>
                <p className="text-zinc-400 text-[11px] font-semibold mt-0.5">Từ vựng: {wordToEditNote.kanji}</p>
              </div>
              <button 
                onClick={() => setIsEditNoteOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Nội dung ghi chú</label>
                <textarea
                  rows={4}
                  placeholder="Điền ghi chú mới cho từ vựng..."
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b7152b]/15 focus:border-[#b7152b] font-semibold resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditNoteOpen(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Hủy
                </button>
                <Button type="submit" className="w-auto h-9 text-xs px-4">
                  Cập nhật
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CUSTOM CONFIRM MODAL */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-6 border border-zinc-100 animate-scale-up">
            <div className="flex items-center gap-3 text-[#b7152b]">
              <AlertCircle size={22} />
              <h3 className="text-base font-extrabold text-zinc-950 font-sans">{confirmTitle}</h3>
            </div>
            
            <p className="text-zinc-600 text-xs font-semibold leading-relaxed">
              {confirmMessage}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 border border-zinc-200 text-zinc-700 text-[11px] font-bold rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-[#b7152b] hover:bg-[#9a1022] text-white text-[11px] font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
