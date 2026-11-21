// One Wix session per browser: an anonymous shopper (visitor) until the customer signs in,
// then a member. The cart, checkout and account calls all use whichever token is current,
// so orders placed while signed in belong to the customer's account.
import { WIX } from "./site";

export type Role = "visitor" | "member";
type Tokens = { role: Role; accessToken: string; refreshToken: string; expiresAt: number };

const KEY = `wix-session-${WIX.clientId}`;
const LEGACY_KEY = `wix-visitor-${WIX.clientId}`;
let memory: Tokens | null = null; // fallback when storage is blocked (private mode)
const listeners = new Set<(role: Role) => void>();

function read(): Tokens | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    if (!raw) return memory;
    const t = JSON.parse(raw) as Partial<Tokens>;
    if (typeof t.accessToken !== "string" || typeof t.refreshToken !== "string") return null;
    return {
      role: t.role === "member" ? "member" : "visitor",
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      expiresAt: Number(t.expiresAt) || 0,
    };
  } catch {
    return memory;
  }
}

function write(t: Tokens | null) {
  const before = read()?.role ?? "visitor";
  memory = t;
  try {
    localStorage.removeItem(LEGACY_KEY);
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: keep the in-memory copy */
  }
  const after = t?.role ?? "visitor";
  if (before !== after) listeners.forEach((fn) => fn(after));
}

/** Calls Wix's token endpoint and turns the answer into stored tokens. */
export async function exchangeTokens(body: Record<string, string>, role: Role): Promise<Tokens> {
  const res = await fetch(`${WIX.api}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: WIX.clientId, ...body }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || typeof j.access_token !== "string") {
    throw new Error("We couldn't reach our store right now. Please try again in a minute.");
  }
  const t: Tokens = {
    role,
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    // Refresh a minute early so a request never goes out with a token about to expire.
    expiresAt: Date.now() + (Number(j.expires_in) || 14400) * 1000 - 60_000,
  };
  write(t);
  return t;
}

let pending: Promise<string> | null = null;

/** Current access token; refreshes it, or starts a new shopper session, when needed. */
export function accessToken(): Promise<string> {
  const t = read();
  if (t && t.expiresAt > Date.now()) return Promise.resolve(t.accessToken);
  // Share one refresh between concurrent calls so the refresh token is only spent once.
  pending ??= (async () => {
    try {
      if (t?.refreshToken) {
        try {
          return (
            await exchangeTokens(
              { grantType: "refresh_token", refreshToken: t.refreshToken },
              t.role,
            )
          ).accessToken;
        } catch {
          /* expired or revoked: the customer is signed out and starts a fresh shopper session */
        }
      }
      return (await exchangeTokens({ grantType: "anonymous" }, "visitor")).accessToken;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export type WixError = Error & { status: number; code?: string };

/** Authenticated call to the Wix REST API as the current shopper or member. */
export async function wixFetch<T = any>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(`${WIX.api}${path}`, {
    method,
    headers: { Authorization: await accessToken(), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`) as WixError;
    err.status = res.status;
    err.code = data?.details?.applicationError?.code;
    throw err;
  }
  return data as T;
}

export const currentRole = (): Role => read()?.role ?? "visitor";

/** Forgets every token in this browser. The next call starts a fresh shopper session. */
export const clearSession = () => write(null);

export function onRoleChange(fn: (role: Role) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
