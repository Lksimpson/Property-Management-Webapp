"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type MonthlyDataPoint = {
  month: string;
  monthLabel: string;
  net: number;
};

type Props = {
  monthlyData: MonthlyDataPoint[];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const net = payload[0].value as number;
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
        <p className="mb-1 text-sm font-semibold text-slate-200">{label}</p>
        <p className={`text-sm font-medium ${net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          Net:{" "}
          {net.toLocaleString(undefined, {
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

export default function PortfolioTrendChart({ monthlyData }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
          <svg
            className="h-5 w-5 text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-100">
          Portfolio Net Cash Flow — Last 6 Months
        </h2>
      </div>

      {monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis dataKey="monthLabel" stroke="#94a3b8" style={{ fontSize: "12px" }} />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tickFormatter={(v) =>
                v >= 1000 || v <= -1000
                  ? `$${(v / 1000).toFixed(0)}k`
                  : `$${v}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="net"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#netGradient)"
              name="Net"
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[220px] items-center justify-center text-slate-400">
          <p>No transaction data available</p>
        </div>
      )}
    </div>
  );
}
