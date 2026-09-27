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
    <div className="relative h-[300px] w-full sm:h-[340px]">
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
            stroke="rgba(255, 255, 255, 0.06)"
            strokeDasharray="3 4"
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#6d7a75",
            }}
            dy={8}
            interval="preserveStartEnd"
            minTickGap={20}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#6d7a75",
            }}
            width={40}
            domain={[
              0,
              (dataMax: number) => Math.max(Math.ceil(dataMax * 1.2), 4),
            ]}
          />

          <Tooltip
            cursor={{
              fill: "rgba(255, 255, 255, 0.05)",
            }}
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "#141c25",
              boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.7)",
              padding: "10px 12px",
            }}
            labelStyle={{
              color: "#eef2f0",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
            }}
            itemStyle={{
              fontSize: "12px",
              color: "#a3afaa",
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
            fill="rgba(255, 255, 255, 0.22)"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>

      {!hasData && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-qz-surface/85 text-center">
          <p className="text-sm font-medium text-qz-text-2">
            No activity yet
          </p>

          <p className="mt-1 text-xs text-qz-text-3">
            Activity will appear here throughout the day.
          </p>
        </div>
      )}
    </div>
  );
}