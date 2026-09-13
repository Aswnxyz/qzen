import Features from "@/components/Features";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Navbar from "@/components/Navbar";
import { getHomeState } from "@/lib/home";

// export default function Home() {
//   return (
//     <main>
//       <Navbar />
//       <Hero />
//       <HowItWorks />
//       <Features />
//     </main>
//   );
// }

export default async function Home() {
  const homeState = await getHomeState();

  return (
    <main>
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
