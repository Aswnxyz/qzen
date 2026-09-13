import Link from "next/link";

export default function DashboardSidebar() {
  return (
    <aside className="w-64 border-r border-zinc-200 bg-white p-6">
      <h2 className="text-2xl font-bold">Qzen</h2>

      <nav className="mt-10 space-y-2">
        <a
          href="/dashboard"
          className="block rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium"
        >
          Dashboard
        </a>

        {/* <a
          href="#"
          className="block rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Queues
        </a> */}
        <Link
          href="/dashboard/queues"
          className="block rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Queues
        </Link>

        <a
          href="#"
          className="block rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Customers
        </a>

        <a
          href="#"
          className="block rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Analytics
        </a>

        <a
          href="#"
          className="block rounded-lg px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-100"
        >
          Settings
        </a>
      </nav>
    </aside>
  );
}
