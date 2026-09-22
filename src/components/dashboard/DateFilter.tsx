"use client";

import { useRouter } from "next/navigation";

interface DateFilterProps {
  selectedDate: string;
  todayDateKey: string;
  basePath: string;
}

export default function DateFilter({
  selectedDate,
  todayDateKey,
  basePath,
}: DateFilterProps) {
  const router = useRouter();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const date = event.target.value;

    if (!date) {
      router.push(basePath);
      return;
    }

    router.push(`${basePath}?date=${date}`);
  }

  return (
    <div>
      <label htmlFor="date-filter" className="sr-only">
        Select date
      </label>

      <input
        id="date-filter"
        name="date"
        type="date"
        value={selectedDate}
        max={todayDateKey}
        onChange={handleChange}
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
      />
    </div>
  );
}