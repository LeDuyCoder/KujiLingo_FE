"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
        use_fedcm_for_button: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "pill";
          width: number;
          logo_alignment: "left";
          locale: "vi" | "en";
        },
      ) => void;
    };
  };
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
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const credentialCallbackRef = useRef<(response: GoogleCredentialResponse) => void>(() => undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentAccount, setRecentAccount] = useState<RecentGoogleAccount | null>(null);

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

  credentialCallbackRef.current = (response) => {
    if (response.credential) void handleCredential(response.credential);
    else setError(t("google.missingCredential"));
  };

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
    const host = buttonHostRef.current;
    if (!host) return;

    if (!GOOGLE_CLIENT_ID) {
      setError(t("google.notConfigured"));
      return;
    }

    const initializeButton = () => {
      const google = window.google;
      const element = buttonHostRef.current;
      if (!google || !element) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => credentialCallbackRef.current(response),
        use_fedcm_for_button: true,
      });
      element.replaceChildren();
      google.accounts.id.renderButton(element, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: Math.min(400, Math.max(200, Math.floor(element.getBoundingClientRect().width))),
        logo_alignment: "left",
        locale: language === "vi" ? "vi" : "en",
      });
    };

    if (window.google?.accounts.id) {
      initializeButton();
      return;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => initializeButton();
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

  return (
    <div className="w-full">
      <div
        ref={buttonHostRef}
        aria-label={t("google.buttonLabel")}
        aria-disabled={disabled || isLoading}
        className={`flex min-h-12 w-full items-center justify-center overflow-hidden ${disabled || isLoading ? "pointer-events-none opacity-60" : ""}`}
      />
      {isLoading && <p className="mt-2 text-center text-sm text-zinc-500">{t("google.connecting")}</p>}
      {error && <p role="alert" className="mt-2 text-center text-sm text-red-600">{error}</p>}
      {recentAccount && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
          {recentAccount.avatarUrl ? (
            <img
              src={recentAccount.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
              {(recentAccount.displayName || recentAccount.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 text-left">
            <p className="text-xs text-zinc-500">{t("google.recentAccount")}</p>
            {recentAccount.displayName && <p className="truncate text-sm font-medium text-zinc-800">{recentAccount.displayName}</p>}
            <p className="truncate text-sm text-zinc-600">{recentAccount.email}</p>
          </div>
        </div>
      )}
    </div>
  );
}
