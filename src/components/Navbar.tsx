import Link from "next/link";

// export default function Navbar() {
//   return (
//     <nav className="flex items-center justify-between px-8 py-5">
//       {/* <h2 className="text-2xl font-bold">Qzen</h2> */}
//       <Link href="/" className="text-2xl font-bold">
//         Qzen
//       </Link>

//       <div className="flex items-center gap-6">
//         {/* <a href="#" className="text-sm font-medium">
//           Login
//         </a> */}
//         <Link href="/login" className="text-sm font-medium">
//           Login
//         </Link>

//         {/* <a
//           href="#"
//           className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
//         >
//           Get Started
//         </a> */}
//         <Link
//           href="/signup"
//           className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
//         >
//           Get Started
//         </Link>
//       </div>
//     </nav>
//   );
// }

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
    <nav className="flex items-center justify-between px-8 py-5">
      <Link href="/" className="text-2xl font-bold">
        Qzen
      </Link>

      <div className="flex items-center gap-6">
        <Link href={loginDestination} className="text-sm font-medium">
          Login
        </Link>

        <Link
          href={ownerDestination}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
