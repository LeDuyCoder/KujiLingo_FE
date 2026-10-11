"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth.store";
import { useLanguage } from "@/shared/i18n/language";

type GoogleSignInButtonProps = {
  mode?: "login" | "register";
  disabled?: boolean;
};

type GoogleSession = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    role: string;
    is_premium: boolean;
    jlpt_target_level?: string | null;
    learning_goal_minutes?: number;
    avatar_url?: string | null;
    preferred_language?: "vi" | "en";
  };
};

type GoogleAuthMessage = {
  type: "kujilingo:google-auth";
  session?: GoogleSession;
  error?: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

function isGoogleAuthMessage(value: unknown): value is GoogleAuthMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as GoogleAuthMessage;
  if (candidate.type !== "kujilingo:google-auth") return false;
  if (typeof candidate.error === "string") return true;

  const session = candidate.session;
  return Boolean(
    session &&
    typeof session.access_token === "string" &&
    typeof session.refresh_token === "string" &&
    session.user &&
    typeof session.user.id === "string" &&
    typeof session.user.email === "string" &&
    typeof session.user.display_name === "string" &&
    typeof session.user.role === "string" &&
    typeof session.user.is_premium === "boolean",
  );
}

export function GoogleSignInButton({ mode = "login", disabled = false }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const popupRef = useRef<Window | null>(null);
  const completedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finishSignIn = (value: unknown) => {
      if (!isGoogleAuthMessage(value)) return false;
      completedRef.current = true;
      popupRef.current?.close();
      popupRef.current = null;
      setIsLoading(false);

      if (value.session) {
        useAuthStore.getState().completeGoogleLogin({
          ...value.session,
          user: {
            ...value.session.user,
            jlpt_target_level: value.session.user.jlpt_target_level ?? undefined,
          },
        });
        router.replace("/courses");
      } else {
        setError(value.error || t("google.genericError"));
      }
      return true;
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== new URL(API_URL).origin || event.source !== popupRef.current) return;
      if (completedRef.current || !isGoogleAuthMessage(event.data)) return;
      event.source?.postMessage({ type: "kujilingo:google-auth-ack" }, event.origin);
      finishSignIn(event.data);
    };

    window.addEventListener("message", handleMessage);
    const channel = typeof BroadcastChannel === "undefined"
      ? null
      : new BroadcastChannel("kujilingo-google-auth");
    if (channel) {
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (!completedRef.current && popupRef.current) finishSignIn(event.data);
      };
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }, [router, t]);

  useEffect(() => {
    if (!isLoading || !popupRef.current) return;

    const popup = popupRef.current;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (popupRef.current !== popup) return;
      if (popup.closed) {
        popupRef.current = null;
        setIsLoading(false);
        if (!completedRef.current) setError(t("google.popupClosed"));
        return;
      }
      if (Date.now() - startedAt > 5 * 60 * 1000) {
        popup.close();
        popupRef.current = null;
        setIsLoading(false);
        setError(t("google.genericError"));
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [isLoading, t]);

  const startGoogleSignIn = () => {
    if (disabled || isLoading) return;

    setError(null);
    completedRef.current = false;
    const authUrl = `${API_URL}/auth/google/signin?mode=${mode}`;
    const width = 500;
    const height = 650;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      authUrl,
      "kujilingo-google-auth",
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      setError(t("google.popupBlocked"));
      return;
    }

    popupRef.current = popup;
    setIsLoading(true);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={startGoogleSignIn}
        disabled={disabled || isLoading}
        aria-label={t("google.buttonLabel")}
        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-6 text-sm text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
          <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
          <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7.1v-5.3H5.8a20 20 0 0 0 0 17.7l6.8-5.3Z" />
          <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
        </svg>
        <span>{isLoading ? t("google.connecting") : t("google.buttonLabel")}</span>
      </button>
      {error && <p role="alert" className="mt-3 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
