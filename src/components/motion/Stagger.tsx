import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeSlideUp, staggerContainer } from "@/lib/motion";

// Wrap a card grid with <StaggerGroup> and each direct card with
// <StaggerItem> to get a one-after-another fade/slide-up entrance instead of
// everything popping in at once. StaggerGroup only needs to run its
// "appear" animation once per mount (dashboards don't remount on refetch),
// so cards never re-animate just because their data changed.
export function StaggerGroup({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div className={className} variants={fadeSlideUp} {...props}>
      {children}
    </motion.div>
  );
}
