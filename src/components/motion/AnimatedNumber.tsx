import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

// Counts from its previous value up to `value` instead of just popping to
// the new number — used for the small live stats on the dashboard (Fix All
// Agents progress, leave balances). Writes directly to the DOM node on every
// animation frame rather than through React state, so a fast-changing value
// (e.g. polled every few seconds) never causes a render per frame.
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      node.textContent = value.toLocaleString();
      prevValue.current = value;
      return;
    }

    const controls = animate(prevValue.current, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    prevValue.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString()}
    </span>
  );
}
