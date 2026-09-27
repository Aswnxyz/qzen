import Link from "next/link";

interface SiteFooterProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

/**
 * Act V close — navigation and legitimacy.
 * Only links to routes that actually exist in the app.
 */
export default function SiteFooter({
  isAuthenticated,
  hasBusiness,
}: SiteFooterProps) {
  const loginDestination = !isAuthenticated
    ? "/login"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  const ownerDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  const columns = [
    {
      title: "Product",
      links: [
        { label: "Who it's for", href: "#industries" },
        { label: "How it works", href: "#how-it-works" },
        { label: "Capabilities", href: "#capabilities" },
        { label: "Inside the product", href: "#product" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: isAuthenticated ? "Dashboard" : "Log in", href: loginDestination },
        { label: isAuthenticated ? "Open app" : "Get started", href: ownerDestination },
        { label: "Join a queue", href: "#join" },
      ],
    },
    {
      title: "Learn",
      links: [
        { label: "FAQ", href: "#faq" },
        { label: "Why teams switch", href: "#trust" },
        { label: "Home", href: "/" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-line-dark bg-ink text-on-dark">
      <div className="pointer-events-none absolute inset-0 qzl-grid opacity-50" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-[1320px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.7fr)]">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="Qzen home" className="inline-block">
              <span className="text-[32px] font-bold leading-none tracking-[-0.04em] text-white">
                Q<span className="text-qz-accent">z</span>en
              </span>
            </Link>

            <p className="mt-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-on-dark-3">
              Join. Relax. Get Served.
            </p>

            <p className="mt-5 max-w-[340px] text-[14.5px] leading-[1.6] text-on-dark-2">
              Digital queue management for clinics, salons, banks, retail
              counters and service centres.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-dark px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-qz-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-on-dark-2">
                Platform operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-on-dark-3">
                  {column.title}
                </p>

                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[14.5px] text-on-dark-2 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line-dark pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] tracking-[0.08em] text-on-dark-3">
            © {new Date().getFullYear()} Qzen. All rights reserved.
          </p>

          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-on-dark-3">
            Queue management, everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
