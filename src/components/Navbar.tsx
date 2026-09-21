import Link from "next/link";

interface NavbarProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

export default function Navbar({ isAuthenticated, hasBusiness }: NavbarProps) {
  const ownerDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  const loginDestination = !isAuthenticated
    ? "/login"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  return (
    <header className="border-b border-qzen-border/80 bg-qzen-surface/90 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
      >
        <div>
          <Link
            href="/"
            className="block text-2xl font-bold tracking-tight text-zinc-950"
            aria-label="Qzen home"
          >
            Q<span className="text-emerald-600">z</span>en
          </Link>

          <p className="mt-1 text-xs text-zinc-400">Join. Relax. Get Served.</p>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={loginDestination}
            className="px-2 py-2 text-sm font-medium text-qzen-text-secondary hover:text-qzen-brand-strong"
          >
            Login
          </Link>

          <Link
            href={ownerDestination}
            className="rounded-qzen-md bg-qzen-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-qzen-sm hover:bg-qzen-brand-strong sm:px-5"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
