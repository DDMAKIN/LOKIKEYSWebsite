import { useState } from "react";
import type { Product } from "./App";

const questions = [
  {
    title: "What’s on your agenda?",
    subtitle: "Let’s start with what you want to do.",
    options: [
      {
        value: "Antivirus",
        title: "Stay protected",
        text: "Antivirus & everyday digital security",
      },
      {
        value: "Office & Productivity",
        title: "Get things done",
        text: "Tools for documents, ideas & projects",
      },
      {
        value: "Gaming",
        title: "Play with confidence",
        text: "Protection built with gamers in mind",
      },
    ],
  },
  {
    title: "What’s your go-to device?",
    subtitle: "We’ll narrow things down to compatible software.",
    options: ["Windows", "macOS", "Android", "iOS"].map((value) => ({
      value,
      title: value,
      text:
        value === "Windows"
          ? "Your Windows PC or laptop"
          : value === "macOS"
            ? "Your Mac desktop or laptop"
            : value === "Android"
              ? "Your Android phone or tablet"
              : "Your iPhone or iPad",
    })),
  },
  {
    title: "A budget that fits you.",
    subtitle: "One last thing. What would you like to spend?",
    options: [
      { value: "30", title: "Under $30", text: "Everyday essentials, little prices" },
      { value: "50", title: "Under $50", text: "A little more room to explore" },
      { value: "100", title: "Up to $100", text: "Show me the full picture" },
    ],
  },
];

export function getRecommendations(products: Product[], answers: string[]) {
  return products
    .filter(
      (p) =>
        p.category === answers[0] &&
        p.platforms.includes(answers[1]) &&
        p.price <= Number(answers[2]),
    )
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);
}

export function SoftwareFinder({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const question = questions[step];
  const matches = step === 3 ? getRecommendations(products, answers) : [];
  return (
    <div className="software-finder">
      <div className="finder-progress" aria-label={`Step ${Math.min(step + 1, 3)} of 3`}>
        {[0, 1, 2].map((i) => (
          <span className={i <= step ? "complete" : ""} key={i} />
        ))}
      </div>
      {step < 3 ? (
        <>
          <span className="finder-step">YOUR SOFTWARE MATCH · 0{step + 1} / 03</span>
          <h2>{question.title}</h2>
          <p>{question.subtitle}</p>
          <div className="finder-options" role="group" aria-label={question.title}>
            {question.options.map((option) => (
              <button
                key={option.value}
                aria-pressed={answers[step] === option.value}
                className={answers[step] === option.value ? "chosen" : ""}
                onClick={() =>
                  setAnswers((current) =>
                    current.map((answer, i) => (i === step ? option.value : answer)),
                  )
                }
              >
                <span className="option-radio" />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.text}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="finder-navigation">
            <button className="text-button" onClick={() => setStep(step - 1)} disabled={step === 0}>
              Back
            </button>
            <button
              className="button primary"
              disabled={!answers[step]}
              onClick={() => setStep(step + 1)}
            >
              {step === 2 ? "Find my matches" : "Next step"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="finder-step">A LITTLE MORE YOU.</span>
          <h2>{matches.length ? "Meet your matches." : "Let’s adjust the fit."}</h2>
          <p>
            {matches.length
              ? `For ${answers[1]}, ${answers[0].toLowerCase()}, and a budget up to $${answers[2]}.`
              : "No licenses match all three choices in our current catalog. Try a larger budget or a different category."}
          </p>
          <div className="finder-matches">
            {matches.map((product) => (
              <button key={product.id} onClick={() => onSelect(product)}>
                <div>
                  <small>{product.brand}</small>
                  <strong>{product.name}</strong>
                  <span>
                    {product.devices} · {product.term}
                  </span>
                </div>
                <b>
                  ${product.price.toFixed(2)}
                  <span>View details →</span>
                </b>
              </button>
            ))}
          </div>
          {matches.length > 0 && (
            <p className="match-disclaimer">
              A starting point, not a compatibility guarantee. Check activation region, exact
              edition, and system requirements before purchasing.
            </p>
          )}
          <div className="finder-navigation">
            <button className="text-button" onClick={() => setStep(2)}>
              Edit budget
            </button>
            <button
              className="button outline"
              onClick={() => {
                setAnswers(["", "", ""]);
                setStep(0);
              }}
            >
              Start again
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function ProductComparison({
  products,
  onAdd,
  cart,
}: {
  products: Product[];
  onAdd: (product: Product) => void;
  cart: Record<number, number>;
}) {
  const rows: [string, (p: Product) => string][] = [
    ["Best for", (p) => p.category],
    ["Devices", (p) => p.devices],
    ["License", (p) => p.term],
    ["Works with", (p) => p.platforms],
    ["Activation region", (p) => p.region],
    ["Delivery", () => "Digital key by email"],
  ];
  return (
    <div className="product-comparison">
      <h2>Small details. Better decisions.</h2>
      <p>Find the right key for your digital life.</p>
      <div
        className="comparison-scroll"
        role="region"
        aria-label="Software comparison table"
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="comparison-label">YOUR SHORTLIST</span>
              </th>
              {products.map((p) => (
                <th scope="col" key={p.id}>
                  <span className={`comparison-monogram tone-${p.color}-bg`}>
                    {p.brand.slice(0, 1)}
                  </span>
                  <strong>{p.name}</strong>
                  <span className="comparison-price">
                    ${p.price.toFixed(2)} <small>USD</small>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([title, value]) => (
              <tr key={title}>
                <th scope="row">{title}</th>
                {products.map((p) => (
                  <td key={p.id}>{value(p)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Make it yours</th>
              {products.map((p) => (
                <td key={p.id}>
                  <button className="button primary" onClick={() => onAdd(p)}>
                    {cart[p.id] ? `Add another (${cart[p.id]} in bag)` : "Add to bag"}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="match-disclaimer">
        Confirm regional availability and exact system requirements before purchasing. All prices in
        USD. The price charged is the one shown at checkout.
      </p>
    </div>
  );
}
