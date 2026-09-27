"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each child */
  stagger?: number;
  delay?: number;
  /** Loop forever instead of triggering on scroll (hero entrance) */
  animateOnMount?: boolean;
};

/**
 * Parent for staggered children. Pair with `<RevealChild>`.
 */
export default function Stagger({
  children,
  className,
  stagger = 0.08,
  delay = 0,
  animateOnMount = false,
}: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      initial="hidden"
      animate={animateOnMount ? "visible" : undefined}
      whileInView={animateOnMount ? undefined : "visible"}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
}

export function RevealChild({
  children,
  className,
  y = 20,
  duration = 0.7,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
