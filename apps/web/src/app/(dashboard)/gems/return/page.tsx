"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Gem, ArrowRight, Home } from "lucide-react";
import Link from "next/link";
import { axiosClient } from "@/shared/api/axiosClient";

type TransactionStatus = "LOADING" | "SUCCESS" | "FAILED" | "CANCELLED";

interface TransactionData {
  transaction_id: string;
  payment_status: string;
  total_gem: number;
  amount: number;
  paid_at?: string;
}

function ReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const idFromUrl = searchParams.get("id");
  const cancel = searchParams.get("cancel");
  
  const [status, setStatus] = useState<TransactionStatus>("LOADING");
  const [txData, setTxData] = useState<TransactionData | null>(null);

  useEffect(() => {
    const txId = localStorage.getItem("pending_transaction_id");

    // If the user cancelled the payment
    if (cancel === "true") {
      setStatus("CANCELLED");
      return;
    }

    if (!txId) {
      setStatus("FAILED");
      return;
    }

    let isMounted = true;

    const verifyTransaction = async () => {
      try {
        const res = await axiosClient.get(`/api/v1/gems/transactions/${txId}`);
        if (res.data?.success && isMounted) {
          const data = res.data.data;
          setTxData(data);
          
          if (data.payment_status === "SUCCESS") {
            setStatus("SUCCESS");
          } else if (data.payment_status === "PENDING") {
            // Still pending, maybe webhook hasn't processed yet. Try polling?
            // For simplicity, we just say it's still processing
            setStatus("LOADING");
            // Basic polling once after 3 seconds
            setTimeout(verifyTransaction, 3000);
          } else {
            setStatus("FAILED");
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus("FAILED");
          console.error("Error verifying transaction:", err);
        }
      }
    };

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, [cancel]);

  return (
    <div className="w-full flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-zinc-200/50 border border-zinc-100 max-w-md w-full text-center relative overflow-hidden">
        
        {/* Background decorative elements */}
        {status === "SUCCESS" && (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        )}
        {status === "FAILED" || status === "CANCELLED" ? (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
        ) : null}

        <div className="relative z-10 flex flex-col items-center">
          {status === "LOADING" && (
            <>
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Loader2 size={32} className="text-[#b7152b] animate-spin" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Verifying Payment...</h1>
              <p className="text-zinc-500 text-sm mb-8">
                Please wait while we confirm your transaction with the payment gateway.
              </p>
            </>
          )}

          {status === "SUCCESS" && (
            <>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-emerald-100">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Payment Successful!</h1>
              <p className="text-zinc-500 text-sm mb-6">
                Thank you for your purchase. Your account has been credited with:
              </p>
              
              {txData && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 w-full mb-8 flex items-center justify-between">
                  <span className="font-bold text-zinc-600">Added to Wallet</span>
                  <div className="flex items-center gap-1.5 text-xl font-black text-zinc-900">
                    +{txData.total_gem} <Gem size={20} className="text-[#b7152b] fill-[#b7152b]/10" />
                  </div>
                </div>
              )}
              
              <Link 
                href="/wallet/recharge-gems"
                className="w-full bg-[#b7152b] hover:bg-rose-700 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all duration-300 hover:scale-[1.02]"
              >
                Return to Wallet <ArrowRight size={16} />
              </Link>
            </>
          )}

          {status === "CANCELLED" && (
            <>
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-amber-100">
                <XCircle size={40} className="text-amber-500" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Payment Cancelled</h1>
              <p className="text-zinc-500 text-sm mb-8">
                You have cancelled the payment process. No charges were made.
              </p>
              <Link 
                href="/wallet/recharge-gems"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200 transition-all duration-300 hover:scale-[1.02]"
              >
                Try Again <ArrowRight size={16} />
              </Link>
            </>
          )}

          {status === "FAILED" && (
            <>
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 shadow-inner shadow-rose-100">
                <XCircle size={40} className="text-rose-500" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 mb-2">Payment Failed</h1>
              <p className="text-zinc-500 text-sm mb-8">
                We couldn&apos;t process your transaction. Please check your payment method and try again.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Link 
                  href="/wallet/recharge-gems"
                  className="w-full bg-[#b7152b] hover:bg-rose-700 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-200 transition-all duration-300 hover:scale-[1.02]"
                >
                  Try Again <ArrowRight size={16} />
                </Link>
                <Link 
                  href="/home"
                  className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                >
                  <Home size={16} /> Back to Home
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <div className="w-full flex-1 flex flex-col">
      <Suspense fallback={
        <div className="w-full flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="text-[#b7152b] animate-spin" />
        </div>
      }>
        <ReturnContent />
      </Suspense>
    </div>
  );
}
