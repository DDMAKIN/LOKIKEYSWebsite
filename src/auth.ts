// Customer accounts for LOKI KEYS, run by the Wix store's member system.
//
// Google:  Wix runs "Sign in with Google" (no Google keys needed on our side).
// Email:   our own form calls Wix's Register / Login APIs; Wix stores and checks passwords.
// Phone:   see phoneAuth.ts — a one-time SMS code, then our server signs the member in.
//
// Every route ends the same way: Wix hands back a short-lived authorization code that we
// swap, with a PKCE verifier only this browser tab knows, for the member's tokens.
import { WIX, PHONE_LOGIN } from "./site";
import { clearSession, currentRole, exchangeTokens, wixFetch, type WixError } from "./wixSession";

const PENDING_KEY = "loki-auth-pending";
const PENDING_TTL = 15 * 60 * 1000;
const GOOGLE_CONNECTION_ID = "0e6a50f5-b523-4e29-990d-f37fa2ffdd69";

// ---------- small helpers ----------

function base64url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomString(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** PKCE pair (RFC 7636, S256). */
export async function createPkce() {
  const verifier = randomString(48);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

/** Only same-site paths are allowed as a destination after sign-in (no open redirects). */
export function safeReturnPath(path: unknown): string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return "/";
  if (/[\\\s]/.test(path) || /^\/+[a-z][a-z0-9+.-]*:/i.test(path)) return "/";
  return path;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Country = { iso: string; dial: string; name: string };
export const COUNTRIES: Country[] = [
  { iso: "IN", dial: "91", name: "India" },
  { iso: "US", dial: "1", name: "United States" },
  { iso: "CA", dial: "1", name: "Canada" },
  { iso: "GB", dial: "44", name: "United Kingdom" },
  { iso: "AE", dial: "971", name: "United Arab Emirates" },
  { iso: "AU", dial: "61", name: "Australia" },
  { iso: "SG", dial: "65", name: "Singapore" },
  { iso: "SA", dial: "966", name: "Saudi Arabia" },
  { iso: "DE", dial: "49", name: "Germany" },
  { iso: "NP", dial: "977", name: "Nepal" },
];

export type ParsedPhone = { e164: string; iso: string; national: string };

/** Validates a mobile number typed for the chosen country and returns it in +E.164 form. */
export function parsePhone(iso: string, input: string): ParsedPhone | null {
  const country = COUNTRIES.find((c) => c.iso === iso);
  if (!country) return null;
  let digits = input.replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) {
    if (!digits.startsWith(`+${country.dial}`)) return null;
    digits = digits.slice(country.dial.length + 1);
  }
  digits = digits.replace(/^0+/, "");
  if (!/^\d+$/.test(digits)) return null;
  if (iso === "IN" && !/^[6-9]\d{9}$/.test(digits)) return null;
  if ((iso === "US" || iso === "CA") && !/^[2-9]\d{9}$/.test(digits)) return null;
  if (digits.length < 6 || digits.length > 13) return null;
  return { e164: `+${country.dial}${digits}`, iso, national: digits };
}

export const redirectUri = () => `${window.location.origin}/`;

type Pending = {
  verifier: string;
  state: string;
  redirectUri: string;
  returnTo: string;
  createdAt: number;
};

function takePending(): Pending | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as Pending) : null;
  } catch {
    return null;
  }
}

const NETWORK_BLOCKED =
  "We can't sign you in from this network. If you're using a VPN or proxy, switch it off and try again, or continue with Google.";

function friendly(e: unknown, fallback: string): Error {
  const err = e as WixError;
  if (err?.code === "IP_ADDRESS_FILTERED") return new Error(NETWORK_BLOCKED);
  if (err?.status === 429)
    return new Error("Too many attempts. Please wait a minute and try again.");
  if (err instanceof TypeError) return new Error("You seem to be offline. Check your connection.");
  return new Error(fallback);
}

// ---------- the shared last step ----------

/**
 * Asks Wix for a one-time sign-in URL and sends the browser there. Wix comes straight back to
 * our home page with `#code=…&state=…`, which completeSignInFromUrl() turns into member tokens.
 */
