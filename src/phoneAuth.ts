// Sign in with a mobile number.
//
// 1. Firebase sends a one-time SMS code to the number (with invisible reCAPTCHA bot checks).
// 2. The customer types the code; Firebase confirms it and gives us a signed ID token.
// 3. Our server (/api/phone-signin) checks that token's signature with Google, then asks Wix
//    to sign that phone number's member in and returns a one-time Wix session token.
// 4. We finish exactly like an email sign-in (PKCE code exchange in auth.ts).
//
// Firebase is only downloaded when someone actually chooses phone sign-in.
import { PHONE_LOGIN } from "./site";
import { finishWithSessionToken, type ParsedPhone } from "./auth";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

let confirmation: ConfirmationResult | null = null;
let verifier: RecaptchaVerifier | null = null;

async function load() {
  const [{ initializeApp, getApps }, authModule] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app = getApps()[0] ?? initializeApp(PHONE_LOGIN.firebase);
  const auth = authModule.getAuth(app);
  auth.useDeviceLanguage();
  return { auth, authModule };
}

function firebaseMessage(e: unknown, fallback: string) {
  const code = (e as { code?: string })?.code || "";
  if (code.includes("invalid-phone-number")) return "That mobile number doesn't look right.";
  if (code.includes("too-many-requests") || code.includes("quota-exceeded"))
    return "Too many codes were requested. Please wait a few minutes and try again.";
  if (code.includes("invalid-verification-code"))
    return "That code isn't right. Check the SMS and try again.";
  if (code.includes("code-expired")) return "That code has expired. Ask for a new one.";
  if (code.includes("captcha")) return "We couldn't confirm you're not a robot. Please try again.";
  if (code.includes("network")) return "You seem to be offline. Check your connection.";
  return fallback;
}

/** Sends the SMS code. `buttonId` is the element the invisible reCAPTCHA attaches to. */
export async function sendPhoneCode(phone: ParsedPhone, buttonId: string) {
  if (!PHONE_LOGIN.enabled) throw new Error("Mobile sign-in isn't switched on yet.");
  const { auth, authModule } = await load();
  try {
    verifier?.clear();
    verifier = new authModule.RecaptchaVerifier(auth, buttonId, { size: "invisible" });
    confirmation = await authModule.signInWithPhoneNumber(auth, phone.e164, verifier);
  } catch (e) {
    verifier?.clear();
    verifier = null;
    throw new Error(firebaseMessage(e, "We couldn't send a code right now. Please try again."));
  }
}

/** Checks the SMS code, then signs the customer in to their LOKI KEYS account. */
export async function confirmPhoneCode(code: string, phone: ParsedPhone, returnTo = "/") {
  if (!confirmation) throw new Error("Ask for a code first.");
  const { auth, authModule } = await load();
  let idToken: string;
  try {
    const result = await confirmation.confirm(code.trim());
    idToken = await result.user.getIdToken(true);
  } catch (e) {
    throw new Error(firebaseMessage(e, "We couldn't check that code. Please try again."));
  }

  let data: { sessionToken?: string; error?: string } = {};
  let ok = false;
  try {
    const res = await fetch(PHONE_LOGIN.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ idToken, country: phone.iso }),
    });
    ok = res.ok;
    data = await res.json().catch(() => ({}));
  } finally {
    // Wix is the account of record; the Firebase session is only needed for this one check.
    await authModule.signOut(auth).catch(() => {});
    confirmation = null;
  }
  if (!ok || !data.sessionToken) {
    throw new Error(data.error || "We couldn't sign you in with that number. Please try again.");
  }
  return finishWithSessionToken(data.sessionToken, returnTo);
}
