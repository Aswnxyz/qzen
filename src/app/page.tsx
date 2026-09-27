import { MotionConfig } from "motion/react";
import LandingHeader from "@/components/landing/LandingHeader";
import Hero from "@/components/landing/Hero";
import IndustryMarquee from "@/components/landing/IndustryMarquee";
import IndustriesIndex from "@/components/landing/IndustriesIndex";
import HowItWorks from "@/components/landing/HowItWorks";
import CapabilityLedger from "@/components/landing/CapabilityLedger";
import ProductShowcase from "@/components/landing/ProductShowcase";
import TrustLedger from "@/components/landing/TrustLedger";
import FaqList from "@/components/landing/FaqList";
import FinalCta from "@/components/landing/FinalCta";
import SiteFooter from "@/components/landing/SiteFooter";
import Section from "@/components/landing/Section";
import Seam from "@/components/landing/Seam";
import { getHomeState } from "@/lib/home";

/**
 * Qzen landing page — a five-act scroll narrative:
 *
 *   I   Promise      (dark)  hero + industry marquee
 *   II  Context      (light) industries · how it works · capabilities
 *   III Product      (dark)  the staff console, lit like a stage
 *   IV  Proof        (light) trust ledger · FAQ
 *   V   Conversion   (dark)  final CTA + footer
 */
export default async function Home() {
  const homeState = await getHomeState();

  return (
    <MotionConfig reducedMotion="user">
      <main className="landing-root min-h-screen overflow-x-clip bg-paper text-ink-text">
        <LandingHeader
          isAuthenticated={homeState.isAuthenticated}
          hasBusiness={homeState.hasBusiness}
        />

        {/* ── Act I · Promise ─────────────────────────────────── */}
        <Hero
          isAuthenticated={homeState.isAuthenticated}
          hasBusiness={homeState.hasBusiness}
        />
        <IndustryMarquee />
        <Seam from="ink" />

        {/* ── Act II · Context ────────────────────────────────── */}
        <Section id="industries" tone="paper" label="Industries">
          <IndustriesIndex />
        </Section>

        <Section id="how-it-works" tone="muted" label="How it works">
          <HowItWorks />
        </Section>

        <Section id="capabilities" tone="white" label="Capabilities">
          <CapabilityLedger />
        </Section>

        {/* ── Act III · Product ───────────────────────────────── */}
        <Seam from="white" />
        <Section id="product" tone="dark" label="Product">
          <ProductShowcase />
        </Section>

        {/* ── Act IV · Proof ──────────────────────────────────── */}
        <Seam from="ink" />
        <Section id="trust" tone="paper" label="Trust">
          <TrustLedger />
        </Section>

        <Section id="faq" tone="white" label="FAQ">
          <FaqList />
        </Section>

        {/* ── Act V · Conversion ──────────────────────────────── */}
        <Seam from="white" />
        <div className="relative overflow-hidden bg-ink text-on-dark">
          <FinalCta
            isAuthenticated={homeState.isAuthenticated}
            hasBusiness={homeState.hasBusiness}
          />
          <SiteFooter
            isAuthenticated={homeState.isAuthenticated}
            hasBusiness={homeState.hasBusiness}
          />
        </div>
      </main>
    </MotionConfig>
  );
}