async function authorize(extra: Record<string, string>, returnTo: string): Promise<never> {
  const { verifier, challenge } = await createPkce();
  const state = randomString(24);
  const pending: Pending = {
    verifier,
    state,
    redirectUri: redirectUri(),
    returnTo: safeReturnPath(returnTo),
    createdAt: Date.now(),
  };
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    throw new Error("Please allow site storage (or leave private browsing) to sign in.");
  }
  let url: string | undefined;
  try {
    const data = await wixFetch("/_api/redirects-api/v1/redirect-session", {
      auth: {
        authRequest: {
          redirectUri: pending.redirectUri,
          clientId: WIX.clientId,
          codeChallenge: challenge,
          codeChallengeMethod: "S256",
          responseMode: "fragment",
          responseType: "code",
          scope: "offline_access",
          state,
          ...extra,
        },
      },
    });
    url = data?.redirectSession?.fullUrl;
  } catch (e) {
    throw friendly(e, "Sign-in is unavailable right now. Please try again in a minute.");
  }
  if (!url || !url.startsWith("https://")) {
    throw new Error("Sign-in is unavailable right now. Please try again in a minute.");
  }
  window.location.assign(url);
  return new Promise<never>(() => {}); // the page is leaving
}

export type SignInResult =
  | { status: "none" }
  | { status: "signed-in"; returnTo: string }
  | { status: "error"; message: string };

/** Run once on page load: finishes a sign-in when Wix has just sent the customer back. */
export async function completeSignInFromUrl(): Promise<SignInResult> {
  const hash = window.location.hash.slice(1);
  if (!hash.includes("state=")) return { status: "none" };
  const params = new URLSearchParams(hash);
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return { status: "none" };

  // Take the code out of the address bar and history straight away.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
  const pending = takePending();

  if (error) {
    return {
      status: "error",
      message:
        error === "access_denied"
          ? "Sign-in was cancelled."
          : "We couldn't sign you in. Please try again.",
    };
  }
  if (
    !pending ||
    pending.state !== params.get("state") ||
    Date.now() - pending.createdAt > PENDING_TTL
  ) {
    return {
      status: "error",
      message: "That sign-in link expired or was opened in another tab. Please sign in again.",
    };
  }
  try {
    await exchangeTokens(
      {
        grantType: "authorization_code",
        code: code!,
        codeVerifier: pending.verifier,
        redirectUri: pending.redirectUri,
      },
      "member",
    );
  } catch {
    return { status: "error", message: "We couldn't finish signing you in. Please try again." };
  }
  return { status: "signed-in", returnTo: safeReturnPath(pending.returnTo) };
}

// ---------- Google ----------

export const signInWithGoogle = (returnTo = "/") =>
  authorize({ idp: GOOGLE_CONNECTION_ID }, returnTo);

/** Finishes a sign-in that was verified somewhere else (email code, password, phone server). */
export const finishWithSessionToken = (sessionToken: string, returnTo = "/") =>
  authorize({ sessionToken }, returnTo);

// ---------- email ----------

export type EmailStep = { step: "verify-email"; stateToken: string } | { step: "pending-approval" };

type AuthResponse = { state?: string; sessionToken?: string; stateToken?: string };

async function next(res: AuthResponse, returnTo: string): Promise<EmailStep> {
  if (res.state === "SUCCESS" && res.sessionToken)
    return finishWithSessionToken(res.sessionToken, returnTo);
  if (res.state === "REQUIRE_EMAIL_VERIFICATION" && res.stateToken)
    return { step: "verify-email", stateToken: res.stateToken };
  if (res.state === "REQUIRE_OWNER_APPROVAL") return { step: "pending-approval" };
  throw new Error("We couldn't sign you in. Please try again.");
}

export async function signInWithEmail(email: string, password: string, returnTo = "/") {
  let res: AuthResponse;
  try {
    res = await wixFetch("/_api/iam/authentication/v2/login", {
      loginId: { email: email.trim().toLowerCase() },
      password,
    });
  } catch (e) {
    const err = e as WixError;
    if (err?.code === "IP_ADDRESS_FILTERED") throw new Error(NETWORK_BLOCKED);
    // Same message whether the email is unknown or the password is wrong, so the form
    // can't be used to find out who has an account.
    if (err?.status && err.status < 500 && err.status !== 429)
      throw new Error(
        "That email and password don't match an account. Try again or reset your password.",
      );
    throw friendly(e, "Sign-in is unavailable right now. Please try again in a minute.");
  }
  return next(res, returnTo);
}

