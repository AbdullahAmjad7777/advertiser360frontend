import type { Transition, Variants } from "framer-motion";

// Shared timing so every entrance animation in the app (page transitions,
// staggered dashboard cards, chart draw-ins) feels like one system instead
// of a pile of one-off durations. Kept short/subtle on purpose — this is a
// business tool, not a marketing site, so motion should read as "responsive"
// rather than "decorative".
export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};

// Applied to the grid/list wrapping a set of cards — staggerChildren delays
// each direct child's own `fadeSlideUp` (or similar) variant so cards appear
// one after another on load instead of all at once.
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
