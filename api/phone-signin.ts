// POST /api/phone-signin  — server half of "Sign in with mobile number".
//
// The browser sends the Firebase ID token it got after the customer typed their SMS code.
// We only trust that token after checking Google's signature, issuer, audience and age.
// Then we ask Wix (with the server-only API key) to sign that phone number's member in,
// creating the member on first sign-in, and return Wix's one-time session token.
//
// Runs as a Vercel function (Web Request/Response). Required environment variables:
//   FIREBASE_PROJECT_ID   your Firebase project id
//   WIX_API_KEY           Wix API key with "Manage Members Authentication" permission
//   WIX_SITE_ID           08e3d6d9-b449-4ad0-90b6-65a57df0c64d
//   ALLOWED_ORIGINS       comma-separated, e.g. https://lokikeys.com,https://www.lokikeys.com
// Optional: PHONE_LOGIN_EMAIL_DOMAIN (default phone.lokikeys.com)
// Recommended in production: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (free tier is
// enough). With them, attempt limits and one-time token use are shared by every server instance;
// without them they are kept per instance, in memory.
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

const GOOGLE_JWKS =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const DIAL: Record<string, string> = {
  IN: "91",
  US: "1",
  CA: "1",
  GB: "44",
  AE: "971",
  AU: "61",
  SG: "65",
  SA: "966",
  DE: "49",
  NP: "977",
};
const MAX_BODY = 8 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10; // per IP address
const MAX_PER_PHONE = 5; // sign-ins per verified number per window

type Env = Record<string, string | undefined>;
type Deps = { env: Env; jwks?: JWTVerifyGetKey; fetchImpl?: typeof fetch; now?: () => number };

export function createHandler({ env, jwks, fetchImpl = fetch, now = Date.now }: Deps) {
  const keys = jwks ?? createRemoteJWKSet(new URL(GOOGLE_JWKS));
  const hits = new Map<string, number[]>(); // fallback store, per server instance
  const usedTokens = new Map<string, number>();

  // Shared store (Upstash Redis REST) when configured, so limits survive restarts and scale-out.
  async function redis(commands: (string | number)[][]): Promise<unknown[] | null> {
    const url = env.UPSTASH_REDIS_REST_URL;
    const token = env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    const res = await fetchImpl(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
    });
    if (!res.ok) throw new Error(`rate store ${res.status}`);
    const out = (await res.json()) as { result?: unknown }[];
    return out.map((r) => r.result);
  }

  /** Counts one attempt for `key`; true when the limit for the window is exceeded. */
  async function overLimit(key: string, max: number): Promise<boolean> {
    const shared = await redis([
      ["INCR", `loki:rl:${key}`],
      ["EXPIRE", `loki:rl:${key}`, Math.ceil(WINDOW_MS / 1000), "NX"],
    ]);
    if (shared) return Number(shared[0]) > max;
    const t = now();
    const recent = (hits.get(key) || []).filter((x) => t - x < WINDOW_MS);
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    return recent.length > max;
  }

  /** Marks a verified token as used; false if it was already used (replay). */
  async function firstUse(id: string): Promise<boolean> {
    const shared = await redis([["SET", `loki:used:${id}`, "1", "NX", "EX", 1200]]);
    if (shared) return shared[0] === "OK";
    const t = now();
    for (const [k, at] of usedTokens) if (t - at > 20 * 60 * 1000) usedTokens.delete(k);
    if (usedTokens.has(id)) return false;
    usedTokens.set(id, t);
    return true;
  }

  const reply = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });

  return async function POST(request: Request): Promise<Response> {
    const projectId = env.FIREBASE_PROJECT_ID;
    if (!projectId || !env.WIX_API_KEY || !env.WIX_SITE_ID) {
      return reply(503, { error: "Mobile sign-in isn't switched on yet." });
    }

    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const origin = request.headers.get("origin") || "";
    if (!allowed.length || !allowed.includes(origin)) return reply(403, { error: "Not allowed." });

    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
    try {
      if (await overLimit(`ip:${ip}`, MAX_PER_WINDOW)) {
        return reply(429, { error: "Too many attempts. Please wait a few minutes." });
      }
    } catch (e) {
      console.error("phone-signin: rate store unavailable", (e as Error).message);
      return reply(503, { error: "Mobile sign-in is busy. Please try again in a minute." }); // fail closed
    }

    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return reply(415, { error: "Bad request." });
    }
    const raw = await request.text();
    if (raw.length > MAX_BODY) return reply(413, { error: "Bad request." });
    let body: { idToken?: unknown; country?: unknown };
    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, { error: "Bad request." });
    }
    if (typeof body.idToken !== "string" || body.idToken.length > 4096) {
      return reply(400, { error: "Bad request." });
    }

    let phone: string;
    let tokenId: string;
    try {
      const { payload } = await jwtVerify(body.idToken, keys, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
        algorithms: ["RS256"],
        maxTokenAge: "10m",
        currentDate: new Date(now()),
      });
      const firebase = payload.firebase as { sign_in_provider?: string } | undefined;
      const authTime = Number(payload.auth_time) * 1000;
      if (firebase?.sign_in_provider !== "phone") throw new Error("not a phone sign-in");
      if (!payload.sub || !authTime || now() - authTime > 10 * 60 * 1000) throw new Error("stale");
      phone = String(payload.phone_number || "");
      if (!/^\+[1-9]\d{6,14}$/.test(phone)) throw new Error("no phone");
      tokenId = `${payload.sub}:${payload.iat}`;
    } catch {
      return reply(401, { error: "That code has expired. Please ask for a new one." });
    }

    try {
      if (!(await firstUse(tokenId))) {
        return reply(401, { error: "That code has already been used. Please ask for a new one." });
      }
      if (await overLimit(`phone:${phone}`, MAX_PER_PHONE)) {
        return reply(429, {
          error: "Too many sign-ins for this number. Please wait a few minutes.",
        });
      }
    } catch (e) {
      console.error("phone-signin: rate store unavailable", (e as Error).message);
      return reply(503, { error: "Mobile sign-in is busy. Please try again in a minute." });
    }

    // One member per verified number. The login email is a placeholder that can only be
    // reached through a verified SMS code, so nobody can claim it with a password.
    const domain = env.PHONE_LOGIN_EMAIL_DOMAIN || "phone.lokikeys.com";
    const digits = phone.slice(1);
    const country = typeof body.country === "string" ? body.country : "";
    const dial = DIAL[country];
    const profile =
      dial && digits.startsWith(dial)
        ? { phonesV2: [{ countryCode: country, phone: digits.slice(dial.length), tag: "MOBILE" }] }
        : { phones: [phone] };

    try {
      const res = await fetchImpl("https://www.wixapis.com/_api/iam/authentication/v2/sign-on", {
        method: "POST",
        headers: {
          Authorization: env.WIX_API_KEY,
          "wix-site-id": env.WIX_SITE_ID,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: { email: `ph${digits}@${domain}` },
          profile: { ...profile, privacyStatus: "PRIVATE" },
          verifyEmail: true,
          mergeExistingContact: false,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { sessionToken?: string };
      if (!res.ok || !data.sessionToken) throw new Error(`wix ${res.status}`);
      return reply(200, { sessionToken: data.sessionToken });
    } catch (e) {
      console.error("phone-signin: Wix sign-on failed", (e as Error).message);
      return reply(502, { error: "We couldn't sign you in right now. Please try again." });
    }
  };
}

export const POST = createHandler({ env: process.env });