export type NewAccount = {
  firstName: string;
  email: string;
  password: string;
  phone: ParsedPhone | null;
  marketing: boolean;
};

export async function createAccount(a: NewAccount, returnTo = "/") {
  let res: AuthResponse;
  try {
    res = await wixFetch("/_api/iam/authentication/v2/register", {
      loginId: { email: a.email.trim().toLowerCase() },
      password: a.password,
      profile: {
        firstName: a.firstName.trim(),
        nickname: a.firstName.trim(),
        privacyStatus: "PRIVATE",
        subscription: a.marketing,
        ...(a.phone
          ? { phonesV2: [{ countryCode: a.phone.iso, phone: a.phone.national, tag: "MOBILE" }] }
          : {}),
      },
    });
  } catch (e) {
    const err = e as WixError;
    if (err?.code === "IP_ADDRESS_FILTERED") throw new Error(NETWORK_BLOCKED);
    const msg = (err?.message || "").toLowerCase();
    if (msg.includes("exist") || msg.includes("taken") || msg.includes("already"))
      throw new Error(
        "An account with this email already exists. Sign in instead, or reset your password.",
      );
    if (msg.includes("password"))
      throw new Error(
        "Choose a stronger password: at least 8 characters with letters and numbers.",
      );
    if (err?.status === 400) throw new Error("Please check your details and try again.");
    throw friendly(e, "Sign-up is unavailable right now. Please try again in a minute.");
  }
  return next(res, returnTo);
}

export async function verifyEmailCode(code: string, stateToken: string, returnTo = "/") {
  let res: AuthResponse;
  try {
    res = await wixFetch("/_api/iam/verification/v1/auth/verify", {
      code: code.trim(),
      stateToken,
    });
  } catch (e) {
    const err = e as WixError;
    if (err?.status && err.status < 500 && err.status !== 429)
      throw new Error("That code isn't right or has expired. Check your inbox and try again.");
    throw friendly(e, "We couldn't check the code right now. Please try again.");
  }
  return next(res, returnTo);
}

/** Always resolves, so the form never reveals whether an email has an account. */
export async function sendPasswordReset(email: string) {
  try {
    await wixFetch("/_api/iam/recovery/v1/send-email", {
      email: email.trim().toLowerCase(),
      redirect: { url: redirectUri(), clientId: WIX.clientId },
    });
  } catch (e) {
    if ((e as WixError)?.status === 429) throw friendly(e, "");
  }
}

// ---------- the signed-in customer ----------

export type Member = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  signedInWithPhone: boolean;
};

export const isSignedIn = () => currentRole() === "member";

export async function getMyMember(): Promise<Member | null> {
  if (!isSignedIn()) return null;
  try {
    const { member: m } = await wixFetch("/members/v1/members/my?fieldsets=FULL", undefined, "GET");
    if (!m?.id) return null;
    const loginEmail: string = m.loginEmail || "";
    const phoneOnly = loginEmail.endsWith(`@${PHONE_LOGIN.emailDomain}`);
    const phone: string | null = phoneOnly
      ? `+${loginEmail.split("@")[0].replace(/\D/g, "")}`
      : (m.contact?.phones?.[0] ?? null);
    const name =
      [m.contact?.firstName, m.contact?.lastName].filter(Boolean).join(" ") ||
      m.profile?.nickname ||
      "";
    return {
      id: m.id,
      name,
      email: phoneOnly ? null : loginEmail || null,
      phone,
      emailVerified: Boolean(m.loginEmailVerified),
      signedInWithPhone: phoneOnly,
    };
  } catch (e) {
    if ([401, 403, 404].includes((e as WixError)?.status)) clearSession();
    return null;
  }
}

/** Signs out here and on Wix, then comes back to the home page. */
export async function signOut() {
  let url: string | undefined;
  try {
    const data = await wixFetch("/_api/redirects-api/v1/redirect-session", {
      logout: { clientId: WIX.clientId },
      callbacks: { postFlowUrl: redirectUri() },
    });
    url = data?.redirectSession?.fullUrl;
  } catch {
    /* still sign out locally */
  }
  clearSession();
  if (url?.startsWith("https://")) window.location.assign(url);
  else window.location.replace("/");
}
