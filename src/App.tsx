import { useEffect, useRef, useState } from "react";
import { SoftwareFinder, ProductComparison } from "./ShoppingTools";
import { CyberCore } from "./CyberCore";
import {
  RewardWheel,
  pickReward,
  wheelRotation,
  calculateDiscount,
  type Reward,
} from "./RewardWheel";

type IconName =
  | "arrow"
  | "search"
  | "bag"
  | "shield"
  | "bolt"
  | "check"
  | "headphones"
  | "chevron"
  | "close"
  | "plus"
  | "minus"
  | "key"
  | "globe"
  | "grid"
  | "menu"
  | "mail"
  | "download";
function Icon({
  name,
  size = 20,
  ...props
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    bag: (
      <>
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 8V6a4 4 0 0 1 8 0v2" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6l8-3Z" />
        <path d="m8.5 11.5 2.5 2.5 4.5-4.5" />
      </>
    ),
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    headphones: (
      <>
        <path d="M4 14v-3a8 8 0 0 1 16 0v3M4 12h3v7H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Zm16 0h-3v7h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2ZM18 20c0 2-4 2-6 2" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    plus: <path d="M5 12h14M12 5v14" />,
    minus: <path d="M5 12h14" />,
    key: (
      <>
        <circle cx="8" cy="9" r="5" />
        <path d="m12 13 8 8m-4-4 3-3m-6 0 3-3" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
  };
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
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

export type Product = {
  id: number;
  brand: string;
  name: string;
  edition: string;
  price: number;
  category: string;
  devices: string;
  term: string;
  region: string;
  color: string;
  badge?: string;
  platforms: string;
};
const products: Product[] = [
  {
    id: 1,
    brand: "Norton",
    name: "Norton 360 Standard",
    edition: "360 Standard",
    price: 43.5,
    category: "Antivirus",
    devices: "1 device",
    term: "1 year",
    region: "USA / Canada",
    color: "norton",
    badge: "POPULAR PICK",
    platforms: "Windows, macOS, Android & iOS",
  },
  {
    id: 2,
    brand: "McAfee",
    name: "McAfee Internet Security",
    edition: "Internet Security",
    price: 17.95,
    category: "Antivirus",
    devices: "3 devices",
    term: "1 year",
    region: "See activation guide",
    color: "mcafee",
    badge: "GREAT VALUE",
    platforms: "Windows",
  },
  {
    id: 3,
    brand: "Malwarebytes",
    name: "Malwarebytes Premium",
    edition: "Premium",
    price: 39.99,
    category: "Antivirus",
    devices: "1 device",
    term: "1 year",
    region: "See activation guide",
    color: "malware",
    platforms: "Windows, macOS, Android & iOS",
  },
  {
    id: 4,
    brand: "Microsoft",
    name: "Microsoft Office Home 2024",
    edition: "Office Home 2024",
    price: 29.0,
    category: "Office & Productivity",
    devices: "1 PC / Mac",
    term: "One-time purchase",
    region: "See activation guide",
    color: "office",
    badge: "WORK SMARTER",
    platforms: "Windows & macOS",
  },
  {
    id: 5,
    brand: "Watchdog",
    name: "Watchdog Anti-Malware",
    edition: "Anti-Malware",
    price: 39.99,
    category: "Antivirus",
    devices: "1 PC",
    term: "3 years",
    region: "See activation guide",
    color: "watchdog",
    platforms: "Windows",
  },
  {
    id: 6,
    brand: "Norton",
    name: "Norton 360 Deluxe",
    edition: "360 Deluxe",
    price: 19.95,
    category: "Antivirus",
    devices: "3 devices",
    term: "1 year",
    region: "Europe",
    color: "norton",
    platforms: "Windows, macOS, Android & iOS",
  },
  {
    id: 7,
    brand: "McAfee",
    name: "McAfee Total Protection",
    edition: "Total Protection",
    price: 99.99,
    category: "Antivirus",
    devices: "10 devices",
    term: "1 year",
    region: "Europe",
    color: "mcafee",
    platforms: "Windows, macOS, Android & iOS",
  },
  {
    id: 8,
    brand: "Norton",
    name: "Norton 360 for Gamers",
    edition: "360 for Gamers",
    price: 99.99,
    category: "Gaming",
    devices: "3 devices",
    term: "1 year",
    region: "Global",
    color: "norton",
    platforms: "Windows, macOS, Android & iOS",
  },
];
const money = (value: number) => `$${value.toFixed(2)}`;
const categories = [
  { label: "All software", icon: "grid" },
  { label: "Antivirus", icon: "shield" },
  { label: "Office & Productivity", icon: "grid" },
  { label: "Gaming", icon: "bolt" },
] as const;

function BrandMark({ brand }: { brand: string }) {
  if (brand === "Microsoft")
    return (
      <span className="microsoft-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  if (brand === "Norton") return <span className="norton-mark">✓</span>;
  if (brand === "McAfee")
    return (
      <svg viewBox="0 0 32 36" className="mcafee-mark" fill="none" aria-hidden="true">
        <path d="M3 3v20l13 10 13-10V3l-13 8L3 3Z" stroke="currentColor" strokeWidth="4" />
        <path d="M10 10v10l6 5 6-5V10" stroke="currentColor" strokeWidth="3" />
      </svg>
    );
  if (brand === "Malwarebytes") return <span className="malware-mark">M</span>;
  return <Icon name="shield" size={35} />;
}

function ProductBox({ product }: { product: Product }) {
  return (
    <div className={`software-box ${product.color}`}>
      <div className="box-brand">
        <BrandMark brand={product.brand} />
        <span>{product.brand}</span>
      </div>
      <div className="box-edition">{product.edition}</div>
      <div className="box-art">
        {product.brand === "Microsoft" ? (
          <div className="office-art">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <Icon name={product.brand === "Malwarebytes" ? "shield" : "check"} size={65} />
        )}
      </div>
      <div className="box-bottom">
        <span>{product.devices}</span>
        <span>{product.term}</span>
      </div>
    </div>
  );
}

const faqs = [
  [
    "How will I receive my license key?",
    "LOKI KEYS is a digital-only software store. When live checkout is available, your license key and step-by-step activation instructions will be delivered to the email address you use at checkout. There is no physical shipping.",
  ],
  [
    "How do I activate my software?",
    "Download your software directly from the publisher’s official website, sign in or create your publisher account, and enter your license key. Always check the supported devices and activation region in the product details before ordering.",
  ],
  [
    "Will my key work in my country?",
    "Some licenses are region-specific. Open the product details to check the activation region. If a region is not confirmed, verify compatibility before purchasing; never use a VPN to bypass a license’s region restrictions.",
  ],
  [
    "What if I need help with activation?",
    "Start with our activation guide below. Check that the software edition, operating system, device limit, and region match your license. Keep your order details and any error message handy when contacting the seller.",
  ],
];

export default function App() {
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [category, setCategory] = useState("All software");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [showAll, setShowAll] = useState(false);
  const [platform, setPlatform] = useState("Any device");
  const [budget, setBudget] = useState(100);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [rewardApplied, setRewardApplied] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [recentIds, setRecentIds] = useState<number[]>([]);
  const spinLock = useRef(false);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [info, setInfo] = useState<
    "guide" | "about" | "checkout" | "privacy" | "terms" | "finder" | "compare" | "rewards" | null
  >(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlay = cartOpen || selected !== null || info !== null;
  useEffect(
    () => () => {
      if (spinTimer.current) clearTimeout(spinTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (selected)
      setRecentIds((current) =>
        [selected.id, ...current.filter((id) => id !== selected.id)].slice(0, 4),
      );
  }, [selected]);
  const spinWheel = () => {
    if (spinLock.current || reward) return;
    spinLock.current = true;
    const prize = pickReward(Math.random());
    setSpinning(true);
    setRotation(wheelRotation(prize.index));
    const reducedMotion =
      !effectsEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    spinTimer.current = setTimeout(
      () => {
        setReward({ percent: prize.percent, code: prize.code });
        setSpinning(false);
      },
      reducedMotion ? 50 : 4600,
    );
  };
  const openRewards = () => {
    setCartOpen(false);
    setSelected(null);
    setInfo("rewards");
  };
  useEffect(() => {
    document.title = "LOKI KEYS — Your digital world, unlocked.";
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.name = "description";
      document.head.appendChild(description);
    }
    description.content =
      "Explore antivirus and productivity software at LOKI KEYS. Find your next digital essential from Norton, McAfee, Microsoft, and more.";
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!overlay) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setSelected(null);
        setInfo(null);
      }
      if (e.key === "Tab") {
        const dialog = document.querySelector('[role="dialog"]');
        const elements = dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), summary, [tabindex="0"]',
        );
        if (!elements?.length) return;
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [overlay]);
  const goToShop = (nextCategory = "All software") => {
    setCategory(nextCategory);
    setMobileNav(false);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };
  const addToCart = (product: Product) => {
    setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
    setToast(`${product.name} added to your bag`);
  };
  const changeQuantity = (id: number, amount: number) =>
    setCart((current) => {
      const next = { ...current, [id]: (current[id] || 0) + amount };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  const toggleCompare = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds((current) => current.filter((value) => value !== id));
    } else if (compareIds.length < 3) {
      setCompareIds((current) => [...current, id]);
    } else {
      setToast("Compare up to 3 products. Remove one to add another.");
    }
  };
  const resetFilters = () => {
    setSearch("");
    setCategory("All software");
    setPlatform("Any device");
    setBudget(100);
    setSort("featured");
  };
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
  const discounted = calculateDiscount(total, rewardApplied && reward ? reward.percent : 0);
  const filtered = products
    .filter(
      (p) =>
        (category === "All software" || p.category === category) &&
        (platform === "Any device" || p.platforms.includes(platform)) &&
        p.price <= budget &&
        `${p.name} ${p.platforms}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : a.id - b.id,
    );
  const displayed =
    showAll ||
    search ||
    category !== "All software" ||
    platform !== "Any device" ||
    budget < 100 ||
    sort !== "featured"
      ? filtered
      : filtered.slice(0, 4);
  const closeOverlay = () => {
    setCartOpen(false);
    setSelected(null);
    setInfo(null);
    setCopied(false);
  };

  return (
    <div className={`cyber-app ${effectsEnabled ? "" : "effects-paused"}`}>
      <div className="announcement">
        <span>
          <Icon name="bolt" size={13} /> Big protection. Smarter prices.
        </span>
        <button className="announcement-spin" onClick={openRewards}>
          Your lucky unlock: spin for up to 20% off <Icon name="arrow" size={14} />
        </button>
        <span className="announcement-right">
          <Icon name="globe" size={13} /> USD $
        </span>
      </div>
      <header className="header">
        <div className="container header-inner">
          <a className="logo" href="#" aria-label="LOKI KEYS home">
            <span className="logo-symbol">
              <Icon name="key" size={23} />
            </span>
            LOKI<span className="logo-light">KEYS</span>
            <span className="logo-dot">.</span>
          </a>
          <nav className={mobileNav ? "main-nav is-open" : "main-nav"} aria-label="Main navigation">
            <button className="nav-active" onClick={() => goToShop()}>
              Shop software <Icon name="chevron" size={14} />
            </button>
            <button onClick={() => setInfo("guide")}>How it works</button>
            <button onClick={() => setInfo("about")}>Why Loki?</button>
            <a href="#help" onClick={() => setMobileNav(false)}>
              Help center
            </a>
          </nav>
          <div className="header-actions">
            <button
              className="effects-toggle"
              aria-label="Animated visual effects"
              aria-pressed={effectsEnabled}
              onClick={() => setEffectsEnabled(!effectsEnabled)}
            >
              <Icon name="bolt" size={14} />
              <span>FX {effectsEnabled ? "ON" : "OFF"}</span>
            </button>
            <button
              className="icon-button header-search"
              aria-label="Search software"
              onClick={() => {
                goToShop();
                document.getElementById("product-search")?.focus();
              }}
            >
              <Icon name="search" />
            </button>
            <span className="header-divider" />
            <button className="bag-button" onClick={() => setCartOpen(true)}>
              <Icon name="bag" size={20} />
              <span>Your bag</span>
              <b>{cartCount}</b>
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Icon name={mobileNav ? "close" : "menu"} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> GO BEYOND. STAY PROTECTED.
              </div>
              <h1>
                Your digital edge.
                <br />
                <span>Unlocked.</span>
                <svg
                  className="heading-spark"
                  width="43"
                  height="43"
                  viewBox="0 0 40 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  aria-hidden="true"
                >
                  <path d="M20 2v36M2 20h36M7 7l26 26M7 33 33 7" />
                </svg>
              </h1>
              <p>
                Upgrade your setup. Not your spending.
                <br className="desktop-break" /> Genuine software keys for your next level.
              </p>
              <div className="hero-actions">
                <button className="button primary" onClick={() => goToShop()}>
                  Find your software <Icon name="arrow" size={18} />
                </button>
                <button className="text-button" onClick={() => setInfo("finder")}>
                  Help me choose{" "}
                  <span className="circle-arrow">
                    <Icon name="arrow" size={14} />
                  </span>
                </button>
              </div>
              <div className="hero-assurance">
                <span>
                  <Icon name="shield" size={15} /> Genuine licenses
                </span>
                <i />
                <span>
                  <Icon name="bolt" size={15} /> Instant digital delivery
                </span>
              </div>
            </div>
            <div
              className="hero-visual"
              onPointerMove={(e) => {
                const bounds = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--pointer-x",
                  `${((e.clientX - bounds.left) / bounds.width - 0.5) * 12}deg`,
                );
                e.currentTarget.style.setProperty(
                  "--pointer-y",
                  `${-((e.clientY - bounds.top) / bounds.height - 0.5) * 10}deg`,
                );
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--pointer-x", "0deg");
                e.currentTarget.style.setProperty("--pointer-y", "0deg");
              }}
            >
              <CyberCore />
              <div className="floating-label label-top">
                <span className="label-icon">
                  <Icon name="shield" size={20} />
                </span>
                <div>
                  <strong>Real keys. Real peace of mind.</strong>
                  <small>Activate with the official publisher</small>
                </div>
              </div>
              <div className="floating-label label-bottom">
                <span className="label-icon">
                  <Icon name="bolt" size={19} />
                </span>
                <div>
                  <strong>Ready when you are.</strong>
                  <small>Delivered straight to your inbox</small>
                </div>
                <span className="live-dot" />
              </div>
              <span className="visual-caption">YOUR NEXT LEVEL STARTS WITH A KEY_</span>
            </div>
          </div>
        </section>

        <section className="brand-strip container" aria-label="Software brands">
          <span className="brand-strip-label">
            BIG NAMES.
            <br />
            <strong>BETTER VALUE.</strong>
          </span>
          <div className="partner norton-partner">
            <BrandMark brand="Norton" />
            <span>Norton</span>
          </div>
          <div className="partner">
            <BrandMark brand="McAfee" />
            <span>McAfee</span>
          </div>
          <div className="partner microsoft-partner">
            <BrandMark brand="Microsoft" />
            <span>Microsoft</span>
          </div>
          <div className="partner malware-partner">
            <BrandMark brand="Malwarebytes" />
            <span>malwarebytes</span>
          </div>
          <div className="partner watchdog-partner">
            <Icon name="shield" size={26} />
            <span>WATCHDOG</span>
          </div>
        </section>

        <section className="lucky-banner container" aria-label="Lucky unlock rewards">
          <div className="lucky-banner-symbol" aria-hidden="true">
            ↻
          </div>
          <div>
            <span className="eyebrow">BONUS ROUND // EVERY SPIN WINS</span>
            <h2>
              {reward
                ? `Your ${reward.percent}% reward is waiting.`
                : "Hack your price. Unlock up to 20% off."}
            </h2>
            <p>
              {rewardApplied
                ? "Reward applied. Your preview savings grow with your bag."
                : "One spin. Six possible rewards. Your next upgrade, for less."}
            </p>
          </div>
          <button className="button primary" onClick={openRewards}>
            {reward ? "View my reward" : "Spin & unlock"}
            <Icon name="arrow" size={17} />
          </button>
        </section>
        <section className="shop-section container" id="shop">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE SOFTWARE VAULT // SELECT YOUR UPGRADE</div>
              <h2>Build your next-level setup.</h2>
              <p>Trusted software. Instant access. Zero compromises.</p>
            </div>
            <button
              className="text-button view-all-top"
              onClick={() => {
                setShowAll(!showAll);
                setCategory("All software");
                setSearch("");
              }}
            >
              {showAll ? "Show featured" : "Explore all software"}
              <Icon name="arrow" size={18} />
            </button>
          </div>
          <div className="shop-toolbar">
            <div className="category-tabs" role="group" aria-label="Product categories">
              {categories.map((c) => (
                <button
                  key={c.label}
                  className={category === c.label ? "category-tab active" : "category-tab"}
                  onClick={() => setCategory(c.label)}
                >
                  <Icon name={c.icon} size={16} />
                  {c.label}
                </button>
              ))}
            </div>
            <div className="search-field">
              <Icon name="search" size={17} />
              <input
                id="product-search"
                aria-label="Search software"
                placeholder="Find your software..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="discovery-bar">
            <div className="device-filter">
              <Icon name="grid" size={15} />
              <label htmlFor="platform-filter">Made for</label>
              <select
                id="platform-filter"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                {["Any device", "Windows", "macOS", "Android", "iOS"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
            <label className="budget-filter" htmlFor="budget-filter">
              <span>
                My budget <strong>Up to ${budget}</strong>
              </span>
              <input
                id="budget-filter"
                type="range"
                min="20"
                max="100"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </label>
            <button className="finder-shortcut" onClick={() => setInfo("finder")}>
              <Icon name="key" size={16} />
              <span>Not sure? Find my match</span>
              <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="results-bar">
            <span aria-live="polite">
              {platform !== "Any device" || budget < 100
                ? `${filtered.length} matching ${filtered.length === 1 ? "license" : "licenses"}`
                : search
                  ? `${filtered.length} results for “${search}”`
                  : category === "All software"
                    ? "Handpicked for your digital life"
                    : `${filtered.length} ${category.toLowerCase()} essentials`}
            </span>
            {(search ||
              category !== "All software" ||
              platform !== "Any device" ||
              budget < 100) && (
              <button className="reset-filter" onClick={resetFilters}>
                Reset filters <Icon name="close" size={12} />
              </button>
            )}
            <label>
              Sort by:{" "}
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="product-grid">
            {displayed.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  className={`product-visual ${product.color}-bg`}
                  onClick={() => setSelected(product)}
                  aria-label={`View ${product.name} details`}
                >
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <ProductBox product={product} />
                  <span className="quick-view">
                    View details <Icon name="arrow" size={14} />
                  </span>
                </button>
                <div className="product-content">
                  <div className="product-type">{product.category}</div>
                  <button className="product-title" onClick={() => setSelected(product)}>
                    {product.name}
                  </button>
                  <p className="product-meta">
                    {product.devices}
                    <span>•</span>
                    {product.term}
                  </p>
                  <div className="product-price-row">
                    <div className="price">
                      {money(product.price)}
                      <span>USD</span>
                    </div>
                    <button
                      className="add-button"
                      aria-label={`Add ${product.name} to bag`}
                      onClick={() => addToCart(product)}
                    >
                      <Icon name={cart[product.id] ? "check" : "plus"} size={20} />
                    </button>
                  </div>
                  <label
                    className={`compare-check ${compareIds.includes(product.id) ? "is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={compareIds.includes(product.id)}
                      onChange={() => toggleCompare(product.id)}
                    />
                    <span>
                      {compareIds.includes(product.id)
                        ? "Added to comparison"
                        : "Compare this software"}
                    </span>
                  </label>
                  <div className="delivery-line">
                    <span /> Digital delivery <span className="delivery-separator">·</span> License
                    key
                  </div>
                </div>
              </article>
            ))}
          </div>
          {displayed.length === 0 && (
            <div className="empty-results">
              <Icon name="search" size={30} />
              <h3>No keys found. Let’s try another search.</h3>
              <p>Try a brand like Norton or an operating system like Windows.</p>
              <button className="button primary" onClick={resetFilters}>
                Reset filters
              </button>
            </div>
          )}
          {!showAll &&
            !search &&
            category === "All software" &&
            platform === "Any device" &&
            budget === 100 &&
            sort === "featured" && (
              <button className="button outline explore-button" onClick={() => setShowAll(true)}>
                There’s more to unlock <Icon name="arrow" size={17} />
              </button>
            )}
        </section>

        {recentIds.length > 0 && (
          <section className="recent-section container">
            <div className="recent-heading">
              <div>
                <span className="eyebrow">PICK UP WHERE YOU LEFT OFF.</span>
                <h2>Still on your mind?</h2>
              </div>
              <button onClick={() => setRecentIds([])}>Clear history</button>
            </div>
            <div className="recent-products">
              {recentIds.map((id) => {
                const product = products.find((p) => p.id === id)!;
                return (
                  <button key={id} onClick={() => setSelected(product)} className="recent-product">
                    <span className={`recent-icon ${product.color}-bg`}>
                      <BrandMark brand={product.brand} />
                    </span>
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        {product.devices} · {product.term}
                      </small>
                      <b>
                        {money(product.price)} <span>Take another look →</span>
                      </b>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        <section className="benefits container">
          {[
            {
              icon: "shield",
              title: "Genuine. Always.",
              text: "Real software keys. Activate directly with the official publisher.",
            },
            {
              icon: "bolt",
              title: "In your inbox. In an instant.",
              text: "No shipping. No waiting around. Just your key, ready to go.",
            },
            {
              icon: "key",
              title: "A little key. A lot of value.",
              text: "The software you know, without the price tag you expect.",
            },
            {
              icon: "headphones",
              title: "A simpler way to activate.",
              text: "Clear instructions to get you set up and back to what matters.",
            },
          ].map((b) => (
            <div className="benefit" key={b.title}>
              <span className="benefit-icon">
                <Icon name={b.icon as IconName} size={23} />
              </span>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </div>
          ))}
        </section>

        <section className="collections container">
          <button
            className="collection-card security-collection"
            onClick={() => goToShop("Antivirus")}
          >
            <div className="eyebrow">LESS WORRY. MORE BROWSING.</div>
            <h2>
              Your world.
              <br />
              Well protected.
            </h2>
            <p>Keep the threats out and the good stuff in.</p>
            <span className="collection-link">
              Shop antivirus <Icon name="arrow" size={17} />
            </span>
            <div className="collection-art shield-art">
              <Icon name="shield" size={125} />
            </div>
          </button>
          <button
            className="collection-card office-collection"
            onClick={() => goToShop("Office & Productivity")}
          >
            <div className="eyebrow">BIG IDEAS START HERE.</div>
            <h2>
              Make room
              <br />
              for your best work.
            </h2>
            <p>Everyday tools. Anything-but-ordinary possibilities.</p>
            <span className="collection-link">
              Shop productivity <Icon name="arrow" size={17} />
            </span>
            <div className="collection-art productivity-art">
              <span>W</span>
              <span>X</span>
              <span>P</span>
            </div>
          </button>
        </section>

        <section className="how-section container" id="how-it-works">
          <div className="how-heading">
            <div className="eyebrow">FROM CLICK TO ACTIVATED.</div>
            <h2>
              Three little steps.
              <br />
              One smarter digital life.
            </h2>
            <p>Less complicated. More connected.</p>
            <button className="text-button" onClick={() => setInfo("guide")}>
              Read the activation guide <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="steps">
            {[
              {
                icon: "bag",
                title: "Find your perfect fit",
                text: "Choose the software, device count, and license that work for you.",
              },
              {
                icon: "mail",
                title: "Check your inbox",
                text: "Your digital key and activation instructions arrive by email after purchase.",
              },
              {
                icon: "download",
                title: "Activate. And you’re in.",
                text: "Download from the official publisher, enter your key, and make it yours.",
              },
            ].map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-number">0{i + 1}</span>
                <div>
                  <Icon name={s.icon as IconName} size={22} />
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="faq-section container" id="help">
          <div className="faq-heading">
            <div className="eyebrow">GOOD QUESTIONS. STRAIGHT ANSWERS.</div>
            <h2>
              A little clarity
              <br />
              before you click.
            </h2>
            <p>
              Everything you need to know
              <br />
              about your next license key.
            </p>
            <span className="faq-decoration">
              <Icon name="key" size={48} />
            </span>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer], i) => (
              <div className={`faq-item ${faq === i ? "expanded" : ""}`} key={question}>
                <button
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {question}
                  <Icon name={faq === i ? "minus" : "plus"} size={18} />
                </button>
                {faq === i && <p id={`faq-${i}`}>{answer}</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <a className="logo" href="#">
                <span className="logo-symbol">
                  <Icon name="key" size={23} />
                </span>
                LOKI<span className="logo-light">KEYS</span>
                <span className="logo-dot">.</span>
              </a>
              <p>
                Big possibilities. Little keys.
                <br />
                Your digital world, unlocked.
              </p>
              <span className="footer-tag">
                <Icon name="globe" size={14} /> Digital by nature. Smarter by choice.
              </span>
            </div>
            <div className="footer-links">
              <h3>Find your key</h3>
              <button onClick={() => goToShop()}>All software</button>
              <button onClick={() => goToShop("Antivirus")}>Antivirus & security</button>
              <button onClick={() => goToShop("Office & Productivity")}>
                Office & productivity
              </button>
              <button onClick={() => goToShop("Gaming")}>Gaming</button>
            </div>
            <div className="footer-links">
              <h3>A little help</h3>
              <button onClick={() => setInfo("guide")}>Activation guide</button>
              <a href="#help">Frequently asked questions</a>
              <button onClick={() => setInfo("about")}>About Loki Keys</button>
              <button onClick={() => setInfo("terms")}>Delivery & returns</button>
            </div>
            <div className="footer-note">
              <Icon name="shield" size={27} />
              <h3>
                Your next chapter.
                <br />
                Genuinely unlocked.
              </h3>
              <p>
                Independent software reseller.
                <br />
                All trademarks belong to their respective owners.
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} LOKI KEYS. All rights reserved.</span>
            <div>
              <button onClick={() => setInfo("privacy")}>Privacy policy</button>
              <button onClick={() => setInfo("terms")}>Terms of use</button>
              <span>USD $</span>
            </div>
          </div>
        </div>
      </footer>

      {!overlay && (
        <button
          className={`rewards-launcher ${compareIds.length ? "above-comparison" : ""}`}
          onClick={openRewards}
          aria-label={
            reward
              ? `View your ${reward.percent}% discount reward`
              : "Spin the wheel for a discount"
          }
        >
          <span className="launcher-wheel" aria-hidden="true">
            ↻
          </span>
          <span>
            <small>YOUR LUCKY UNLOCK</small>
            <strong>
              {spinning
                ? "Your wheel is spinning…"
                : reward
                  ? `${reward.percent}% off, unlocked`
                  : "Feeling a little lucky?"}
            </strong>
          </span>
          <Icon name="arrow" size={16} />
        </button>
      )}
      {compareIds.length > 0 && !overlay && (
        <aside className="compare-tray" aria-label="Selected products for comparison">
          <div className="compare-tray-heading">
            <Icon name="grid" size={19} />
            <div>
              <strong>
                Your shortlist <span>{compareIds.length}/3</span>
              </strong>
              <small>
                {compareIds.length === 1
                  ? "Pick one more to see the difference."
                  : "A clearer choice, side by side."}
              </small>
            </div>
          </div>
          <div className="compare-chips">
            {compareIds.map((id) => {
              const p = products.find((product) => product.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => toggleCompare(id)}
                  aria-label={`Remove ${p.name} from comparison`}
                >
                  {p.brand} <Icon name="close" size={12} />
                </button>
              );
            })}
          </div>
          <button className="tray-clear" onClick={() => setCompareIds([])}>
            Clear
          </button>
          <button
            className="button primary"
            disabled={compareIds.length < 2}
            onClick={() => setInfo("compare")}
          >
            Compare {compareIds.length > 1 ? `(${compareIds.length})` : ""}
            <Icon name="arrow" size={16} />
          </button>
        </aside>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={18} />
          </span>
          {toast}
          <button
            onClick={() => {
              setToast("");
              setCartOpen(true);
            }}
          >
            View bag <Icon name="arrow" size={15} />
          </button>
        </div>
      )}
      {overlay && (
        <div className={`overlay ${cartOpen ? "drawer-overlay" : ""}`} onClick={closeOverlay}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label={
              cartOpen ? "Your shopping bag" : selected ? selected.name : "LOKI KEYS information"
            }
            className={
              cartOpen
                ? "cart-drawer"
                : `modal ${info === "compare" ? "comparison-modal" : ""} ${info === "rewards" ? "rewards-modal" : ""}`
            }
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              className="icon-button modal-close"
              aria-label="Close dialog"
              onClick={closeOverlay}
            >
              <Icon name="close" />
            </button>
            {cartOpen ? (
              <>
                <div className="eyebrow">YOUR NEXT DIGITAL CHAPTER</div>
                <h2>
                  Your bag <span className="cart-count">{cartCount}</span>
                </h2>
                {cartCount ? (
                  <>
                    <div className="cart-items">
                      {products
                        .filter((p) => cart[p.id])
                        .map((p) => (
                          <div className="cart-item" key={p.id}>
                            <div className={`cart-mini ${p.color}-bg`}>
                              <BrandMark brand={p.brand} />
                            </div>
                            <div className="cart-item-info">
                              <h3>{p.name}</h3>
                              <p>
                                {p.devices} · {p.term}
                              </p>
                              <strong>{money(p.price)}</strong>
                              <div className="quantity">
                                <button
                                  aria-label={`Decrease ${p.name} quantity`}
                                  onClick={() => changeQuantity(p.id, -1)}
                                >
                                  <Icon name="minus" size={13} />
                                </button>
                                <span>{cart[p.id]}</span>
                                <button
                                  aria-label={`Increase ${p.name} quantity`}
                                  onClick={() => changeQuantity(p.id, 1)}
                                >
                                  <Icon name="plus" size={13} />
                                </button>
                                <button
                                  className="remove-item"
                                  onClick={() =>
                                    setCart((c) => {
                                      const next = { ...c };
                                      delete next[p.id];
                                      return next;
                                    })
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="cart-summary">
                      <div>
                        <span>Subtotal</span>
                        <strong>
                          {money(total)} <small>USD</small>
                        </strong>
                      </div>
                      {rewardApplied && reward ? (
                        <>
                          <div className="discount-row">
                            <span>
                              {reward.code} · {reward.percent}% off{" "}
                              <button
                                aria-label="Remove reward from bag"
                                onClick={() => setRewardApplied(false)}
                              >
                                Remove
                              </button>
                            </span>
                            <strong>−{money(discounted.savings)}</strong>
                          </div>
                          <div className="discount-total">
                            <span>Preview total</span>
                            <strong>
                              {money(discounted.total)} <small>USD</small>
                            </strong>
                          </div>
                        </>
                      ) : (
                        <button className="cart-reward-link" onClick={openRewards}>
                          {reward
                            ? `Apply your ${reward.percent}% reward`
                            : "Feeling lucky? Spin for a little extra off"}
                          <Icon name="arrow" size={15} />
                        </button>
                      )}
                      <p>Digital products. No shipping required.</p>
                      <button
                        className="button primary"
                        onClick={() => {
                          setCartOpen(false);
                          setInfo("checkout");
                        }}
                      >
                        Review your order <Icon name="arrow" size={18} />
                      </button>
                      <span className="cart-preview-note">
                        Store preview · checkout is not yet available
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="empty-cart">
                    <Icon name="bag" size={50} />
                    <h3>A little empty. For now.</h3>
                    <p>Your next digital essential is waiting.</p>
                    {rewardApplied && reward && (
                      <p className="empty-cart-reward">
                        {reward.percent}% off is ready for whatever you choose.
                      </p>
                    )}
                    <button
                      className="button primary"
                      onClick={() => {
                        closeOverlay();
                        goToShop();
                      }}
                    >
                      Explore software <Icon name="arrow" size={17} />
                    </button>
                  </div>
                )}
              </>
            ) : selected ? (
              <div className="product-detail">
                <div className={`detail-visual ${selected.color}-bg`}>
                  <ProductBox product={selected} />
                </div>
                <div className="eyebrow">{selected.category}</div>
                <h2>{selected.name}</h2>
                <p className="detail-description">
                  Unlock{" "}
                  {selected.brand === "Microsoft"
                    ? "the tools for your everyday ideas and projects"
                    : "a safer digital life with powerful protection from " + selected.brand}
                  . Activate your license on the publisher’s official website.
                </p>
                <dl className="detail-specs">
                  <div>
                    <dt>Devices</dt>
                    <dd>{selected.devices}</dd>
                  </div>
                  <div>
                    <dt>License period</dt>
                    <dd>{selected.term}</dd>
                  </div>
                  <div>
                    <dt>Compatible with</dt>
                    <dd>{selected.platforms}</dd>
                  </div>
                  <div>
                    <dt>Activation region</dt>
                    <dd>{selected.region}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>Digital license key by email</dd>
                  </div>
                </dl>
                {selected.region === "See activation guide" && (
                  <p className="region-note">
                    Regional availability must be confirmed before purchasing.
                  </p>
                )}
                <div className="detail-buy">
                  <strong>
                    {money(selected.price)} <small>USD</small>
                  </strong>
                  <button className="button primary" onClick={() => addToCart(selected)}>
                    Add to bag <Icon name="plus" size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="info-content">
                {info !== "rewards" && <div className="eyebrow">A LITTLE HELP FROM LOKI</div>}
                {info === "rewards" && (
                  <RewardWheel
                    reward={reward}
                    spinning={spinning}
                    rotation={rotation}
                    onSpin={spinWheel}
                    applied={rewardApplied}
                    onApply={() => {
                      setRewardApplied(true);
                      setInfo(null);
                      setCartOpen(true);
                    }}
                  />
                )}
                {info === "finder" && (
                  <SoftwareFinder
                    products={products}
                    onSelect={(product) => {
                      setInfo(null);
                      setSelected(product);
                    }}
                  />
                )}
                {info === "compare" && (
                  <ProductComparison
                    products={products.filter((p) => compareIds.includes(p.id))}
                    onAdd={addToCart}
                    cart={cart}
                  />
                )}
                {info === "guide" && (
                  <>
                    <h2>From key to ready.</h2>
                    <p>Follow these steps to activate your software safely.</p>
                    <ol className="guide-list">
                      <li>
                        <strong>Check your license.</strong> Confirm the exact software edition,
                        device count, operating system, and region. A key only works with its
                        matching edition.
                      </li>
                      <li>
                        <strong>Download from the source.</strong> Visit the publisher’s official
                        website: Norton, McAfee, Malwarebytes, Microsoft, or Watchdog. Never
                        download installers from an unverified link.
                      </li>
                      <li>
                        <strong>Sign in and activate.</strong> Sign in to your publisher account,
                        find “Redeem a key” or “Activate,” then enter the key from your purchase
                        email.
                      </li>
                      <li>
                        <strong>Install and enjoy.</strong> Follow the publisher’s instructions.
                        Subscription periods and renewal settings are managed by the publisher;
                        review them during activation.
                      </li>
                    </ol>
                    <p className="info-callout">
                      Have an existing subscription? Check with the publisher before redeeming a new
                      key, as it may not extend your current plan.
                    </p>
                  </>
                )}
                {info === "about" && (
                  <>
                    <h2>
                      Big possibilities.
                      <br />
                      Little keys.
                    </h2>
                    <p>
                      LOKI KEYS brings antivirus and productivity software together in one simple
                      digital storefront. Less searching, less complexity, more time for what
                      matters.
                    </p>
                    <p>
                      We’re building an independent software-key store, not a software publisher.
                      Brand names and trademarks belong to their respective owners; no publisher
                      affiliation is implied.
                    </p>
                    <div className="info-callout">
                      <Icon name="shield" size={23} />
                      <div>
                        <strong>Know what you’re buying.</strong>
                        <p>
                          Clear device limits, license periods, and region details help you choose
                          the right fit.
                        </p>
                      </div>
                    </div>
                    <button
                      className="button primary"
                      onClick={() => {
                        closeOverlay();
                        goToShop();
                      }}
                    >
                      Find your software <Icon name="arrow" size={17} />
                    </button>
                  </>
                )}
                {info === "checkout" && (
                  <>
                    <h2>
                      A great start.
                      <br />
                      Not quite checkout.
                    </h2>
                    <p>
                      This is a storefront preview. Payments, license fulfillment, and customer
                      accounts are not connected yet. No order will be placed and no payment will be
                      collected.
                    </p>
                    <div className="order-review">
                      {products
                        .filter((p) => cart[p.id])
                        .map((p) => (
                          <div key={p.id}>
                            <span>
                              {p.name} × {cart[p.id]}
                            </span>
                            <strong>{money(p.price * cart[p.id])}</strong>
                          </div>
                        ))}
                      <div className="order-total">
                        <span>Subtotal (USD)</span>
                        <strong>{money(total)}</strong>
                      </div>
                      {rewardApplied && reward && (
                        <>
                          <div className="discount-row">
                            <span>
                              {reward.code} · {reward.percent}% off
                            </span>
                            <strong>−{money(discounted.savings)}</strong>
                          </div>
                          <div className="order-total">
                            <span>Preview total (USD)</span>
                            <strong>{money(discounted.total)}</strong>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      className="button primary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            products
                              .filter((p) => cart[p.id])
                              .map(
                                (p) => `${p.name} × ${cart[p.id]} — ${money(p.price * cart[p.id])}`,
                              )
                              .join("\n") +
                              `\nSubtotal: ${money(total)} USD${rewardApplied && reward ? `\n${reward.code} (${reward.percent}%): -${money(discounted.savings)}\nPreview total: ${money(discounted.total)} USD` : ""}\nPreview only — no order placed.`,
                          );
                          setCopied(true);
                        } catch {
                          setToast(
                            "Copy unavailable. You can select and copy the order details above.",
                          );
                        }
                      }}
                    >
                      {copied ? "Order summary copied" : "Copy order summary"}
                      <Icon name={copied ? "check" : "arrow"} size={17} />
                    </button>
                  </>
                )}
                {info === "privacy" && (
                  <>
                    <h2>Your privacy matters.</h2>
                    <p>
                      This preview does not create accounts, process payments, or submit your
                      information to a LOKI KEYS server. Your shopping bag is temporary and clears
                      when you reload the page.
                    </p>
                    <p>
                      Google Fonts and the hosting platform may receive basic technical request data
                      when the site loads. No optional analytics or advertising tools have been
                      added to this storefront.
                    </p>
                    <p>
                      A complete business privacy policy and contact details must be provided before
                      the store accepts orders.
                    </p>
                  </>
                )}
                {info === "terms" && (
                  <>
                    <h2>The important details.</h2>
                    <h3>Preview only</h3>
                    <p>
                      Products and prices are adapted from the supplied reference catalog for
                      demonstration. Availability, regional eligibility, and pricing must be
                      verified before the store goes live. No purchases can currently be completed.
                    </p>
                    <h3>Digital delivery</h3>
                    <p>
                      The intended live service delivers license keys by email, not physical
                      shipment. Delivery times and support details will be confirmed before checkout
                      is enabled.
                    </p>
                    <h3>Returns & activation issues</h3>
                    <p>
                      A final refund policy must be published before trading. If a future purchased
                      key fails to activate, retain your order details and contact the seller.
                      Nothing here limits your statutory consumer rights.
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
