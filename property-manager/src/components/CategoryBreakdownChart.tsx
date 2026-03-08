"use client";

import { useState, useMemo } from "react";
import { convertToUSD as convertToUSDUtil } from "@/src/lib/currency";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Transaction = {
  date: string | null;
  type: "income" | "expense";
  category: string | null;
  amount: number;
  currency: string | null;
};

type Props = {
  transactions: Transaction[];
  currencyRates: Map<string, number>;
};

export default function CategoryBreakdownChart({
  transactions,
  currencyRates,
}: Props) {
  const [mode, setMode] = useState<"expense" | "income">("expense");

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();

    transactions
      .filter((tx) => tx.type === mode && tx.date)
      .forEach((tx) => {
        const category = tx.category ?? "Uncategorized";
        const usd = convertToUSDUtil(
          tx.amount,
          (tx.currency || "USD").toUpperCase(),
          currencyRates
        );
        totals.set(category, (totals.get(category) ?? 0) + usd);
      });

    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [transactions, mode, currencyRates]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="text-sm font-semibold text-slate-200">
            {payload[0].payload.category}
          </p>
          <p className="text-sm" style={{ color: payload[0].fill }}>
            {payload[0].value.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">
          Category Breakdown
        </h2>
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900/60 p-1">
          {(["expense", "income"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wider transition ${
                mode === m
                  ? m === "expense"
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-emerald-500/20 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {m === "expense" ? "Expenses" : "Income"}
            </button>
          ))}
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.3}
            />
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
              width={100}
              style={{ fontSize: "12px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="total"
              fill={mode === "income" ? "#10b981" : "#f43f5e"}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[280px] items-center justify-center text-slate-400">
          <p>No {mode} data available</p>
        </div>
      )}
    </div>
  );
}
