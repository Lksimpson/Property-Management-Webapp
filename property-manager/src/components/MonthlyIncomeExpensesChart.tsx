"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

type Transaction = {
  date: string | null;
  type: "income" | "expense";
  amount: number;
  currency: string | null;
};

type MonthlyIncomeExpensesChartProps = {
  transactions: Transaction[];
  currencyRates: Map<string, number>;
};

type Currency = "USD" | "JMD" | "XCD";

type ChartDataPoint = {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
};

export default function MonthlyIncomeExpensesChart({
  transactions,
  currencyRates,
}: MonthlyIncomeExpensesChartProps) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");

  // Convert amount from source currency to target currency
  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency) return amount;

    let usdAmount = amount;
    if (fromCurrency !== "USD") {
      const toUsdKey = `${fromCurrency}-USD`;
      const toUsdRate = currencyRates.get(toUsdKey);
      if (toUsdRate !== undefined) {
        usdAmount = amount * toUsdRate;
      } else {
        console.warn(`No exchange rate found for ${toUsdKey}`);
        return amount;
      }
    }

    if (toCurrency === "USD") return usdAmount;

    const toTargetKey = `${toCurrency}-USD`;
    const toTargetRate = currencyRates.get(toTargetKey);
    if (toTargetRate !== undefined && toTargetRate > 0) {
      return usdAmount / toTargetRate;
    }

    console.warn(`No exchange rate found for ${toTargetKey}`);
    return usdAmount;
  };

  // Group transactions by month and calculate totals
  const chartData = useMemo(() => {
    const monthlyData = new Map<
      string,
      { income: number; expenses: number }
    >();

    transactions.forEach((tx) => {
      if (!tx.date) return;

      const date = new Date(tx.date + "T00:00:00");
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = date.toLocaleDateString("en-US", {
        month: "short",
      });

      const txCurrency = (tx.currency || "USD").toUpperCase();
      const convertedAmount = convertCurrency(
        tx.amount,
        txCurrency,
        displayCurrency
      );

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          income: 0,
          expenses: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      if (tx.type === "income") {
        data.income += convertedAmount;
      } else {
        data.expenses += convertedAmount;
      }
    });

    // Convert to array and sort by month
    const dataArray: ChartDataPoint[] = Array.from(monthlyData.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
          month: monthKey,
          monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
          income: data.income,
          expenses: data.expenses,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get last 6 months if we have more data
    return dataArray.slice(-6);
  }, [transactions, displayCurrency, currencyRates]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
          <p className="mb-2 text-sm font-semibold text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}:{" "}
              {entry.value.toLocaleString(undefined, {
                style: "currency",
                currency: displayCurrency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">
            Monthly Income vs Expenses
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            Display as:
          </span>
          <select
            value={displayCurrency}
            onChange={(e) =>
              setDisplayCurrency(e.target.value as Currency)
            }
            className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
          >
            <option value="USD">USD</option>
            <option value="JMD">JMD</option>
            <option value="XCD">XCD</option>
          </select>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#10b981"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#10b981"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#f43f5e"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#f43f5e"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.3}
            />
            <XAxis
              dataKey="monthLabel"
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `$${(value / 1000).toFixed(0)}k`;
                }
                return `$${value}`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-slate-300">{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorIncome)"
              name="Income"
              dot={{ fill: "#10b981", r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#colorExpenses)"
              name="Expenses"
              dot={{ fill: "#f43f5e", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[300px] items-center justify-center text-slate-400">
          <p>No transaction data available to display</p>
        </div>
      )}
    </div>
  );
}

