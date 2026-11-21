// One place for the business details shown across the site and the legal pages.
// Change a value here and every page that reads it follows.
export const SITE = {
  name: "LOKI KEYS",
  email: "support@lokikeys.com",
  supportHours: "Monday to Saturday, 10 AM–7 PM IST",
  replyTime: "We usually reply the same working day.",
  country: "India",
  url: "https://ditch-mess-23616146.figma.site",
} as const;

// Wix store that takes payment and fulfils orders. The client id is a public
// identifier (it only starts shopper and member sessions), so it is safe in page code.
export const WIX = {
  clientId: "319c8e61-f3a1-431b-a0b3-822f1ddaa362",
  storesAppId: "215238eb-22a5-4c36-9e7b-e7c08025e04e",
  api: "https://www.wixapis.com",
} as const;

// Optional sign-in with a mobile number (one-time SMS code). It stays hidden until the
// Firebase web keys below are set as environment variables at build time and the
// /api/phone-signin server function is deployed (see README → "Phone sign-in").
// Firebase web keys are public identifiers, not secrets; the Wix API key lives only on the server.
const env: Record<string, string | undefined> = import.meta.env ?? {};
const firebase = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "",
  appId: env.VITE_FIREBASE_APP_ID ?? "",
};
export const PHONE_LOGIN = {
  enabled: Boolean(firebase.apiKey && firebase.projectId && firebase.authDomain),
  firebase,
  endpoint: env.VITE_PHONE_SIGNIN_ENDPOINT || "/api/phone-signin",
  // Phone-only accounts get a placeholder login email on this domain; it never receives mail.
  emailDomain: env.VITE_PHONE_LOGIN_EMAIL_DOMAIN || "phone.lokikeys.com",
} as const;
