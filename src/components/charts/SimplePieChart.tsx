"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  color?: string;
}

interface SimplePieChartProps {
  /** no border/padding wrapper (when rendered inside a kit Card) */
  bare?: boolean;
  data: PieDataItem[];
  height?: number;
  innerRadius?: number;
}

const defaultColors = [
  "#D97706",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#16a34a",
  "#ca8a04",
];

export function SimplePieChart({
  bare,
  data,
  height = 300,
  innerRadius,
}: SimplePieChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  return (
    <div className={bare ? "" : "bg-white border border-slate-200 rounded-lg p-6"}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#e2e8f0" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            formatter={(value: any) => `${value}`}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            verticalAlign="bottom"
            height={24}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
