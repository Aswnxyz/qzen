// import Link from "next/link";

// export default function Hero() {
//   return (
//     <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
//       <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
//         Smart Queue Management
//       </p>

//       <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
//         Stop waiting.
//         <br />
//         Know your turn.
//       </h1>

//       <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
//         Qzen helps businesses manage queues digitally while customers track
//         their position and relax instead of waiting in line.
//       </p>

//       <div className="mt-8 flex flex-col gap-3 sm:flex-row">
//         {/* <button className="rounded-full bg-black px-7 py-3 font-medium text-white transition hover:bg-zinc-800">
//           Create a Queue
//         </button> */}
//         <Link
//           href="/signup"
//           className="rounded-full bg-black px-7 py-3 font-medium text-white transition hover:bg-zinc-800"
//         >
//           Create a Queue
//         </Link>

//         <button className="rounded-full border border-zinc-300 px-7 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100">
//           Join a Queue
//         </button>
//       </div>
//     </section>
//   );
// }

import Link from "next/link";

interface HeroProps {
  isAuthenticated: boolean;
  hasBusiness: boolean;
}

export default function Hero({ isAuthenticated, hasBusiness }: HeroProps) {
  const createQueueDestination = !isAuthenticated
    ? "/signup"
    : hasBusiness
      ? "/dashboard"
      : "/onboarding";

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Smart Queue Management
      </p>

      <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
        Stop waiting.
        <br />
        Know your turn.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
        Qzen helps businesses manage queues digitally while customers track
        their position and relax instead of waiting in line.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={createQueueDestination}
          className="rounded-full bg-black px-7 py-3 font-medium text-white transition hover:bg-zinc-800"
        >
          Create a Queue
        </Link>

        <button className="rounded-full border border-zinc-300 px-7 py-3 font-medium text-zinc-900 transition hover:bg-zinc-100">
          Join a Queue
        </button>
      </div>
    </section>
  );
}
