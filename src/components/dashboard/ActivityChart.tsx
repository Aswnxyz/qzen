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
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 12,
            right: 8,
            left: -18,
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
            width={32}
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
            fill="#d4d4d8"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}