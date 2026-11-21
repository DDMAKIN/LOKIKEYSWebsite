import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "./catalog";

const money = (value: number) => `$${value.toFixed(2)}`;

/** Ranks products for a query: name and brand matches first, then category and platforms. */
export function searchProducts(products: Product[], query: string, limit = 6): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products.filter((p) => p.badge).slice(0, limit);
  const words = q.split(/\s+/);
  return products
    .map((p) => {
      const name = `${p.brand} ${p.name}`.toLowerCase();
      const rest = `${p.category} ${p.platforms} ${p.region} ${p.devices} ${p.term}`.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (name.startsWith(w)) score += 6;
        else if (name.includes(w)) score += 4;
        else if (rest.includes(w)) score += 1;
        else return { p, score: -1 };
      }
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price)
    .slice(0, limit)
    .map((r) => r.p);
}

export function QuickSearch({
  open,
  products,
  onClose,
  onOpenProduct,
  onAdd,
}: {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onOpenProduct: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(products, query), [products, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const previous = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => input.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const onKey = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      onOpenProduct(results[active]);
    }
  };

  return (
    <div className="qs-overlay" onClick={onClose}>
      <div
        className="qs-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search software"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="qs-input">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Norton, VPN, Office, Mac…"
            aria-label="Search software"
            aria-controls="qs-results"
            aria-activedescendant={results[active] ? `qs-${results[active].id}` : undefined}
            role="combobox"
            aria-expanded="true"
            maxLength={60}
          />
          <kbd>Esc</kbd>
        </div>
        <p className="qs-caption">
          {query.trim() ? `${results.length} matches` : "Popular right now"}
        </p>
        <ul className="qs-results" id="qs-results" role="listbox">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`qs-${p.id}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
            >
              <button className="qs-main" onClick={() => onOpenProduct(p)}>
                <span className={`qs-dot tone-${p.color}-bg`} aria-hidden="true" />
                <span className="qs-text">
                  <strong>{p.name}</strong>
                  <small>
                    {p.devices} · {p.term} · {p.region}
                  </small>
                </span>
                <span className="qs-price">{money(p.price)}</span>
              </button>
              <button
                className="qs-add"
                aria-label={`Add ${p.name} to bag`}
                onClick={() => onAdd(p)}
              >
                +
              </button>
            </li>
          ))}
        </ul>
        {!results.length && (
          <p className="qs-empty">No keys match “{query.trim()}”. Try a brand, “VPN” or “Mac”.</p>
        )}
        <p className="qs-hint">
          <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open · press <kbd>/</kbd> anytime
        </p>
      </div>
    </div>
  );
}
