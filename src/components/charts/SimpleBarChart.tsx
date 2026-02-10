"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SimpleBarChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  color?: string;
  height?: number;
}

export function SimpleBarChart({
  data,
  dataKey,
  nameKey,
  color = "#D97706",
  height = 300,
}: SimpleBarChartProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 transition-all duration-200">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey={nameKey}
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
          />
          <YAxis stroke="#94a3b8" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            cursor={{ fill: "rgba(217, 119, 6, 0.1)" }}
          />
          <Bar
            dataKey={dataKey}
            fill={color}
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
