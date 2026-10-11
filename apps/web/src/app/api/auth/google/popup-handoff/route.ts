import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const HANDOFF_COOKIE = "kujilingo_google_popup_handoff";
const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").origin;
const MAX_HANDOFF_BYTES = 3500;

type GooglePopupHandoff = {
  session?: {
    access_token?: unknown;
    refresh_token?: unknown;
    user?: {
      id?: unknown;
      email?: unknown;
      display_name?: unknown;
      role?: unknown;
      is_premium?: unknown;
    };
  };
  error?: unknown;
};

function isValidHandoff(value: unknown): value is GooglePopupHandoff {
  if (!value || typeof value !== "object") return false;
  const handoff = value as GooglePopupHandoff;
  if (handoff.error !== undefined) return typeof handoff.error === "string";

  const session = handoff.session;
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

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== API_ORIGIN) {
    return NextResponse.json({ error: "Invalid sign-in origin." }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const encoded = form.get("handoff");
    if (typeof encoded !== "string" || encoded.length > 12000) {
      return NextResponse.json({ error: "Invalid sign-in response." }, { status: 400 });
    }

    const handoff = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as unknown;
    if (!isValidHandoff(handoff)) {
      return NextResponse.json({ error: "Invalid sign-in response." }, { status: 400 });
    }

    const serialized = JSON.stringify(handoff);
    if (Buffer.byteLength(serialized, "utf8") > MAX_HANDOFF_BYTES) {
      return NextResponse.json({ error: "Sign-in response is too large." }, { status: 413 });
    }

    const response = NextResponse.redirect(new URL("/google/popup-complete", request.url), 303);
    response.cookies.set(HANDOFF_COOKIE, serialized, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60,
    });
    response.headers.set("Cache-Control", "no-store, max-age=0");
    return response;
  } catch {
    return NextResponse.json({ error: "Could not complete Google sign-in." }, { status: 400 });
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const value = cookieStore.get(HANDOFF_COOKIE)?.value;
  cookieStore.delete(HANDOFF_COOKIE);

  if (!value) {
    return NextResponse.json({ error: "Google sign-in response expired." }, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const handoff = JSON.parse(value) as unknown;
    if (!isValidHandoff(handoff)) throw new Error("Invalid handoff.");
    return NextResponse.json(handoff, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Google sign-in response is invalid." }, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
