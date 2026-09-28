"use client";

import { motion } from "motion/react";
import {
  cardClass,
  eyebrowClass,
  fadeUp,
  headingClass,
} from "@/components/customer/styles";

interface NotFoundCardProps {
  title: string;
  body: string;
}

/**
 * "Nothing matched this link" card for the join route. It lives in its own
 * client component only because `motion` cannot render from the async server
 * page — the markup itself is identical to the rest of the V2 customer cards.
 */
export default function NotFoundCard({ title, body }: NotFoundCardProps) {
  return (
    <motion.section {...fadeUp(0)} className={cardClass}>
      <div className="text-center">
        <p className={eyebrowClass}>Qzen</p>
        <h1 className={`mt-3 ${headingClass}`}>{title}</h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-text-2">{body}</p>
      </div>

      <p className="mt-6 text-center text-[12.5px] leading-6 text-ink-text-3">
        Check the link you scanned, or ask the staff for a new one.
      </p>
    </motion.section>
  );
}
