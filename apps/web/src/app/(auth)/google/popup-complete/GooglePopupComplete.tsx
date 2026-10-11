"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/features/authentication/stores/auth.store";
import { useLanguage } from "@/shared/i18n/language";

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

function isSession(value: unknown): value is { session: GoogleSession } {
  if (!value || typeof value !== "object") return false;
  const session = (value as { session?: unknown }).session;
  if (!session || typeof session !== "object") return false;
  const candidate = session as GoogleSession;
  return Boolean(
    typeof candidate.access_token === "string" &&
    typeof candidate.refresh_token === "string" &&
    candidate.user &&
    typeof candidate.user.id === "string" &&
    typeof candidate.user.email === "string" &&
    typeof candidate.user.display_name === "string" &&
    typeof candidate.user.role === "string" &&
    typeof candidate.user.is_premium === "boolean",
  );
}

export function GooglePopupComplete() {
  const { t } = useLanguage();
  const startedRef = useRef(false);
  const [message, setMessage] = useState(t("google.finishing"));

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const response = await fetch("/api/auth/google/popup-handoff", { cache: "no-store" });
        const result: unknown = await response.json();
        if (!response.ok) throw new Error("Handoff expired.");

        const channel = typeof BroadcastChannel === "undefined"
          ? null
          : new BroadcastChannel("kujilingo-google-auth");

        if (isSession(result)) {
          const session = result.session;
          const payload = {
            type: "kujilingo:google-auth",
            session: {
              ...session,
              user: {
                ...session.user,
                jlpt_target_level: session.user.jlpt_target_level ?? undefined,
              },
            },
          };
          useAuthStore.getState().completeGoogleLogin(payload.session);
          channel?.postMessage(payload);
          setMessage(t("google.popupComplete"));
        } else if (result && typeof result === "object" && typeof (result as { error?: unknown }).error === "string") {
          channel?.postMessage({
            type: "kujilingo:google-auth",
            error: (result as { error: string }).error,
          });
          setMessage((result as { error: string }).error);
        } else {
          throw new Error("Invalid sign-in response.");
        }

        channel?.close();
        window.setTimeout(() => window.close(), 300);
      } catch {
        setMessage(t("google.genericError"));
      }
    })();
  }, [t]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p role="status" className="text-center text-sm text-zinc-600">{message}</p>
    </main>
  );
}
