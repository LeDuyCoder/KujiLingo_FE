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
      }) => void;
      renderButton: (parent: HTMLElement, options: {
        type: "standard";
        theme: "outline";
        size: "large";
        text: "continue_with";
        shape: "pill";
        logo_alignment: "left";
        locale: string;
        width: number;
      }) => void;
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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_SCRIPT_ID = "google-identity-services-script";

export function GoogleSignInButton({ mode = "login", disabled = false }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const completeGoogleLogin = useAuthStore((state) => state.completeGoogleLogin);
  const credentialCallbackRef = useRef<(response: GoogleCredentialResponse) => void>(() => undefined);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const googleReadyRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const buttonContainer = buttonContainerRef.current;
      if (buttonContainer) {
        google.accounts.id.renderButton(buttonContainer, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          locale: language,
          width: Math.min(Math.max(buttonContainer.clientWidth, 120), 400),
        });
      }
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

  return (
    <div className="w-full">
      <div
        ref={buttonContainerRef}
        aria-label={t("google.buttonLabel")}
        aria-disabled={disabled || isLoading || !GOOGLE_CLIENT_ID}
        className={`flex min-h-[52px] w-full items-center justify-center overflow-hidden rounded-full [&_iframe]:max-w-full ${disabled || isLoading ? "pointer-events-none opacity-60" : ""}`}
      />
      {isLoading && <p className="mt-2 text-center text-sm text-zinc-500">{t("google.connecting")}</p>}
      {displayedError && <p role="alert" className="mt-2 text-center text-sm text-red-600">{displayedError}</p>}
    </div>
  );
}
