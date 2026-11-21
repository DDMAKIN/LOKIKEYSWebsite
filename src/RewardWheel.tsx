export const rewards = [5, 8, 10, 12, 15, 20] as const;
export type Reward = { percent: number; code: string };
export function pickReward(random: number) {
  const index = Math.min(rewards.length - 1, Math.max(0, Math.floor(random * rewards.length)));
  return { index, percent: rewards[index], code: `LOKI${String(rewards[index]).padStart(2, "0")}` };
}
export function wheelRotation(index: number) {
  return 360 * 6 + 360 - (index * 60 + 30);
}
export function calculateDiscount(subtotal: number, percent: number) {
  const savings = Math.round(subtotal * percent) / 100;
  return { savings, total: Math.max(0, Math.round((subtotal - savings) * 100) / 100) };
}

export function RewardWheel({
  reward,
  spinning,
  rotation,
  onSpin,
  onApply,
  applied,
}: {
  reward: Reward | null;
  spinning: boolean;
  rotation: number;
  onSpin: () => void;
  onApply: () => void;
  applied: boolean;
}) {
  return (
    <div className={`reward-experience ${reward ? "has-reward" : ""}`}>
      <div className="wheel-stage">
        <div className="wheel-orbit orbit-one" />
        <div className="wheel-orbit orbit-two" />
        <span className="wheel-spark spark-one" />
        <span className="wheel-spark spark-two" />
        <span className="wheel-spark spark-three" />
        <div className="wheel-pointer" aria-hidden="true" />
        <div
          className={`prize-wheel ${spinning ? "is-spinning" : ""}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        >
          {rewards.map((value, i) => (
            <div
              className={`wheel-segment segment-${i}`}
              key={value}
              style={{ transform: `rotate(${i * 60 + 30}deg)` }}
            >
              <span>
                <strong>{value}%</strong>
                <small>OFF</small>
              </span>
            </div>
          ))}
        </div>
        <div className="wheel-hub" aria-hidden="true">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="8" cy="8" r="5" />
            <path d="m12 12 9 9m-4-4 3-3m-7 0 3-3" />
          </svg>
        </div>
        {reward && (
          <div className="reward-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
        )}
        <span className="wheel-stage-caption">REWARD PROTOCOL // EVERY SPIN WINS</span>
      </div>
      <div className="wheel-copy">
        <span className="eyebrow">BONUS ROUND // THE LOKI UNLOCK</span>
        <div className="wheel-status" aria-live="polite" aria-atomic="true">
          <h2>
            {reward ? (
              <>
                Reward unlocked.
                <br />
                <em>{reward.percent}% off is yours.</em>
              </>
            ) : (
              <>
                Spin the system.
                <br />
                Unlock your bonus.
              </>
            )}
          </h2>
          <p>
            {reward
              ? "Your next upgrade just got better. Apply your reward and watch your bag total drop."
              : spinning
                ? "Decrypting your reward… hold tight."
                : "Take your bonus round. Six possible rewards, up to 20% off your bag. Every slice wins."}
          </p>
        </div>
        {reward ? (
          <>
            <div className="reward-ticket">
              <span>YOUR REWARD CODE</span>
              <strong>{reward.code}</strong>
              <b>{reward.percent}% OFF</b>
            </div>
            <button className="button primary wheel-cta" onClick={onApply}>
              {applied ? "See my rewarded bag" : `Apply my ${reward.percent}% reward`}
              <span aria-hidden="true">→</span>
            </button>
            <span className="wheel-reassurance">
              No email needed. No minimum spend. Just a little luck.
            </span>
          </>
        ) : (
          <>
            <button className="button primary wheel-cta" disabled={spinning} onClick={onSpin}>
              {spinning ? "Unlocking your reward…" : "Initiate spin"}
              <span
                className={spinning ? "spin-symbol rotating" : "spin-symbol"}
                aria-hidden="true"
              >
                ↻
              </span>
            </button>
            <span className="wheel-reassurance">Free to spin. No sign-up. Every spin wins.</span>
          </>
        )}
        <details className="wheel-terms">
          <summary>The little details</summary>
          <p>
            One spin per page visit. Six equally likely rewards: 5%, 8%, 10%, 12%, 15%, or 20% off
            your bag subtotal, applied automatically at checkout. One use per customer, one code per
            order, no cash value. Your spin resets when this page reloads, but the code you won
            stays valid if you type it in at checkout.
          </p>
        </details>
        <span className="wheel-preview">Code applies at secure checkout · see terms</span>
      </div>
    </div>
  );
}
