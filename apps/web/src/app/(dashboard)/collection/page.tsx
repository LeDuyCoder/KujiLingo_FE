/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";
import { 
  Package, User, Flame, Shield, Compass,
  ArrowRight, Loader2, CheckCircle2, AlertCircle, Star, Gem
} from "lucide-react";

  interface ShopItem {
    id: string;
    name: string | null;
    description: string | null;
    image: string | null;
    preview_image: string | null;
    item_type: "AVATAR" | "BACKGROUND" | "FRAME" | null;
    rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | null;
    price: number | null;
    currency: "COIN" | "GEM" | null;
    is_limited?: boolean | null;
  }
  
  interface InventoryItem {
    shop_item_id: string;
    name: string | null;
    item_type: "AVATAR" | "BACKGROUND" | "FRAME" | null;
    image: string | null;
    purchased_at: string | null;
    is_equipped: boolean;
  }
  
  interface EquippedItem {
    item_type: "AVATAR" | "BACKGROUND" | "FRAME";
    shop_item_id: string | null;
    name: string | null;
    image: string | null;
  }
  
  export default function MyCollectionPage() {
    const { user } = useAuthStore();
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [equipped, setEquipped] = useState<EquippedItem[]>([]);
    const [wallet, setWallet] = useState<{ coins: number; gems: number } | null>(null);
    
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"ALL" | "AVATAR" | "BACKGROUND" | "FRAME">("ALL");
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [equippingId, setEquippingId] = useState<string | null>(null);
    const [unequippingId, setUnequippingId] = useState<string | null>(null);
    
    // Notification states
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState<"success" | "info" | "error">("success");
  
    const showToast = (msg: string, type: "success" | "info" | "error" = "success") => {
      setToastMessage(msg);
      setToastType(type);
      setTimeout(() => setToastMessage(""), 2500);
    };
  
    const fetchCollectionData = async () => {
      try {
        const [shopRes, invRes, equippedRes, walletRes] = await Promise.all([
          axiosClient.get("/api/v1/shop/items", { params: { limit: 50 } }).catch(() => null),
          axiosClient.get("/api/v1/shop/inventory").catch(() => null),
          axiosClient.get("/api/v1/shop/equipped").catch(() => null),
          axiosClient.get("/api/v1/shop/wallet").catch(() => null)
        ]);
  
        if (shopRes?.data?.success) {
          setShopItems(shopRes.data.data);
        }
        if (invRes?.data?.success) {
          setInventory(invRes.data.data);
          // Default select the first item if nothing is selected yet
          if (invRes.data.data.length > 0 && !selectedItemId) {
            setSelectedItemId(invRes.data.data[0].shop_item_id);
          }
        }
        if (equippedRes?.data?.success) {
          setEquipped(equippedRes.data.data);
        }
        if (walletRes?.data?.success) {
          setWallet(walletRes.data.data);
        }
      } catch {
        showToast("Có lỗi xảy ra khi tải tủ đồ.", "error");
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      document.title = "Tủ đồ của tôi | KujiLingo";
      setTimeout(() => fetchCollectionData(), 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const handleEquip = async (itemId: string) => {
    setEquippingId(itemId);
    try {
      const response = await axiosClient.post("/api/v1/shop/equip", {
        shop_item_id: itemId
      });

      if (response.data?.success) {
        showToast("Trang bị vật phẩm thành công!", "success");
        // Refetch inventory, equipped items and wallet
        await fetchCollectionData();
      }
    } catch (err) {
      console.error("Equip item error:", err);
      showToast("Không thể trang bị vật phẩm này.", "error");
    } finally {
      setEquippingId(null);
    }
  };

  const handleUnequip = async (itemType: "AVATAR" | "BACKGROUND" | "FRAME" | null) => {
    if (!itemType) return;
    setUnequippingId(itemType);
    try {
      const response = await axiosClient.post("/api/v1/shop/unequip", {
        item_type: itemType
      });

      if (response.data?.success) {
        showToast("Tháo trang bị vật phẩm thành công!", "success");
        await fetchCollectionData();
      }
    } catch (err) {
      console.error("Unequip item error:", err);
      showToast("Không thể tháo trang bị vật phẩm này.", "error");
    } finally {
      setUnequippingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-500 font-semibold">Đang tải tủ đồ...</span>
      </div>
    );
  }

  // Derived counts
  const totalShopAvatars = shopItems.filter(i => i.item_type === "AVATAR").length || 40;
  const totalShopBackgrounds = shopItems.filter(i => i.item_type === "BACKGROUND").length || 18;
  const totalShopFrames = shopItems.filter(i => i.item_type === "FRAME").length || 20;

  const ownedAvatars = inventory.filter(i => i.item_type === "AVATAR");
  const ownedBackgrounds = inventory.filter(i => i.item_type === "BACKGROUND");
  const ownedFrames = inventory.filter(i => i.item_type === "FRAME");

  const totalOwned = inventory.length;
  const totalShopAvailable = shopItems.length || (totalShopAvatars + totalShopBackgrounds + totalShopFrames);
  const completionPercentage = totalShopAvailable > 0 ? Math.round((totalOwned / totalShopAvailable) * 100) : 0;

  // Active equipped assets
  const equippedAvatar = equipped.find(e => e.item_type === "AVATAR");
  const equippedBackground = equipped.find(e => e.item_type === "BACKGROUND");
  const equippedFrame = equipped.find(e => e.item_type === "FRAME");

  // Filtering list based on tab
  const filteredInventory = inventory.filter(item => {
    if (activeTab === "ALL") return true;
    return item.item_type === activeTab;
  });

  // Selected item details for sidebar/banner
  const selectedItem = inventory.find(i => i.shop_item_id === selectedItemId);
  // Match with shop item to get price/rarity/description details
  const selectedShopInfo = shopItems.find(i => i.id === selectedItemId);

  const getRarityColor = (rarity: string | null) => {
    switch (rarity) {
      case "LEGENDARY": return "text-amber-600 bg-amber-50 border-amber-200";
      case "EPIC": return "text-purple-600 bg-purple-50 border-purple-200";
      case "RARE": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-zinc-600 bg-zinc-50 border-zinc-200";
    }
  };

  const getRarityTag = (rarity: string | null) => {
    switch (rarity) {
      case "LEGENDARY": return "Legendary";
      case "EPIC": return "Epic";
      case "RARE": return "Rare";
      default: return "Common";
    }
  };

  const formatBalance = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in-up pb-16 text-left relative">
      
      {/* Toast message overlay */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-zinc-950 text-white rounded-2xl px-5 py-3.5 shadow-2xl z-[9999] flex items-center gap-3 animate-scale-up border border-zinc-800">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            toastType === "success" ? "bg-emerald-500/20 text-emerald-400" : 
            toastType === "error" ? "bg-rose-500/20 text-rose-400" : "bg-blue-500/20 text-blue-400"
          }`}>
            {toastType === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <div>
            <span className="font-extrabold text-xs block">Thông báo</span>
            <span className="text-[10px] text-zinc-400">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
        <Link href="/home" className="hover:text-zinc-650">Home</Link>
        <span>&gt;</span>
        <Link href="/profile" className="hover:text-zinc-650">Profile</Link>
        <span>&gt;</span>
        <span className="text-zinc-800 font-bold">My Collection</span>
      </div>

      {/* Title block with completion percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-zinc-950 tracking-tight">My Collection</h1>
          <p className="text-sm font-semibold text-zinc-500">
            Manage all cosmetic items you have unlocked.
          </p>
        </div>

        {/* Completion Circular percentage */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200/60 rounded-3xl p-3.5 px-5 shadow-sm">
          <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
              <path
                className="text-zinc-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-red-650"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-[10px] font-black text-zinc-950">{completionPercentage}%</div>
          </div>
          <div>
            <span className="text-[10px] font-black text-zinc-400 block uppercase tracking-wider">Collection</span>
            <span className="text-xs font-black text-zinc-800">Completion</span>
          </div>
        </div>
      </div>

      {/* Grid of quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        
        {/* Stat 1: Total Items */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-650 shadow-inner">
            <Package size={15} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Total Items</span>
          <span className="text-lg font-black text-zinc-950 block">{totalOwned}</span>
        </div>

        {/* Stat 2: Avatars */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
            <User size={15} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Avatars</span>
          <span className="text-lg font-black text-zinc-950 block">{ownedAvatars.length}</span>
        </div>

        {/* Stat 3: Backgrounds */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
            <Compass size={15} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Backgrounds</span>
          <span className="text-lg font-black text-zinc-950 block">{ownedBackgrounds.length}</span>
        </div>

        {/* Stat 4: Frames */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
            <Shield size={15} />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Frames</span>
          <span className="text-lg font-black text-zinc-950 block">{ownedFrames.length}</span>
        </div>

        {/* Stat 5: Coins */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-amber-50 border border-amber-150 flex items-center justify-center text-amber-500 font-extrabold text-[13px] shadow-inner">
            🪙
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Coins</span>
          <span className="text-lg font-black text-zinc-950 block">{wallet ? formatBalance(wallet.coins) : "0"}</span>
        </div>

        {/* Stat 6: Gems */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-4 text-center space-y-1 shadow-sm">
          <div className="mx-auto w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-[#b7152b] font-extrabold text-[13px] shadow-inner animate-pulse">
            <Gem size={14} className="fill-[#b7152b] text-[#b7152b]" />
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Gems</span>
          <span className="text-lg font-black text-zinc-950 block">{wallet ? formatBalance(wallet.gems) : "0"}</span>
        </div>

      </div>

      {/* Main Grid Banner and Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Discord Profile Popout Card (Light Theme) */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block self-start pl-1 mb-2.5">
            Profile Preview
          </span>

          <div className="w-full bg-white text-zinc-800 rounded-3xl border border-zinc-200/70 shadow-xl relative overflow-hidden flex flex-col">
            
            {/* Custom Backdrop Image representing equipped background */}
            {equippedBackground?.image ? (
              <div className="h-32 bg-cover bg-center relative" style={{ backgroundImage: `url(${equippedBackground.image})` }} />
            ) : (
              <div className="h-32 bg-[#5865f2] relative" />
            )}
            
            {/* Equipped Avatar & Frame Container overlapping the banner */}
            <div className="absolute top-[80px] left-5 w-[92px] h-[92px] rounded-full bg-white p-[6px] overflow-hidden flex items-center justify-center z-10 shadow-md">
              {/* Frame overlay */}
              {equippedFrame?.image && (
                <img 
                  src={equippedFrame.image} 
                  alt="Equipped Frame" 
                  className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none scale-105"
                />
              )}
              {/* Avatar image */}
              {equippedAvatar?.image ? (
                <img 
                  src={equippedAvatar.image} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover z-10 relative"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-400 z-10 relative">
                  <User size={36} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Profile Info Details */}
            <div className="pt-14 pb-5 px-5 space-y-4 relative flex flex-col text-left">
              
              {/* Display name & username */}
              <div className="space-y-0.5">
                <h3 className="text-lg font-black text-zinc-950 leading-tight">
                  {user?.display_name || "Lê Hữu Duy"}
                </h3>
                <span className="text-[10px] font-bold text-zinc-500 block tracking-wide">
                  @{user?.email?.split('@')[0] || "duyle"}
                </span>
              </div>

              {/* Badges Container */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 bg-zinc-50 rounded-md text-[8.5px] font-extrabold text-[#5865f2] border border-zinc-200/60 flex items-center gap-1 uppercase tracking-wider shadow-sm">
                  <Star size={9} className="fill-[#5865f2] text-[#5865f2]" />
                  PRO
                </span>
                <span className="px-2 py-0.5 bg-zinc-50 rounded-md text-[8.5px] font-extrabold text-amber-600 border border-zinc-200/60 flex items-center gap-1 uppercase tracking-wider shadow-sm">
                  <Flame size={9} className="fill-amber-500 text-amber-500" />
                  {user?.display_name ? "45 DAYS" : "0 DAYS"}
                </span>
                <span className="px-2 py-0.5 bg-zinc-50 rounded-md text-[8.5px] font-extrabold text-indigo-600 border border-zinc-200/60 flex items-center gap-1 uppercase tracking-wider shadow-sm">
                  LVL 1
                </span>
              </div>

              <div className="border-t border-zinc-150 pt-3 space-y-3.5">
                
                {/* ABOUT ME */}
                <div className="space-y-1 text-xs">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">ABOUT ME</span>
                  <p className="text-zinc-700 font-bold leading-relaxed">
                    Học tiếng Nhật hàng ngày cùng KujiLingo! 🎯
                  </p>
                </div>

                {/* STATISTICS */}
                <div className="space-y-1.5 text-xs text-zinc-700">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">KUJILINGO STATUS</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10.5px] font-bold">
                    <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200/60 space-y-0.5">
                      <span className="text-[8px] text-zinc-450 uppercase block tracking-wider font-extrabold">JLPT Target</span>
                      <span className="text-zinc-950 font-black">{user?.jlpt_target_level || "N5"}</span>
                    </div>
                    <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200/60 space-y-0.5">
                      <span className="text-[8px] text-zinc-450 uppercase block tracking-wider font-extrabold">Daily Goal</span>
                      <span className="text-zinc-950 font-black">{user?.learning_goal_minutes || 15} mins</span>
                    </div>
                  </div>

                </div>

                {/* Item preview details inside Discord Card */}
                {selectedItem && (
                  <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black text-zinc-400">
                      <span>SELECTED ITEM</span>
                      <span className={`px-1.5 py-0.2 rounded border uppercase text-[7px] ${
                        getRarityColor(selectedShopInfo?.rarity || "COMMON")
                      }`}>
                        {getRarityTag(selectedShopInfo?.rarity || "COMMON")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {selectedItem.image ? (
                        <img src={selectedItem.image} alt="" className="w-10 h-10 object-cover rounded-lg border border-zinc-200/60" />
                      ) : (
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                          <Package size={16} />
                        </div>
                      )}
                      <div className="text-left">
                        <h5 className="text-[11.5px] font-black text-zinc-950 leading-tight">{selectedItem.name}</h5>
                        <span className="text-[9px] text-zinc-500 font-bold block">{selectedItem.item_type}</span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>

        {/* Right Column: Collection Analytics & Progress Grid */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block pl-1 mb-2.5">
            Collection Analytics
          </span>

          <div className="bg-white border border-zinc-200/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between flex-grow">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Progress Bars Column */}
              <div className="space-y-5">
                <h3 className="text-sm font-black text-zinc-950 uppercase tracking-widest border-b border-zinc-100 pb-2 text-left">
                  Collection Progress
                </h3>

                {/* Avatar progress */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <span className="flex items-center gap-1.5 font-bold">
                      <User size={13} className="text-zinc-500" />
                      Avatar
                    </span>
                    <span className="text-zinc-955 font-black">
                      {ownedAvatars.length} / {totalShopAvatars}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-650 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((ownedAvatars.length / totalShopAvatars) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Background progress */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Compass size={13} className="text-zinc-550" />
                      Background
                    </span>
                    <span className="text-zinc-955 font-black">
                      {ownedBackgrounds.length} / {totalShopBackgrounds}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-650 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((ownedBackgrounds.length / totalShopBackgrounds) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Frame progress */}
                <div className="space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Shield size={13} className="text-zinc-550" />
                      Frame
                    </span>
                    <span className="text-zinc-955 font-black">
                      {ownedFrames.length} / {totalShopFrames}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-650 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.round((ownedFrames.length / totalShopFrames) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Collector Milestones & Loadout Column */}
              <div className="space-y-5">
                <h3 className="text-sm font-black text-zinc-955 uppercase tracking-widest border-b border-zinc-100 pb-2 text-left">
                  Collector Milestones
                </h3>

                {/* Collector Rank Info */}
                <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-4 text-left space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Collector Level</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      totalOwned >= 10 ? "text-amber-700 bg-amber-50 border border-amber-200 animate-pulse" :
                      totalOwned >= 5 ? "text-indigo-700 bg-indigo-50 border border-indigo-200" :
                      totalOwned >= 2 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" :
                      "text-[#b7152b] bg-red-50 border border-red-100"
                    }`}>
                      {totalOwned >= 10 ? "Huyền thoại" :
                       totalOwned >= 5 ? "Chuyên gia" :
                       totalOwned >= 2 ? "Thợ săn Đồ" : "Tập sự"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-550 font-semibold leading-relaxed">
                    {totalOwned >= 10 ? "Sở hữu bộ sưu tập đồ sộ vạn người mê! ⭐" :
                     totalOwned >= 5 ? "Bộ sưu tập đã khá phong phú và đa dạng. 💎" :
                     totalOwned >= 2 ? "Đã sở hữu một vài vật phẩm chất lượng. 💫" :
                     "Bắt đầu con đường sưu tầm vật phẩm độc quyền. 🚀"}
                  </p>
                </div>

                {/* Quick stats details grid */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Coin Value</span>
                    <span className="text-sm font-black text-zinc-900 flex items-center gap-0.5">
                      🪙 {inventory.reduce((sum, item) => sum + (shopItems.find(i => i.id === item.shop_item_id && i.currency === "COIN")?.price || 0), 0)}
                    </span>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Gem Value</span>
                    <span className="text-sm font-black text-zinc-900 flex items-center gap-0.5">
                      💎 {inventory.reduce((sum, item) => sum + (shopItems.find(i => i.id === item.shop_item_id && i.currency === "GEM")?.price || 0), 0)}
                    </span>
                  </div>
                </div>

                {/* Loadout details */}
                <div className="bg-zinc-50 border border-zinc-200/50 rounded-2xl p-4 text-left space-y-2 text-xs font-bold text-zinc-650 shadow-sm">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Equipped Loadout</span>
                  <div className="flex items-center justify-between">
                    <span>Avatar:</span>
                    <span className="text-zinc-800 font-extrabold truncate max-w-[155px]">{equipped.find(e => e.item_type === "AVATAR")?.name || "Mặc định"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frame:</span>
                    <span className="text-indigo-650 font-extrabold truncate max-w-[155px]">{equipped.find(e => e.item_type === "FRAME")?.name || "Mặc định"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Background:</span>
                    <span className="text-emerald-700 font-extrabold truncate max-w-[155px]">{equipped.find(e => e.item_type === "BACKGROUND")?.name || "Mặc định"}</span>
                  </div>
                </div>

              </div>

            </div>

            <Link href="/shop" className="group pt-5 border-t border-zinc-150 flex items-center justify-between text-xs font-black text-[#b7152b] hover:text-red-750 transition-colors mt-6">
              <span>Ghé cửa hàng để mở khóa thêm vật phẩm</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-zinc-200/80 overflow-x-auto pb-px shrink-0">
        {[
          { id: "ALL", label: `All Items (${totalOwned})` },
          { id: "AVATAR", label: `Avatar (${ownedAvatars.length})` },
          { id: "BACKGROUND", label: `Background (${ownedBackgrounds.length})` },
          { id: "FRAME", label: `Frame (${ownedFrames.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "ALL" | "AVATAR" | "BACKGROUND" | "FRAME")}
            className={`h-11 px-5 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
              activeTab === tab.id 
                ? "border-[#b7152b] text-[#b7152b]" 
                : "border-transparent text-zinc-450 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Secondary Grid Section: List + Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Grid: Owned items list */}
        <div className="lg:col-span-8">
          {filteredInventory.length === 0 ? (
            <div className="bg-white border border-zinc-200/60 rounded-3xl p-12 text-center text-zinc-400 space-y-3.5 shadow-sm">
              <Package size={38} strokeWidth={1.2} className="mx-auto text-zinc-300" />
              <p className="text-xs font-bold">Chưa sở hữu vật phẩm nào trong phân mục này.</p>
              <Link href="/shop">
                <button className="h-9 px-5 bg-[#b7152b] hover:bg-red-700 text-white font-bold text-xs rounded-full transition-all cursor-pointer mt-2 shadow-sm">
                  Ghé cửa hàng
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {filteredInventory.map((item) => {
                const shopInfo = shopItems.find(i => i.id === item.shop_item_id);
                const isSelected = item.shop_item_id === selectedItemId;
                
                return (
                  <div
                    key={item.shop_item_id}
                    onClick={() => setSelectedItemId(item.shop_item_id)}
                    className={`bg-white border-2 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col text-left group ${
                      isSelected ? "border-[#b7152b] ring-2 ring-[#b7152b]/10" : "border-zinc-200/65"
                    }`}
                  >
                    
                    {/* Item Image slot */}
                    <div className="aspect-video w-full bg-zinc-50 border-b border-zinc-150 relative overflow-hidden flex items-center justify-center p-3">
                      
                      {/* Image render */}
                      {item.image ? (
                        item.item_type === "AVATAR" ? (
                          <div className="w-16 h-16 rounded-full bg-white border border-zinc-200/80 p-0.5 shadow-sm overflow-hidden flex items-center justify-center">
                            <img 
                              src={item.image} 
                              alt={item.name || ""} 
                              className="w-full h-full rounded-full object-cover group-hover:scale-105 transition-all duration-300"
                            />
                          </div>
                        ) : item.item_type === "FRAME" ? (
                          <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                            {/* Inner placeholder avatar */}
                            <div className="w-[80%] h-[80%] rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                              <User size={20} />
                            </div>
                            {/* Frame overlay */}
                            <img 
                              src={item.image} 
                              alt={item.name || ""} 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                            />
                          </div>
                        ) : (
                          <img 
                            src={item.image} 
                            alt={item.name || ""} 
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-350">
                          {item.item_type === "AVATAR" ? <User size={22} /> : 
                           item.item_type === "BACKGROUND" ? <Compass size={22} /> : <Shield size={22} />}
                        </div>
                      )}

                      {/* Equipped badge status overlay */}
                      {item.is_equipped && (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-zinc-950 text-white text-[8px] font-black rounded-md tracking-wider border border-zinc-800">
                          EQUIPPED
                        </div>
                      )}

                    </div>

                    {/* Meta info bottom */}
                    <div className="p-4 space-y-1.5 mt-auto">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider rounded border ${
                          getRarityColor(shopInfo?.rarity || "COMMON")
                        }`}>
                          {getRarityTag(shopInfo?.rarity || "COMMON")}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-zinc-950 line-clamp-1">{item.name}</h4>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                        {item.item_type}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Grid: Selected Item Details Sidebar */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/60 rounded-3xl overflow-hidden shadow-md lg:sticky lg:top-24 text-left">
          {selectedItem ? (
            <div className="flex flex-col">
              
              {/* Detail Image Preview Banner */}
              <div className="aspect-video w-full bg-gradient-to-tr from-zinc-50 to-zinc-100/50 border-b border-zinc-100 relative flex items-center justify-center overflow-hidden p-6">
                {selectedItem.image ? (
                  selectedItem.item_type === "AVATAR" ? (
                    <div className="w-24 h-24 rounded-full bg-white border border-zinc-200/80 p-1 shadow-md overflow-hidden flex items-center justify-center relative z-10">
                      <img 
                        src={selectedItem.image} 
                        alt={selectedItem.name || ""} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ) : selectedItem.item_type === "FRAME" ? (
                    <div className="w-24 h-24 relative flex items-center justify-center shrink-0 z-10">
                      {/* Inner placeholder avatar */}
                      <div className="w-[80%] h-[80%] rounded-full bg-zinc-100 flex items-center justify-center text-zinc-300">
                        <User size={32} />
                      </div>
                      {/* Frame overlay */}
                      <img 
                        src={selectedItem.image} 
                        alt={selectedItem.name || ""} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name || ""} 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-350">
                    <Package size={28} strokeWidth={1.5} />
                  </div>
                )}
                
                {/* Heart decoration icon */}
                <button className="absolute top-3.5 right-3.5 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-rose-500 hover:scale-105 shadow-sm transition-all cursor-pointer">
                  <Star size={13} className="fill-current" />
                </button>
              </div>

              {/* Detail Content Metadata */}
              <div className="p-5 space-y-4">
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${
                      getRarityColor(selectedShopInfo?.rarity || "COMMON")
                    }`}>
                      {getRarityTag(selectedShopInfo?.rarity || "COMMON")}
                    </span>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {selectedItem.item_type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-black text-zinc-950 tracking-tight leading-snug">
                    {selectedItem.name}
                  </h3>
                  
                  <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                    {selectedShopInfo?.description || "Một vật phẩm trang trí tinh tế giúp tùy chỉnh giao diện và làm phong phú hồ sơ học tập của bạn trên KujiLingo."}
                  </p>
                </div>

                {/* Technical specifications */}
                <div className="pt-3 border-t border-zinc-100 space-y-2.5 text-xs text-zinc-650 font-bold">
                  
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Acquired:</span>
                    <span className="text-zinc-950 font-black">
                      {selectedItem.purchased_at ? new Date(selectedItem.purchased_at).toLocaleDateString("vi-VN", {
                        year: "numeric", month: "short", day: "numeric"
                      }) : "Oct 12, 2023"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Set:</span>
                    <span className="text-indigo-600 hover:underline cursor-pointer font-black">
                      {selectedShopInfo?.is_limited ? "Lễ Hội Hoa Anh Đào" : "Cyberpunk Origins"}
                    </span>
                  </div>

                </div>

                {/* Active Action Button */}
                <div className="pt-4 border-t border-zinc-100 space-y-2.5">
                  
                  {selectedItem.is_equipped ? (
                    <button 
                      disabled
                      className="w-full h-10 bg-zinc-100 border border-zinc-200 text-zinc-450 font-extrabold text-xs rounded-full flex items-center justify-center gap-1.5 shadow-inner cursor-not-allowed"
                    >
                      <CheckCircle2 size={13} />
                      <span>Currently Equipped</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEquip(selectedItem.shop_item_id)}
                      disabled={equippingId === selectedItem.shop_item_id}
                      className="w-full h-10 bg-[#b7152b] hover:bg-red-700 disabled:bg-zinc-350 text-white font-extrabold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      {equippingId === selectedItem.shop_item_id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang trang bị...</span>
                        </>
                      ) : (
                        <span>Equip Item</span>
                      )}
                    </button>
                  )}

                  {selectedItem.is_equipped && (
                    <button 
                      onClick={() => handleUnequip(selectedItem.item_type)}
                      disabled={unequippingId === selectedItem.item_type}
                      className="w-full h-10 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-extrabold text-xs rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
                    >
                      {unequippingId === selectedItem.item_type ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tháo...</span>
                        </>
                      ) : (
                        <span>Unequip</span>
                      )}
                    </button>
                  )}

                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 space-y-3">
              <Package size={32} strokeWidth={1.2} className="mx-auto text-zinc-300" />
              <p className="text-xs font-bold">Vui lòng chọn một vật phẩm để xem chi tiết.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
