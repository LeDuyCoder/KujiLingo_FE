/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Loader2, 
  Coins, 
  Gem, 
  ShoppingBag,
  Check,
  CheckCircle,
  Eye,
  X,
  Flame,
  AlertCircle
} from "lucide-react";
import { axiosClient } from "@/shared/api/axiosClient";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { Button } from "@/shared/components/ui/Button";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  image: string;
  preview_image: string | null;
  item_type: "AVATAR" | "BACKGROUND" | "FRAME";
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
  price: number;
  currency: "COIN" | "GEM";
  is_limited: boolean;
  stock: number | null;
  is_owned: boolean;
}

interface Wallet {
  coins: number;
  gems: number;
}


interface EquippedItemDetails {
  item_type: "AVATAR" | "BACKGROUND" | "FRAME";
  shop_item_id: string;
  name: string;
  image: string;
}

interface UserStats {
  level: number;
  streak: number;
}

interface ShopBanner {
  id: string;
  title: string;
  description: string;
  image: string;
  shop_item_id: string | null;
}

export default function ShopPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"AVATAR" | "BACKGROUND" | "FRAME">("AVATAR");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [items, setItems] = useState<ShopItem[]>([]);
  const [wallet, setWallet] = useState<Wallet>({ coins: 0, gems: 0 });
  const [equippedItems, setEquippedItems] = useState<Record<string, string>>({}); // slot -> itemId
  const [equippedDetails, setEquippedDetails] = useState<Record<string, EquippedItemDetails>>({}); // slot -> item details
  const [userStats, setUserStats] = useState<UserStats>({ level: 1, streak: 0 });
  const [banners, setBanners] = useState<ShopBanner[]>([]);
  
  const [previewItem, setPreviewItem] = useState<ShopItem | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [equipLoading, setEquipLoading] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<ShopItem | null>(null);

  interface Toast {
    message: string;
    type: "success" | "error" | "info";
  }
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Auto-play banner slider every 5 seconds, resetting timer on manual dot click
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, activeBannerIndex]);

  const fetchShopData = useCallback(async () => {
    if (!user) return;
    try {
      const [itemsRes, walletRes, equippedRes, statsRes, bannersRes] = await Promise.all([
        axiosClient.get("/api/v1/shop/items"),
        axiosClient.get("/api/v1/shop/wallet"),
        axiosClient.get("/api/v1/shop/equipped"),
        axiosClient.get("/api/v1/statistics/me"),
        axiosClient.get("/api/v1/shop/banners")
      ]);

      if (itemsRes.data?.success) {
        setItems(itemsRes.data.data);
      }
      if (walletRes.data?.success) {
        setWallet(walletRes.data.data);
      }
      if (equippedRes.data?.success && Array.isArray(equippedRes.data.data)) {
        const equippedMap: Record<string, string> = {};
        const detailsMap: Record<string, EquippedItemDetails> = {};
        equippedRes.data.data.forEach((eq: EquippedItemDetails) => {
          equippedMap[eq.item_type] = eq.shop_item_id;
          detailsMap[eq.item_type] = eq;
        });
        setEquippedItems(equippedMap);
        setEquippedDetails(detailsMap);
      }
      if (statsRes.data?.success) {
        setUserStats({
          level: statsRes.data.data.level || 1,
          streak: statsRes.data.data.streak || 0
        });
      }
      if (bannersRes.data?.success && Array.isArray(bannersRes.data.data)) {
        setBanners(bannersRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching shop data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (mounted && user) {
      const handle = setTimeout(() => {
        fetchShopData();
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [mounted, user, fetchShopData]);

  const handlePurchase = async (itemId: string, price: number, currency: "COIN" | "GEM") => {
    const balance = currency === "COIN" ? wallet.coins : wallet.gems;
    if (balance < price) {
      showToast(`Bạn không đủ ${currency === "COIN" ? "Coins" : "KujiGems"} để mua vật phẩm này!`, "error");
      return;
    }

    setPurchaseLoading(itemId);
    try {
      const response = await axiosClient.post("/api/v1/shop/purchase", {
        shop_item_id: itemId
      });

      if (response.data?.success) {
        // Refresh shop data & wallet balance immediately
        await fetchShopData();
        showToast("Mua vật phẩm thành công! Bạn có thể trang bị ngay.", "success");
      }
    } catch (err: unknown) {
      console.error("Error purchasing item:", err);
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = axiosError.response?.data?.error?.message || "Đã xảy ra lỗi khi mua vật phẩm.";
      showToast(errMsg, "error");
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleEquip = async (itemId: string) => {
    setEquipLoading(itemId);
    try {
      const response = await axiosClient.post("/api/v1/shop/equip", {
        shop_item_id: itemId
      });

      if (response.data?.success) {
        await fetchShopData();
        showToast("Đã trang bị vật phẩm thành công!", "success");
      }
    } catch (err: unknown) {
      console.error("Error equipping item:", err);
      showToast("Đã xảy ra lỗi khi trang bị vật phẩm.", "error");
    } finally {
      setEquipLoading(null);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#b7152b]" />
        <span className="text-sm text-zinc-400 font-semibold">Đang tải cửa hàng KujiLingo...</span>
      </div>
    );
  }

  // Filter items by active tab and search query
  const filteredItems = items.filter(
    (item) => item.item_type === activeTab && item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY":
        return "bg-rose-50 text-rose-600 border border-rose-100";
      case "EPIC":
        return "bg-purple-50 text-purple-600 border border-purple-100";
      case "RARE":
        return "bg-blue-50 text-blue-600 border border-blue-100";
      default:
        return "bg-zinc-50 text-zinc-500 border border-zinc-100";
    }
  };

  // Safe translation helper
  const translateRarity = (rarity: string) => {
    switch (rarity) {
      case "LEGENDARY": return "Legendary";
      case "EPIC": return "Epic";
      case "RARE": return "Rare";
      default: return "Common";
    }
  };

  // Quick fallback mockup values for display card images if they are CDN urls or broken
  const getItemPlaceholderImage = (item: ShopItem) => {
    if (item.image && (item.image.startsWith("http") || item.image.startsWith("/"))) {
      return item.image;
    }
    // Return a neat aesthetic SVG representation if image is mock or empty
    return "/images/placeholder_shop.png"; // fallback path
  };

  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
      {/* Shop Header & Wallet Display */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
            <ShoppingBag className="text-[#b7152b]" />
            Cửa hàng KujiLingo
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Đổi tiền xu và KujiGems tích lũy từ việc học để lấy khung viền, ảnh đại diện và vật phẩm trang trí.
          </p>
        </div>

        {/* Real Dynamic Wallet status cards */}
        {/* Real Dynamic Wallet status cards */}
        <div className="flex gap-3">
          <div className="bg-white border border-zinc-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-9 h-9 rounded-full bg-amber-50 border border-amber-200/40 flex items-center justify-center shrink-0 shadow-inner">
              <Coins className="text-amber-500 w-4.5 h-4.5 fill-amber-500" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">Coins</span>
              <span className="text-sm font-black text-zinc-900 leading-none">
                {wallet.coins.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="bg-white border border-zinc-100 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-sm hover:shadow transition-shadow">
            <div className="w-9 h-9 rounded-full bg-red-50 border border-red-200/40 flex items-center justify-center shrink-0 shadow-inner">
              <Gem className="text-[#b7152b] w-4.5 h-4.5 fill-[#b7152b]/25" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider block">KujiGems</span>
              <span className="text-sm font-black text-zinc-900 leading-none">
                {wallet.gems.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Featured Banners (Carousel) */}
      {/* Featured Banners (Carousel) */}
      {banners.length > 0 && (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950 min-h-[320px] md:min-h-[280px]">
            {banners.map((banner, index) => {
              const linkedItem = banner.shop_item_id ? items.find(i => i.id === banner.shop_item_id) : null;
              const isActive = index === activeBannerIndex;
              return (
                <div 
                  key={banner.id}
                  className={`transition-all duration-700 ease-in-out ${
                    isActive 
                      ? 'opacity-100 z-10 scale-100 visible relative' 
                      : 'opacity-0 z-0 scale-95 invisible absolute inset-0 pointer-events-none'
                  }`}
                >
                  <div
                    onClick={() => linkedItem && setPreviewItem(linkedItem)}
                    className={`bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-8 min-h-[320px] md:min-h-[280px] ${
                      linkedItem ? "cursor-pointer group" : ""
                    }`}
                  >
                    {/* Glow Effects */}
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#b7152b]/5 rounded-full blur-3xl pointer-events-none z-0" />
                    <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />

                    <div className="space-y-4 max-w-lg z-10 text-left">
                      <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20 uppercase tracking-widest">
                        Sự kiện nổi bật
                      </span>
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                          {banner.title}
                        </h2>
                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
                          {banner.description}
                        </p>
                      </div>

                      {linkedItem && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button className="bg-[#b7152b] hover:bg-red-700 text-white rounded-xl font-bold px-6 py-2.5 shadow-lg shadow-red-900/20 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                            Xem thử Live
                            <Eye size={16} />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Banner artwork container */}
                    <div className="relative w-full md:w-80 h-48 md:h-56 z-10 shrink-0 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#b7152b]/10 rounded-full blur-3xl scale-75" />
                      <img 
                        src={banner.image} 
                        alt={banner.title}
                        className="max-h-full max-w-full rounded-2xl border border-white/10 shadow-2xl object-cover drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-float z-10"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveBannerIndex(index)}
                className={`w-2.5 h-2 rounded-full transition-all duration-300 ${
                  index === activeBannerIndex ? 'bg-[#b7152b] w-8' : 'bg-zinc-300 hover:bg-zinc-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs and Search Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-zinc-100 pb-4">
        {/* Item Category Tabs */}
        <div className="flex gap-6 self-start sm:self-auto font-bold text-sm">
          <button 
            onClick={() => setActiveTab("AVATAR")}
            className={`pb-3 relative transition-colors ${
              activeTab === "AVATAR" ? "text-zinc-950 font-extrabold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Avatar
            {activeTab === "AVATAR" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b7152b] rounded-full" />
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab("BACKGROUND")}
            className={`pb-3 relative transition-colors ${
              activeTab === "BACKGROUND" ? "text-zinc-950 font-extrabold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Background (Hình nền)
            {activeTab === "BACKGROUND" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b7152b] rounded-full" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab("FRAME")}
            className={`pb-3 relative transition-colors ${
              activeTab === "FRAME" ? "text-zinc-950 font-extrabold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Frames (Khung viền)
            {activeTab === "FRAME" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b7152b] rounded-full" />
            )}
          </button>
        </div>

        {/* Items Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm vật phẩm..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200/60 rounded-full text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-red-500/20 focus:border-[#b7152b] placeholder-zinc-400 text-zinc-800"
          />
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isEquipped = equippedItems[item.item_type] === item.id;
          const isBuying = purchaseLoading === item.id;
          const isEquipping = equipLoading === item.id;

          return (
            <div 
              key={item.id} 
              className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group ${
                isEquipped ? "border-amber-400 ring-2 ring-amber-400/10" : "border-zinc-100"
              }`}
            >
              {/* Top info row */}
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide ${getRarityBadgeColor(item.rarity)}`}>
                  {translateRarity(item.rarity)}
                </span>
                
                {item.is_owned && (
                  <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <Check size={11} strokeWidth={3} />
                    Đã sở hữu
                  </span>
                )}
              </div>

              {/* Item Preview Display */}
              <div 
                onClick={() => setPreviewItem(item)}
                className="my-6 aspect-video flex items-center justify-center bg-zinc-50 border border-zinc-100/60 rounded-2xl relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300 cursor-pointer group/preview"
              >
                {/* Live Preview Overlay */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/preview:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 z-20 text-white">
                  <Eye size={18} className="drop-shadow-md" />
                  <span className="text-[9px] font-black tracking-wider uppercase drop-shadow-md">Xem thử Live</span>
                </div>

                {item.item_type === "FRAME" ? (
                  // Frame preview overlaying dummy avatar
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-400 text-xs shadow-inner">
                      User
                    </div>
                    {/* The Frame Overlay */}
                    <img 
                      src={getItemPlaceholderImage(item)} 
                      alt={item.name}
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      onError={(e) => {
                        // draw dynamic placeholder frame in canvas/svg style if empty
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ) : item.item_type === "BACKGROUND" ? (
                  // Background wallpaper: full coverage
                  <img 
                    src={getItemPlaceholderImage(item)} 
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  // Avatar rendering: centered circular avatar preview
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200/60 shadow-sm bg-white">
                    <img 
                      src={getItemPlaceholderImage(item)} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Item Info Description */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-zinc-950 text-base leading-tight">
                  {item.name}
                </h3>
                <p className="text-zinc-400 text-xs line-clamp-2 min-h-[32px] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Action Section */}
              <div className="flex justify-between items-center mt-5 border-t border-zinc-50 pt-4 gap-4">
                {/* Price Display */}
                <div>
                  {item.is_owned ? (
                    <span className="text-xs font-bold text-zinc-400">---</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-zinc-900">
                        {item.price.toLocaleString()}
                      </span>
                      {item.currency === "COIN" ? (
                        <Coins className="text-amber-500 w-4 h-4 fill-amber-500 shrink-0" />
                      ) : (
                        <Gem className="text-[#b7152b] w-4 h-4 fill-[#b7152b]/15 shrink-0" />
                      )}
                    </div>
                  )}
                </div>

                {/* Main Action Button */}
                {item.is_owned ? (
                  isEquipped ? (
                    <Button 
                      className="h-9 px-4 text-xs font-bold bg-zinc-100 hover:bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-default rounded-xl flex items-center gap-1"
                      disabled
                    >
                      <CheckCircle size={12} fill="currentColor" className="text-amber-500 fill-white" />
                      Đang dùng
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleEquip(item.id)}
                      className="h-9 px-4 text-xs font-bold bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-300 rounded-xl"
                      disabled={isEquipping}
                    >
                      {isEquipping ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Trang bị"
                      )}
                    </Button>
                  )
                ) : (
                  <Button 
                    onClick={() => setConfirmPurchaseItem(item)}
                    className="h-9 px-5 text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl"
                    disabled={isBuying}
                  >
                    {isBuying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Mua"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-zinc-400 font-bold space-y-2">
            <ShoppingBag className="w-12 h-12 mx-auto text-zinc-300" />
            <p>Không tìm thấy vật phẩm nào thuộc danh mục này.</p>
          </div>
        )}
      </div>
      </div>

      {/* Live Preview Modal (Light Theme Profile Style) */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white text-zinc-950 border border-zinc-100 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-fade-in-up duration-200 flex flex-col">
            
            {/* Close Button */}
            <button 
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/50 rounded-full p-1.5 transition-colors z-30 shadow-sm"
            >
              <X size={16} strokeWidth={3} />
            </button>

            {/* Profile Banner */}
            <div className="h-32 w-full bg-zinc-100 relative border-b border-zinc-100">
              {previewItem.item_type === "BACKGROUND" ? (
                <img src={getItemPlaceholderImage(previewItem)} alt="banner" className="w-full h-full object-cover" />
              ) : equippedDetails["BACKGROUND"] ? (
                <img src={equippedDetails["BACKGROUND"].image} alt="banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#b7152b] to-rose-600" />
              )}
            </div>

            {/* Avatar Container Overlapping Banner */}
            <div className="px-5 relative">
              <div className="absolute -top-10 left-5 w-20 h-20 rounded-full border-[5px] border-white bg-zinc-50 flex items-center justify-center shadow-md z-10 overflow-hidden">
                {/* Avatar Image */}
                {previewItem.item_type === "AVATAR" ? (
                  <img src={getItemPlaceholderImage(previewItem)} alt="avatar" className="w-full h-full object-cover" />
                ) : equippedDetails["AVATAR"] ? (
                  <img src={equippedDetails["AVATAR"].image} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#b7152b]/10 flex items-center justify-center text-[#b7152b] font-black text-2xl">
                    {user?.display_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* Frame Overlay (absolute on top of avatar) */}
                {previewItem.item_type === "FRAME" ? (
                  <img src={getItemPlaceholderImage(previewItem)} alt="frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.2]" />
                ) : equippedDetails["FRAME"] ? (
                  <img src={equippedDetails["FRAME"].image} alt="frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none scale-[1.2]" />
                ) : null}
              </div>
            </div>

            {/* Profile Details */}
            <div className="pt-12 px-5 pb-5 space-y-4">
              <div>
                <h3 className="font-extrabold text-lg leading-tight text-zinc-900">
                  {user?.display_name || "KujiLingo Learner"}
                </h3>
                <p className="text-zinc-500 text-xs font-semibold mt-0.5">@hocvien_kujilingo</p>
              </div>

              <div className="flex gap-2">
                <span className="bg-zinc-100 text-zinc-600 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border border-zinc-200/40">
                  Lv {userStats.level}
                </span>
                <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1 border border-amber-100/50">
                  <Flame size={10} className="fill-amber-500 text-amber-500" />
                  {userStats.streak} ngày streak
                </span>
              </div>
              
              <div className="h-px w-full bg-zinc-100" />

              {/* Previewed Item Information */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-2">Đang xem trước</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-zinc-900">{previewItem.name}</span>
                    <span className={`text-[10px] font-extrabold tracking-wider mt-0.5 ${
                      previewItem.rarity === "LEGENDARY" ? "text-rose-600" :
                      previewItem.rarity === "EPIC" ? "text-purple-600" :
                      previewItem.rarity === "RARE" ? "text-blue-600" : "text-zinc-500"
                    }`}>
                      {translateRarity(previewItem.rarity)} • {previewItem.item_type}
                    </span>
                  </div>
                  <div className="text-right">
                    {previewItem.is_owned ? (
                      <span className="text-emerald-600 font-extrabold text-xs flex items-center gap-1">
                        <Check size={12} strokeWidth={3} /> Đã mua
                      </span>
                    ) : (
                      <span className="font-black text-sm flex items-center gap-1 justify-end text-zinc-950">
                        {previewItem.price.toLocaleString()}
                        {previewItem.currency === "COIN" ? (
                          <Coins className="text-amber-500 w-3.5 h-3.5 fill-amber-500" />
                        ) : (
                          <Gem className="text-[#b7152b] w-3.5 h-3.5 fill-[#b7152b]/15" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2">
                {previewItem.is_owned ? (
                  equippedItems[previewItem.item_type] === previewItem.id ? (
                    <Button className="w-full h-10 bg-zinc-100 hover:bg-zinc-100 text-zinc-400 font-bold text-xs rounded-xl cursor-default" disabled>
                      Đang sử dụng
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        handleEquip(previewItem.id);
                        setPreviewItem(null);
                      }}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-600/10"
                    >
                      Trang bị ngay
                    </Button>
                  )
                ) : (
                  <Button 
                    onClick={() => {
                      setConfirmPurchaseItem(previewItem);
                    }}
                    className="w-full h-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Mua vật phẩm
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Confirmation Modal */}
      {confirmPurchaseItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white text-zinc-950 border border-zinc-100 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-fade-in-up duration-200 p-6 space-y-6 flex flex-col">
            
            {/* Item Showcase Image */}
            <div className="relative mx-auto mt-2">
              <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center overflow-hidden shadow-inner relative z-0">
                {confirmPurchaseItem.item_type === "FRAME" ? (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center font-bold text-zinc-400 text-xs shadow-inner">
                      User
                    </div>
                    <img 
                      src={getItemPlaceholderImage(confirmPurchaseItem)} 
                      alt={confirmPurchaseItem.name} 
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                    />
                  </div>
                ) : confirmPurchaseItem.item_type === "BACKGROUND" ? (
                  <img 
                    src={getItemPlaceholderImage(confirmPurchaseItem)} 
                    alt={confirmPurchaseItem.name} 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-200/60 shadow-sm bg-white">
                    <img 
                      src={getItemPlaceholderImage(confirmPurchaseItem)} 
                      alt={confirmPurchaseItem.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                <ShoppingBag size={14} strokeWidth={2.5} />
              </div>
            </div>

            {/* Title & Body */}
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-black text-zinc-900">Xác nhận mua hàng</h3>
              <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
                Bạn có chắc chắn muốn mua vật phẩm <span className="text-zinc-900 font-extrabold">{confirmPurchaseItem.name}</span> với giá:
              </p>
              <div className="flex items-center justify-center gap-1.5 py-1">
                <span className="text-2xl font-black text-zinc-950">
                  {confirmPurchaseItem.price.toLocaleString()}
                </span>
                {confirmPurchaseItem.currency === "COIN" ? (
                  <Coins className="text-amber-500 w-6 h-6 fill-amber-500" />
                ) : (
                  <Gem className="text-[#b7152b] w-6 h-6 fill-[#b7152b]/15" />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setConfirmPurchaseItem(null)}
                className="flex-1 h-10 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button 
                onClick={() => {
                  handlePurchase(confirmPurchaseItem.id, confirmPurchaseItem.price, confirmPurchaseItem.currency);
                  setConfirmPurchaseItem(null);
                  setPreviewItem(null);
                }}
                className="flex-1 h-10 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận mua
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 min-w-[300px] max-w-sm transition-all duration-300 animate-fade-in-up">
          {toast.type === "success" ? (
            <div className="bg-emerald-50 rounded-full p-1 border border-emerald-100/50 flex-shrink-0">
              <CheckCircle className="text-emerald-500 w-4 h-4 fill-emerald-500/20" />
            </div>
          ) : toast.type === "error" ? (
            <div className="bg-rose-50 rounded-full p-1 border border-rose-100/50 flex-shrink-0">
              <AlertCircle className="text-[#b7152b] w-4 h-4 fill-[#b7152b]/10" />
            </div>
          ) : (
            <div className="bg-blue-50 rounded-full p-1 border border-blue-100/50 flex-shrink-0">
              <CheckCircle className="text-blue-500 w-4 h-4 fill-blue-500/20" />
            </div>
          )}
          <span className="text-[13px] font-bold text-zinc-800 leading-tight pr-6">
            {toast.message}
          </span>
          <button 
            onClick={() => setToast(null)}
            className="absolute right-3 text-zinc-300 hover:text-zinc-600 rounded-full p-1 transition-colors bg-white hover:bg-zinc-50"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
