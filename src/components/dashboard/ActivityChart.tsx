"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ActivityItem = {
  hour: number;
  label: string;
  joined: number;
  served: number;
};

type ActivityChartProps = {
  data: ActivityItem[];
};

export default function ActivityChart({
  data,
}: ActivityChartProps) {
  const hasData = data.some(
    (item) => item.joined > 0 || item.served > 0,
  );

  return (
    <div className="relative h-[280px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 12,
            right: 8,
            left: 0,
            bottom: 4,
          }}
          barGap={4}
          barCategoryGap="28%"
        >
          <CartesianGrid
            vertical={false}
            stroke="#e4e4e7"
            strokeDasharray="3 4"
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#71717a",
            }}
            dy={8}
            interval="preserveStartEnd"
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#71717a",
            }}
            width={40}
            domain={[
              0,
              (dataMax: number) => Math.max(Math.ceil(dataMax * 1.2), 4),
            ]}
          />

          <Tooltip
            cursor={{
              fill: "#f4f4f5",
              opacity: 0.6,
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e4e4e7",
              backgroundColor: "#ffffff",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
              padding: "10px 12px",
            }}
            labelStyle={{
              color: "#18181b",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
            }}
            itemStyle={{
              fontSize: "12px",
              padding: "2px 0",
            }}
          />

          <Bar
            dataKey="joined"
            name="Joined"
            fill="#10b981"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />

          <Bar
            dataKey="served"
            name="Served"
            fill="#a1a1aa"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>

      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/80 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No activity yet
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Activity will appear here throughout the day.
          </p>
        </div>
      )}
    </div>
  );
}