"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay in seconds */
  delay?: number;
  /** Initial vertical offset in px */
  y?: number;
  /** Reveal style */
  variant?: "up" | "fade" | "mask";
  /** Duration in seconds */
  duration?: number;
  as?: "div" | "section" | "article" | "li" | "span" | "p";
};

/**
 * Single scroll-triggered reveal primitive.
 * Runs once when the element enters the viewport.
 * `prefers-reduced-motion` is handled globally via MotionConfig.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  variant = "up",
  duration = 0.7,
  as = "div",
}: RevealProps) {
  const Tag = motion[as];

  const resolved =
    variant === "fade"
      ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
      : variant === "mask"
        ? { hidden: { opacity: 0, y: "0.5em" }, visible: { opacity: 1, y: "0em" } }
        : { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0 } };

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={resolved}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
