// Consent-gated ad and analytics tags (Google tag for Google Ads / GA4, and Meta Pixel).
//
// Nothing loads until the visitor chooses. Without tag IDs set at build time
// (VITE_GOOGLE_TAG_ID, VITE_META_PIXEL_ID) none of this appears at all.
// A browser's Global Privacy Control signal counts as "do not sell or share" for ads
// (honoured as California and Colorado law requires), whatever the banner says.
import { useEffect, useState } from "react";

const env: Record<string, string | undefined> = import.meta.env ?? {};
export const TRACKING = {
  googleTagId: /^(G|AW|GT)-[A-Z0-9]{4,20}$/.test(env.VITE_GOOGLE_TAG_ID ?? "")
    ? env.VITE_GOOGLE_TAG_ID!
    : "",
  metaPixelId: /^\d{8,20}$/.test(env.VITE_META_PIXEL_ID ?? "") ? env.VITE_META_PIXEL_ID! : "",
};
export const trackingConfigured = Boolean(TRACKING.googleTagId || TRACKING.metaPixelId);

export type Choice = { analytics: boolean; ads: boolean; at: number };
const STORAGE_NAME = "loki-consent-v1";
const MAX_AGE = 365 * 24 * 60 * 60 * 1000;

export const gpcEnabled = () =>
  typeof navigator !== "undefined" &&
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

export function readChoice(): Choice | null {
  try {
    const c = JSON.parse(localStorage.getItem(STORAGE_NAME) || "null") as Choice | null;
    return c && Date.now() - c.at < MAX_AGE ? c : null;
  } catch {
    return null;
  }
}

function saveChoice(c: Choice) {
  try {
    localStorage.setItem(STORAGE_NAME, JSON.stringify(c));
  } catch {
    /* storage blocked: ask again next visit */
  }
}

type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
  _fbq?: unknown;
};

function addScript(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  s.referrerPolicy = "strict-origin-when-cross-origin";
  document.head.appendChild(s);
}

let googleLoaded = false;
let metaLoaded = false;

/** Applies a choice: loads only the tags it allows and updates Google consent mode. */
export function applyChoice(c: Choice) {
  const w = window as W;
  const ads = c.ads && !gpcEnabled();
  if (TRACKING.googleTagId && (c.analytics || ads)) {
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments);
      };
    const consent = {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: ads ? "granted" : "denied",
      ad_user_data: ads ? "granted" : "denied",
      ad_personalization: ads ? "granted" : "denied",
    };
    if (!googleLoaded) {
      w.gtag("consent", "default", consent);
      w.gtag("js", new Date());
      w.gtag("config", TRACKING.googleTagId, { anonymize_ip: true });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${TRACKING.googleTagId}`);
      googleLoaded = true;
    } else {
      w.gtag("consent", "update", consent);
    }
  } else if (googleLoaded && w.gtag) {
    w.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  if (TRACKING.metaPixelId) {
    if (ads && !metaLoaded) {
      // Same stub as Meta's official snippet: queue calls until fbevents.js takes over.
      type Fbq = NonNullable<W["fbq"]> & { callMethod?: (...a: unknown[]) => void };
      const fbq = ((...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue!.push(args);
      }) as Fbq;
      fbq.queue = [];
      fbq.loaded = true;
      fbq.version = "2.0";
      w.fbq = w.fbq || fbq;
      w._fbq = w.fbq;
      w.fbq("consent", "grant");
      w.fbq("init", TRACKING.metaPixelId);
      w.fbq("track", "PageView");
      addScript("https://connect.facebook.net/en_US/fbevents.js");
      metaLoaded = true;
    } else if (!ads && metaLoaded) {
      w.fbq?.("consent", "revoke");
    }
  }
}

export function ConsentBanner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const gpc = gpcEnabled();

  useEffect(() => {
    const c = readChoice();
    if (c) {
      setAnalytics(c.analytics);
      setAds(c.ads);
    }
  }, [open]);

  if (!trackingConfigured || !open) return null;

  const decide = (choice: Omit<Choice, "at">) => {
    const c = { ...choice, at: Date.now() };
    saveChoice(c);
    applyChoice(c);
    onClose();
  };

  return (
    <section className="consent" role="dialog" aria-modal="false" aria-label="Your privacy choices">
      <strong>Your privacy choices</strong>
      <p>
        We use cookies only if you allow them: analytics to see what works, and advertising to
        measure our Google and Meta ads. The store works fully without them.{" "}
        <a href="/privacy-policy.html#ads">Privacy policy</a>
      </p>
      {gpc && (
        <p className="consent-gpc">
          Your browser sends a Global Privacy Control signal, so advertising cookies stay off.
        </p>
      )}
      <div className="consent-options">
        <label>
          <input type="checkbox" checked disabled /> Essential (bag, sign-in)
        </label>
        <label>
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => setAnalytics(e.target.checked)}
          />{" "}
          Analytics
        </label>
        <label>
          <input
            type="checkbox"
            checked={ads && !gpc}
            disabled={gpc}
            onChange={(e) => setAds(e.target.checked)}
          />{" "}
          Advertising
        </label>
      </div>
      <div className="consent-actions">
        <button
          className="button auth-secondary"
          onClick={() => decide({ analytics: false, ads: false })}
        >
          Reject all
        </button>
        <button
          className="button auth-secondary"
          onClick={() => decide({ analytics, ads: ads && !gpc })}
        >
          Save choices
        </button>
        <button className="button primary" onClick={() => decide({ analytics: true, ads: !gpc })}>
          Accept all
        </button>
      </div>
    </section>
  );
}
