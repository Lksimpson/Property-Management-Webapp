"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

type BudgetItem = {
  category: string;
  budget: number;
  actual: number;
};

type Props = {
  items: BudgetItem[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
        <p className="mb-2 text-sm font-semibold text-slate-200">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-sm" style={{ color: entry.color ?? entry.fill }}>
            {entry.name}:{" "}
            {entry.value.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function BudgetVsActualChart({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Budget vs. Actual</h2>
        <div className="flex h-[200px] items-center justify-center text-slate-400">
          <p>No budgets set yet. Set budgets below to see the chart.</p>
        </div>
      </div>
    );
  }

  const chartHeight = Math.max(200, items.length * 50);

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <h2 className="text-lg font-semibold text-slate-100 mb-6">Budget vs. Actual</h2>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={items}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tickFormatter={(v) =>
              `$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
            }
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#94a3b8"
            width={140}
            style={{ fontSize: "11px" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            formatter={(value) => (
              <span className="text-sm text-slate-300">{value}</span>
            )}
          />
          <Bar dataKey="budget" name="Budget" fill="#64748b" radius={[0, 4, 4, 0]} />
          <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]}>
            {items.map((item, index) => (
              <Cell
                key={index}
                fill={item.actual <= item.budget ? "#10b981" : "#f43f5e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
