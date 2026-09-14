import Features from "@/components/Features";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import { getHomeState } from "@/lib/home";

export default async function Home() {
  const homeState = await getHomeState();

  return (
    <main className="min-h-screen overflow-hidden bg-qzen-canvas">
      <Navbar
        isAuthenticated={homeState.isAuthenticated}
        hasBusiness={homeState.hasBusiness}
      />
      <Hero
        isAuthenticated={homeState.isAuthenticated}
        hasBusiness={homeState.hasBusiness}
      />
      <HowItWorks />
      <Features />
    </main>
  );
}
