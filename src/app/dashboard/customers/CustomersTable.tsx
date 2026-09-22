"use client";

import { useMemo, useState } from "react";

type CustomerStatus = "waiting" | "serving" | "completed" | "skipped";

interface Customer {
  id: string;
  customerName: string;
  tokenNumber: number;
  queueName: string;
  status: CustomerStatus;
  joinedAt: string;
  completedAt: string | null;
}

interface CustomersTableProps {
  customers: Customer[];
  selectedDate: string;
  isToday: boolean;
}

const statusOptions: Array<{
  value: "all" | CustomerStatus;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "serving", label: "Serving" },
  { value: "completed", label: "Completed" },
  { value: "skipped", label: "Skipped" },
];

function getStatusClasses(status: CustomerStatus) {
  if (status === "waiting") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "serving") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-red-50 text-red-700";
}

function getStatusLabel(status: CustomerStatus) {
  if (status === "waiting") {
    return "Waiting";
  }

  if (status === "serving") {
    return "Serving";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Skipped";
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function CustomersTable({
  customers,
  selectedDate,
  isToday,
}: CustomersTableProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>(
    "all",
  );

  const filteredCustomers = useMemo(() => {
    if (statusFilter === "all") {
      return customers;
    }

    return customers.filter((customer) => customer.status === statusFilter);
  }, [customers, statusFilter]);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">
            {isToday ? "Today's Customers" : "Customer History"}
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            {isToday
              ? "Customer activity from today's queue sessions."
              : `Customer activity from ${new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "long",
                }).format(
                  new Date(
                    Number(selectedDate.slice(0, 4)),
                    Number(selectedDate.slice(5, 7)) - 1,
                    Number(selectedDate.slice(8, 10)),
                  ),
                )}.`}
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | CustomerStatus)
          }
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400"
          aria-label="Filter customers by status"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="p-10 text-center">
          <h3 className="text-sm font-semibold text-zinc-900">
            {customers.length === 0
              ? isToday
                ? "No customers today"
                : "No customer activity"
              : "No customers match this filter"}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {customers.length === 0
              ? isToday
                ? "Customers who join your queues will appear here."
                : "No customers joined your queues on this date."
              : "Try selecting a different status."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-100 bg-zinc-50/70">
                <tr className="text-xs font-medium text-zinc-500">
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Token</th>
                  <th className="px-5 py-3">Queue</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Served</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="text-sm">
                    <td className="px-5 py-4 font-medium text-zinc-900">
                      {customer.customerName}
                    </td>

                    <td className="px-5 py-4 font-medium text-zinc-700">
                      #{customer.tokenNumber}
                    </td>

                    <td className="px-5 py-4 text-zinc-600">
                      {customer.queueName}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                          customer.status,
                        )}`}
                      >
                        {getStatusLabel(customer.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      {formatTime(customer.joinedAt)}
                    </td>

                    <td className="px-5 py-4 text-zinc-500">
                      {customer.completedAt
                        ? formatTime(customer.completedAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-zinc-100 md:hidden">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">
                      {customer.customerName}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      #{customer.tokenNumber} · {customer.queueName}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                      customer.status,
                    )}`}
                  >
                    {getStatusLabel(customer.status)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-zinc-400">Joined</p>
                    <p className="mt-1 font-medium text-zinc-700">
                      {formatTime(customer.joinedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-400">Served</p>
                    <p className="mt-1 font-medium text-zinc-700">
                      {customer.completedAt
                        ? formatTime(customer.completedAt)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {filteredCustomers.length > 0 && (
        <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      )}
    </div>
  );
}
