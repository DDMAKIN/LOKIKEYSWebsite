import { useEffect, useRef, useState } from "react";
import {
  COUNTRIES,
  EMAIL_PATTERN,
  createAccount,
  parsePhone,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  verifyEmailCode,
  type Member,
  type ParsedPhone,
} from "./auth";
import { PHONE_LOGIN, SITE } from "./site";

type Mode =
  | "signin"
  | "signup"
  | "verify"
  | "reset"
  | "reset-sent"
  | "pending"
  | "phone"
  | "phone-code"
  | "account";

const MAX_FAILURES = 5;
const LOCK_MS = 30_000;

/** At least 8 characters with a letter and a number (Wix enforces its own rules too). */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password.length > 100) return "Use 100 characters or fewer.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Mix letters and numbers.";
  return null;
}

function Glyph({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
const MAIL = "M3 5h18v14H3zM3 6l9 7 9-7";
const PHONE = "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2";
const BACK = "M20 12H5m6-6-6 6 6 6";
const LOCK = "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4";

export function AuthPanel({
  member,
  initialMode,
  onClose,
}: {
  member: Member | null;
  initialMode?: Mode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>(member ? "account" : initialMode || "signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("IN");
  const [phoneInput, setPhoneInput] = useState("");
  const [marketing, setMarketing] = useState(false);
  const [code, setCode] = useState("");
  const [stateToken, setStateToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [failures, setFailures] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [verifiedPhone, setVerifiedPhone] = useState<ParsedPhone | null>(null);
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError("");
    firstField.current?.focus();
  }, [mode]);

  const go = (next: Mode) => {
    setError("");
    setCode("");
    setMode(next);
  };

  // Turns any thrown error into the message shown above the button, and slows down
  // repeated wrong guesses on this device (Wix also rate-limits on its side).
  async function run(task: () => Promise<unknown>, countFailure = false) {
    if (busy) return;
    if (Date.now() < lockedUntil) {
      setError("Too many tries. Please wait 30 seconds and try again.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      if (countFailure) {
        const n = failures + 1;
        setFailures(n);
        if (n >= MAX_FAILURES) {
          setLockedUntil(Date.now() + LOCK_MS);
          setFailures(0);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  const returnTo = typeof window === "undefined" ? "/" : window.location.pathname;
  const emailOk = EMAIL_PATTERN.test(email.trim());

  const afterEmailStep = (r: { step: string; stateToken?: string }) => {
    if (r.step === "verify-email" && r.stateToken) {
      setStateToken(r.stateToken);
      go("verify");
    } else if (r.step === "pending-approval") go("pending");
  };

  const submitSignIn = () =>
    run(async () => {
      if (!emailOk) throw new Error("Enter the email address you signed up with.");
      if (!password) throw new Error("Enter your password.");
      afterEmailStep(await signInWithEmail(email, password, returnTo));
    }, true);

  const submitSignUp = () =>
    run(async () => {
      if (!firstName.trim()) throw new Error("Tell us your first name.");
      if (!emailOk) throw new Error("Enter a valid email address. Your keys are sent there.");
      const phone = parsePhone(country, phoneInput);
      if (!phone) throw new Error("Enter a valid mobile number for the country you picked.");
      const problem = passwordProblem(password);
      if (problem) throw new Error(problem);
      afterEmailStep(
        await createAccount({ firstName, email, password, phone, marketing }, returnTo),
      );
    });

  const submitCode = () =>
    run(async () => {
      if (!/^\d{4,8}$/.test(code.trim())) throw new Error("Enter the code from the email.");
      afterEmailStep(await verifyEmailCode(code, stateToken, returnTo));
    }, true);

  const submitReset = () =>
    run(async () => {
      if (!emailOk) throw new Error("Enter the email address you signed up with.");
      await sendPasswordReset(email);
      go("reset-sent");
    });

  const submitPhone = () =>
    run(async () => {
      const phone = parsePhone(country, phoneInput);
      if (!phone) throw new Error("Enter a valid mobile number for the country you picked.");
      const { sendPhoneCode } = await import("./phoneAuth");
      await sendPhoneCode(phone, "phone-send-button");
      setVerifiedPhone(phone);
      go("phone-code");
    });

  const submitPhoneCode = () =>
    run(async () => {
      if (!verifiedPhone) throw new Error("Ask for a code first.");
      if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the 6-digit code from the SMS.");
      const { confirmPhoneCode } = await import("./phoneAuth");
      await confirmPhoneCode(code, verifiedPhone, returnTo);
    }, true);

  const onSubmit = (handler: () => void) => (e: { preventDefault: () => void }) => {
    e.preventDefault();
    handler();
  };

  const errorBox = error ? (
    <p className="auth-error" role="alert">
      {error}
    </p>
  ) : null;

  const phoneFields = (
    <div className="auth-field">
      <label htmlFor="auth-phone">Mobile number</label>
      <div className="auth-phone">
        <select
          aria-label="Country code"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.iso} +{c.dial}
            </option>
          ))}
        </select>
        <input
          id="auth-phone"
          ref={mode === "phone" ? firstField : undefined}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={country === "IN" ? "98765 43210" : "Mobile number"}
          value={phoneInput}
          maxLength={20}
          onChange={(e) => setPhoneInput(e.target.value)}
        />
      </div>
    </div>
  );

  const providerButtons = (
    <div className="auth-providers">
      <button
        type="button"
        className="auth-provider"
        disabled={busy}
        onClick={() => run(() => signInWithGoogle(returnTo))}
      >
        <span className="auth-provider-mark" aria-hidden="true">
          G
        </span>
        Continue with Google
      </button>
      {PHONE_LOGIN.enabled && (
        <button type="button" className="auth-provider" disabled={busy} onClick={() => go("phone")}>
          <Glyph d={PHONE} />
          Continue with mobile number
        </button>
      )}
      <div className="auth-divider">
        <span>or use your email</span>
      </div>
    </div>
  );

  const passwordField = (autoComplete: string) => (
    <div className="auth-field">
      <label htmlFor="auth-password">Password</label>
      <div className="auth-password">
        <input
          id="auth-password"
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          value={password}
          maxLength={100}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="auth-reveal"
          aria-pressed={showPassword}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  const backLink = (to: Mode, label = "Back") => (
    <button type="button" className="auth-back" onClick={() => go(to)}>
      <Glyph d={BACK} size={15} /> {label}
    </button>
  );

  if (mode === "account" && member) {
    const initials =
      (member.name || member.email || member.phone || "L")
        .split(/[\s@+]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("") || "L";
    return (
      <div className="auth-panel">
        <div className="eyebrow">YOUR LOKI ACCOUNT</div>
        <div className="account-card">
          <span className="account-avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <strong>{member.name || "LOKI customer"}</strong>
            {member.email && <span>{member.email}</span>}
            {member.phone && <span>{member.phone}</span>}
          </div>
        </div>
        <ul className="account-facts">
          <li>Orders you place while signed in are saved to this account.</li>
          <li>Your license keys and receipts are emailed after payment.</li>
          <li>
            Need help with an order? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </li>
        </ul>
        {errorBox}
        <div className="auth-actions">
          <button type="button" className="button primary" onClick={onClose}>
            Continue shopping
          </button>
          <button
            type="button"
            className="button auth-secondary"
            disabled={busy}
            onClick={() => run(signOut)}
          >
            Sign out
          </button>
        </div>
        {member.email && (
          <button
            type="button"
            className="auth-link"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await sendPasswordReset(member.email!);
                setError("");
                setMode("reset-sent");
                setEmail(member.email!);
              })
            }
          >
            Email me a link to change my password
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="auth-panel">
      {(mode === "signin" || mode === "signup") && (
        <>
          <div className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "JOIN LOKI KEYS"}</div>
          <h2>{mode === "signin" ? "Sign in to your account." : "Create your account."}</h2>
          <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signin"}
              onClick={() => go("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "signup"}
              onClick={() => go("signup")}
            >
              Create account
            </button>
          </div>
          {providerButtons}
        </>
      )}

      {mode === "signin" && (
        <form className="auth-form" onSubmit={onSubmit(submitSignIn)} noValidate>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={firstField}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {passwordField("current-password")}
          <button type="button" className="auth-link auth-forgot" onClick={() => go("reset")}>
            Forgot password?
          </button>
          {errorBox}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {mode === "signup" && (
        <form className="auth-form" onSubmit={onSubmit(submitSignUp)} noValidate>
          <div className="auth-field">
            <label htmlFor="auth-name">First name</label>
            <input
              id="auth-name"
              ref={firstField}
              autoComplete="given-name"
              value={firstName}
              maxLength={60}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {phoneFields}
          {passwordField("new-password")}
          <p className="auth-hint">
            <Glyph d={LOCK} size={13} /> At least 8 characters, with letters and numbers.
          </p>
          <label className="auth-check">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            Send me deals and new arrivals (optional)
          </label>
          {errorBox}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? "Creating your account…" : "Create account"}
          </button>
          <p className="auth-legal">
            By creating an account you agree to our <a href="/terms.html">terms</a> and{" "}
            <a href="/privacy-policy.html">privacy policy</a>.
          </p>
        </form>
      )}

      {mode === "verify" && (
        <form className="auth-form" onSubmit={onSubmit(submitCode)} noValidate>
          {backLink("signup")}
          <div className="eyebrow">CHECK YOUR INBOX</div>
          <h2>Confirm your email.</h2>
          <p className="auth-copy">
            <Glyph d={MAIL} size={15} /> We sent a code to <strong>{email.trim()}</strong>. Enter it
            below to finish.
          </p>
          <div className="auth-field">
            <label htmlFor="auth-code">Code from the email</label>
            <input
              id="auth-code"
              ref={firstField}
              className="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {errorBox}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? "Checking…" : "Confirm and sign in"}
          </button>
        </form>
      )}

      {mode === "reset" && (
        <form className="auth-form" onSubmit={onSubmit(submitReset)} noValidate>
          {backLink("signin")}
          <div className="eyebrow">LOCKED OUT?</div>
          <h2>Reset your password.</h2>
          <p className="auth-copy">
            Enter your account email and we’ll send you a link to choose a new password.
          </p>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={firstField}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {errorBox}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      {mode === "reset-sent" && (
        <div className="auth-form">
          <div className="eyebrow">LINK SENT</div>
          <h2>Check your email.</h2>
          <p className="auth-copy">
            If <strong>{email.trim()}</strong> has a LOKI KEYS account, a password reset link is on
            its way. It can take a couple of minutes. Check your spam folder too.
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => go(member ? "account" : "signin")}
          >
            {member ? "Back to my account" : "Back to sign in"}
          </button>
        </div>
      )}

      {mode === "pending" && (
        <div className="auth-form">
          <div className="eyebrow">ALMOST THERE</div>
          <h2>Your account is waiting for approval.</h2>
          <p className="auth-copy">
            We’ll email you as soon as it’s approved. Questions? Write to{" "}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
          <button type="button" className="button primary" onClick={onClose}>
            Keep shopping
          </button>
        </div>
      )}

      {mode === "phone" && (
        <form className="auth-form" onSubmit={onSubmit(submitPhone)} noValidate>
          {backLink("signin")}
          <div className="eyebrow">SIGN IN WITH YOUR MOBILE</div>
          <h2>We’ll text you a code.</h2>
          <p className="auth-copy">
            New here? Your account is created automatically. Standard SMS rates may apply.
          </p>
          {phoneFields}
          {errorBox}
          <button id="phone-send-button" className="button primary auth-submit" disabled={busy}>
            {busy ? "Sending code…" : "Send code"}
          </button>
        </form>
      )}

      {mode === "phone-code" && (
        <form className="auth-form" onSubmit={onSubmit(submitPhoneCode)} noValidate>
          {backLink("phone", "Use a different number")}
          <div className="eyebrow">CHECK YOUR MESSAGES</div>
          <h2>Enter the 6-digit code.</h2>
          <p className="auth-copy">
            <Glyph d={PHONE} size={15} /> Sent to <strong>{verifiedPhone?.e164}</strong>.
          </p>
          <div className="auth-field">
            <label htmlFor="auth-code">SMS code</label>
            <input
              id="auth-code"
              ref={firstField}
              className="auth-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {errorBox}
          <button className="button primary auth-submit" disabled={busy}>
            {busy ? "Signing in…" : "Verify and sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
