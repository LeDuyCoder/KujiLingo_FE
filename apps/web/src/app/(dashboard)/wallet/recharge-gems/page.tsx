"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Gem, 
  Coins, 
  Award,
  CreditCard,
  Lock,
  Zap,
  CheckCircle2,
  Circle
} from "lucide-react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { axiosClient } from "@/shared/api/axiosClient";

interface GemPackage {
  id: string;
  title: string;
  gem_amount: number;
  bonus_gem: number;
  effective_bonus_gem: number;
  total_gems: number;
  price: number;
  is_popular: boolean;
  is_best_value: boolean;
}

interface GemPromotion {
  id: string;
  title: string;
  bonus_percent: number;
  end_at: string;
}

interface WalletHistory {
  id: string;
  transaction_type: string;
  gem_change: number;
  created_at: string;
}


export default function RechargeGemsPage() {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState<{ coins: number; gems: number } | null>(null);
  const [packages, setPackages] = useState<GemPackage[]>([]);
  const [promotion, setPromotion] = useState<GemPromotion | null>(null);
  const [transactions, setTransactions] = useState<WalletHistory[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<GemPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PAYOS">("PAYOS");
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wallet
        const walletRes = await axiosClient.get("/api/v1/shop/wallet");
        if (walletRes.data?.success) {
          setWallet(walletRes.data.data);
        }

        // Fetch packages & promotion
        const pkgRes = await axiosClient.get("/api/v1/gems/packages");
        if (pkgRes.data?.success) {
          const pkgs = pkgRes.data.data.packages || [];
          setPackages(pkgs);
          setPromotion(pkgRes.data.data.active_promotion || null);
          
          if (pkgs.length > 0) {
            const defaultPkg = pkgs.find((p: GemPackage) => p.is_popular) || pkgs[0];
            setSelectedPackage(defaultPkg);
          }
        }

        // Fetch wallet history
        const txRes = await axiosClient.get("/api/v1/gems/wallet-history?transaction_type=RECHARGE");
        if (txRes.data?.success) {
          setTransactions(txRes.data.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    try {
      setIsPurchasing(true);
      const res = await axiosClient.post("/api/v1/gems/transactions", {
        package_id: selectedPackage.id,
        payment_method: paymentMethod
      });
      if (res.data?.success && res.data.data?.payment_url) {
        localStorage.setItem("pending_transaction_id", res.data.data.transaction_id);
        window.location.href = res.data.data.payment_url;
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="w-full pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-6">
        <Link href="/home" className="hover:text-zinc-900 transition-colors">Home</Link>
        <ChevronRight size={14} className="text-zinc-300" />
        <span>Wallet</span>
        <ChevronRight size={14} className="text-zinc-300" />
        <span className="text-[#b7152b]">Recharge Gems</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Recharge Gems</h1>
        <p className="text-zinc-500 font-medium text-sm max-w-xl">
          Purchase Gems to unlock premium cosmetics, avatars, backgrounds and frames.
        </p>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Gems */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Gem size={20} className="text-[#b7152b] fill-[#b7152b]/10" />
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">Current Gems</div>
            <div className="text-xl font-black text-zinc-900">{wallet?.gems.toLocaleString() || "0"}</div>
          </div>
        </div>
        
        {/* Coins */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <Coins size={20} className="text-amber-500 fill-amber-500/10" />
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-0.5">Current Coins</div>
            <div className="text-xl font-black text-zinc-900">{wallet?.coins.toLocaleString() || "0"}</div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
             <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">Member Status</div>
             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#b7152b] text-sm font-bold rounded-full border border-rose-100 mt-1">
               <Award size={14} />
               {user?.is_premium ? "Premium" : "Free Plan"}
             </div>
          </div>
        </div>
      </div>

      {/* Promo Banner */}
      {promotion ? (
        <div className="relative w-full rounded-[1.5rem] overflow-hidden bg-gradient-to-r from-[#b7152b] to-rose-600 p-6 md:p-8 mb-8 shadow-lg shadow-red-200 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
           
           <div className="relative z-10 text-white max-w-md">
             <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 border border-white/30">
               Limited Time Offer
             </div>
             <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
               {promotion.title}
             </h2>
             <p className="text-red-100 font-medium text-sm">
               Stock up now for upcoming exclusive frames.
             </p>
           </div>
        </div>
      ) : (
        <div className="mb-8" />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Packages */}
        <div className="flex-1">
          <h2 className="text-base font-bold text-zinc-900 mb-3">Select Package</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative flex flex-col items-center p-5 rounded-3xl border-2 transition-all cursor-pointer ${
                  selectedPackage?.id === pkg.id 
                    ? "border-[#b7152b] bg-rose-50/30 shadow-md shadow-red-100" 
                    : "border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-sm"
                }`}
              >
                {/* Radio indicator */}
                <div className="absolute top-4 left-4">
                  {selectedPackage?.id === pkg.id ? (
                    <CheckCircle2 size={24} className="text-[#b7152b] fill-[#b7152b]/10" />
                  ) : (
                    <Circle size={24} className="text-zinc-200" />
                  )}
                </div>

                {/* Tags */}
                {(pkg.is_popular || pkg.is_best_value) && (
                  <div className={`absolute -top-3 right-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                    pkg.is_popular 
                      ? "bg-[#b7152b] text-white border-red-700" 
                      : "bg-zinc-100 text-zinc-500 border-zinc-200"
                  }`}>
                    {pkg.is_popular ? "MOST POPULAR" : "BEST VALUE"}
                  </div>
                )}
                {pkg.effective_bonus_gem > 0 && (
                  <div className="absolute top-4 right-4 bg-rose-200 text-[#b7152b] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    +{pkg.effective_bonus_gem} Bonus
                  </div>
                )}

                {/* Image (Icon) */}
                <div className="w-20 h-20 bg-zinc-100/50 rounded-2xl mb-3 flex items-center justify-center p-3">
                   <Gem size={48} className="text-[#b7152b] fill-[#b7152b]/10 drop-shadow-md" />
                </div>

                <div className="flex items-center gap-1.5 text-xl font-black text-zinc-900 mb-2">
                  {pkg.gem_amount.toLocaleString()} 
                  <Gem size={18} className="text-[#b7152b] fill-[#b7152b]/10" />
                </div>
                
                <div className={`w-full text-center py-1.5 rounded-lg font-bold text-xs transition-colors ${
                  selectedPackage?.id === pkg.id
                    ? "bg-[#b7152b] text-white"
                    : "text-zinc-500 bg-zinc-50 group-hover:bg-zinc-100"
                }`}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.price)}
                </div>
              </div>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="mt-8">
            <h2 className="text-base font-bold text-zinc-900 mb-3">Recent Transactions</h2>
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50/50 text-zinc-500 font-bold text-xs uppercase tracking-wider border-b border-zinc-100">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 text-zinc-500 font-medium">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-1.5">
                        {tx.gem_change} <Gem size={14} className="text-[#b7152b]" />
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-medium">-</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 tracking-wider">
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[1.5rem] p-5 lg:p-6 border border-zinc-100 shadow-xl shadow-zinc-200/40 sticky top-28">
            <h2 className="text-lg font-black text-zinc-900 mb-5">Order Summary</h2>
            
            {selectedPackage ? (
              <>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
                    <span className="flex items-center gap-1.5">
                      <Gem size={14} className="text-[#b7152b]" />
                      {selectedPackage.gem_amount.toLocaleString()} Gems
                    </span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}</span>
                  </div>
                  
                  {selectedPackage.effective_bonus_gem > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold text-[#b7152b]">
                      <span>+ {selectedPackage.effective_bonus_gem} Bonus Gems</span>
                      <span>Free</span>
                    </div>
                  )}
                  
                  {promotion && (
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                      <span>{promotion.title}</span>
                      <span>Applied</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-100 pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-zinc-500 text-sm font-bold">Total</span>
                    <span className="text-2xl font-black text-zinc-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedPackage.price)}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full bg-[#b7152b] hover:bg-rose-700 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all duration-300 hover:scale-[1.02] mb-3"
                >
                  <Lock size={16} />
                  {isPurchasing ? "Processing..." : "Purchase Now"}
                </button>
                <p className="text-[9px] text-zinc-400 text-center font-medium">
                  By purchasing, you agree to our Terms of Service.
                </p>
              </>
            ) : (
              <div className="text-zinc-400 text-sm text-center py-8">Select a package to view summary</div>
            )}

            {/* Payment Methods */}
            <div className="mt-8 pt-6 border-t border-zinc-100">
               <h3 className="text-xs font-bold text-zinc-900 mb-4 uppercase tracking-wider">Select Payment Method</h3>
               <div className="flex gap-2">
                 <div 
                   onClick={() => setPaymentMethod("PAYOS")}
                   className={`flex-1 py-3 bg-white border-2 rounded-xl flex items-center justify-center relative cursor-pointer shadow-sm ${
                     paymentMethod === "PAYOS" ? "border-[#b7152b]" : "border-zinc-100 hover:border-zinc-200"
                   }`}
                 >
                   {paymentMethod === "PAYOS" && (
                     <div className="absolute -top-1.5 -right-1.5 bg-[#b7152b] text-white rounded-full p-0.5">
                       <CheckCircle2 size={12} />
                     </div>
                   )}
                   <span className="font-black text-[#111827] text-sm tracking-tighter">PayOS</span>
                 </div>
               </div>

               <div className="flex items-center justify-center gap-8 mt-6 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">
                 <div className="flex flex-col items-center gap-1">
                   <Zap size={16} className="text-amber-500" />
                   Instant<br/>Delivery
                 </div>
                 <div className="flex flex-col items-center gap-1">
                   <Lock size={16} className="text-[#b7152b]" />
                   Secure<br/>Payment
                 </div>
               </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
