"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface LineConfig {
  dataKey: string;
  color: string;
  name: string;
}

interface SimpleLineChartProps {
  data: any[];
  lines: LineConfig[];
  xAxisKey: string;
  height?: number;
}

export function SimpleLineChart({
  data,
  lines,
  xAxisKey,
  height = 300,
}: SimpleLineChartProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 transition-all duration-200">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey={xAxisKey}
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
            cursor={{ stroke: "#94a3b8", strokeDasharray: "5 5" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            verticalAlign="bottom"
            height={24}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              dot={false}
              strokeWidth={2}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
