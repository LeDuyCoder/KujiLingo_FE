"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/auth.store";
import { useLanguage } from "@/shared/i18n/language";

type GoogleCredentialResponse = { credential: string };

type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void;
    };
  };
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

type GoogleSignInButtonProps = {
  mode?: "login" | "register";
  disabled?: boolean;
};

type RecentGoogleAccount = {
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = "google-identity-services-script";
const LAST_GOOGLE_ACCOUNT_KEY = "kujilingo:last-google-account";

export function GoogleSignInButton({ mode = "login", disabled = false }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const completeGoogleLogin = useAuthStore((state) => state.completeGoogleLogin);
  const credentialCallbackRef = useRef<(response: GoogleCredentialResponse) => void>(() => undefined);
  const googleReadyRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentAccount, setRecentAccount] = useState<RecentGoogleAccount | null>(null);
  const displayedError = error ?? (!GOOGLE_CLIENT_ID ? t("google.notConfigured") : null);

  const handleCredential = useCallback(async (credential: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sendCredential = async (requestMode: "login" | "register") => {
        const response = await fetch(`${API_URL}/auth/google/signin/credential`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential, mode: requestMode }),
        });
        const result = await response.json();
        return { response, result };
      };

      let { response, result } = await sendCredential(mode);

      // Older API deployments may still reject first-time Google sign-ins in
      // login mode. Retry those explicitly as registration; newer APIs create
      // the account during the first request and never need this fallback.
      const errorCode = String(result?.error?.code || "");
      const errorMessage = errorCode === "GOOGLE_ACCOUNT_NOT_FOUND"
        ? "No account was found for this Google email."
        : `${errorCode} ${result?.error?.message || result?.message || ""}`;
      if (
        mode === "login" &&
        /no account|account.*not found|user.*not found|create an account first|không tìm thấy tài khoản|chưa có tài khoản/i.test(errorMessage)
      ) {
        ({ response, result } = await sendCredential("register"));
      }

      if (!response.ok || !result.success || !result.data) {
        throw new Error(t("google.genericError"));
      }

      const session = result.data;
      if (!session.access_token || !session.refresh_token || !session.user?.email) {
        throw new Error(t("google.invalidResponse"));
      }

      completeGoogleLogin({
        ...session,
        user: {
          ...session.user,
          jlpt_target_level: session.user.jlpt_target_level ?? undefined,
        },
      });
      const googleAccount = {
        email: session.user.email,
        displayName: session.user.display_name,
        avatarUrl: session.user.avatar_url ?? null,
      } satisfies RecentGoogleAccount;
      try {
        window.localStorage.setItem(LAST_GOOGLE_ACCOUNT_KEY, JSON.stringify(googleAccount));
      } catch {
        // Sign-in still works when browser storage is unavailable.
      }
      setRecentAccount(googleAccount);
      router.push("/courses");
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : t("google.genericError"));
    } finally {
      setIsLoading(false);
    }
  }, [completeGoogleLogin, mode, router, t]);

  useEffect(() => {
    credentialCallbackRef.current = (response) => {
      if (response.credential) void handleCredential(response.credential);
      else setError(t("google.missingCredential"));
    };
  }, [handleCredential, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAccount = window.localStorage.getItem(LAST_GOOGLE_ACCOUNT_KEY);
        if (!savedAccount) return;

        try {
          const parsed = JSON.parse(savedAccount) as RecentGoogleAccount;
          if (parsed.email) setRecentAccount(parsed);
        } catch {
          // Migrate the email-only value stored by the previous button version.
          if (savedAccount.includes("@")) setRecentAccount({ email: savedAccount });
        }
      } catch {
        // Keep the default button when browser storage is unavailable.
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const initializeGoogle = () => {
      const google = window.google;
      if (!google || googleReadyRef.current) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => credentialCallbackRef.current(response),
      });
      googleReadyRef.current = true;
    };

    if (window.google?.accounts.id) {
      initializeGoogle();
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => initializeGoogle();
    const handleError = () => setError(t("google.loadError"));

    if (script) {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
    } else {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = `https://accounts.google.com/gsi/client?hl=${language}`;
      script.async = true;
      script.defer = true;
      script.referrerPolicy = "strict-origin-when-cross-origin";
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
      document.head.appendChild(script);
    }

    return () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };
  }, [language, t]);

  const startGoogleSignIn = () => {
    setError(null);
    const google = window.google;
    if (!googleReadyRef.current || !google?.accounts.id) {
      setError(t("google.loadError"));
      return;
    }

    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setError(t("google.promptUnavailable"));
      }
    });
  };

  const googleMark = (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.9 6.1-15Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.5a12 12 0 0 1 0-7.1v-5.3H5.8a20 20 0 0 0 0 17.7l6.8-5.3Z" />
      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z" />
    </svg>
  );

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={startGoogleSignIn}
        disabled={disabled || isLoading || !GOOGLE_CLIENT_ID}
        aria-label={t("google.buttonLabel")}
        className="relative flex min-h-[52px] w-full items-center justify-center rounded-full border border-zinc-300 bg-white px-12 text-sm text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {recentAccount ? (
          <span className="flex min-w-0 items-center justify-center gap-2.5 text-center">
            {recentAccount.avatarUrl ? (
              <Image src={recentAccount.avatarUrl} alt="" width={32} height={32} unoptimized referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                {(recentAccount.displayName || recentAccount.email).charAt(0).toUpperCase()}
              </span>
            )}
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-medium">{t("google.continueAs")} {recentAccount.displayName || recentAccount.email}</span>
              {recentAccount.displayName && <span className="block truncate text-zinc-500">{recentAccount.email}</span>}
            </span>
            <ChevronDown aria-hidden="true" size={16} className="shrink-0 text-zinc-500" />
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            {googleMark}
            <span>{t("google.buttonLabel")}</span>
          </span>
        )}
        {recentAccount && <span className="absolute right-4">{googleMark}</span>}
      </button>
      {isLoading && <p className="mt-2 text-center text-sm text-zinc-500">{t("google.connecting")}</p>}
      {displayedError && <p role="alert" className="mt-2 text-center text-sm text-red-600">{displayedError}</p>}
    </div>
  );
}
