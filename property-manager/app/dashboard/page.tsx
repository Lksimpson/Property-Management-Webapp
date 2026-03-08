import Link from "next/link";
import SignOutButton from "@/src/components/SignOutButton";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { convertToUSD } from "@/src/lib/currency";
import PortfolioTrendChart from "@/src/components/PortfolioTrendChart";

export const dynamic = "force-dynamic";

type Property = {
  id: string;
  name: string | null;
  address: string | null;
  country: "JM" | "LC" | null;
};

type Transaction = {
  property_id: string;
  amount: number;
  type: "income" | "expense";
  currency: string | null;
  date: string | null;
};

export default async function DashboardPage(props: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: countryFilter } = await props.searchParams;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch properties the current user has access to (RLS-enforced).
  let propertiesQuery = supabase
    .from("properties")
    .select("id, name, address, country")
    .order("created_at", { ascending: false });

  if (countryFilter === "JM" || countryFilter === "LC") {
    propertiesQuery = propertiesQuery.eq("country", countryFilter);
  }

  const { data: rawProperties } = await propertiesQuery;

  const properties: Property[] = rawProperties ?? [];

  const propertyIds = properties.map((p) => p.id);

  // Fetch currency rates for conversion
  const { data: currencyRates = [] } = await supabase
    .from("currency_rates")
    .select("base_currency, target_currency, rate, fetched_at")
    .in("base_currency", ["USD", "JMD", "XCD"])
    .in("target_currency", ["USD", "JMD", "XCD"])
    .order("fetched_at", { ascending: false });

  // Build a map for quick lookup
  const rateMap = new Map<string, number>();
  (currencyRates ?? []).forEach((rate) => {
    const key = `${rate.base_currency}-${rate.target_currency}`;
    if (!rateMap.has(key)) {
      rateMap.set(key, Number(rate.rate));
    }
  });

  // Fetch transactions for the last 6 months across all of the user's properties.
  let totalIncome = 0;
  let totalExpenses = 0;
  let lastMonthIncome = 0;
  let lastMonthExpenses = 0;
  const propertyStats = new Map<string, { income: number; expenses: number }>();
  const portfolioMonthlyData: { month: string; monthLabel: string; net: number }[] = [];

  if (propertyIds.length > 0) {
    const now = new Date();

    function formatLocalDate(d: Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const sixMonthsAgo = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const { data: allTx = [] } = await supabase
      .from("transactions")
      .select("property_id, amount, type, currency, date")
      .in("property_id", propertyIds)
      .gte("date", sixMonthsAgo);

    const monthlyMap = new Map<string, number>();

    for (const tx of allTx as (Transaction & { date: string | null })[]) {
      const txCurrency = (tx.currency || "USD").toUpperCase();
      const usdAmount = convertToUSD(Number(tx.amount), txCurrency, rateMap);
      const sign = tx.type === "income" ? 1 : -1;
      const txMonth = tx.date ? tx.date.slice(0, 7) : null;

      if (!propertyStats.has(tx.property_id)) {
        propertyStats.set(tx.property_id, { income: 0, expenses: 0 });
      }

      if (txMonth === thisMonthKey) {
        const stats = propertyStats.get(tx.property_id)!;
        if (tx.type === "income") { totalIncome += usdAmount; stats.income += usdAmount; }
        else { totalExpenses += usdAmount; stats.expenses += usdAmount; }
      }

      if (txMonth === lastMonthKey) {
        if (tx.type === "income") lastMonthIncome += usdAmount;
        else lastMonthExpenses += usdAmount;
      }

      if (txMonth) {
        monthlyMap.set(txMonth, (monthlyMap.get(txMonth) ?? 0) + sign * usdAmount);
      }
    }

    // Build sorted 6-month portfolio trend
    const sortedMonths = Array.from(monthlyMap.keys()).sort();
    for (const month of sortedMonths) {
      const [year, monthNum] = month.split("-");
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      portfolioMonthlyData.push({
        month,
        monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
        net: monthlyMap.get(month)!,
      });
    }
  }

  const netCashFlow = totalIncome - totalExpenses;
  const lastMonthNet = lastMonthIncome - lastMonthExpenses;

  function pctChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  }

  const incomePct = pctChange(totalIncome, lastMonthIncome);
  const expensesPct = pctChange(totalExpenses, lastMonthExpenses);
  const netPct = pctChange(netCashFlow, lastMonthNet);

  const hasProperties = properties.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 pb-12 pt-10 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" — "}
              Here&apos;s a snapshot of your properties
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-50">
              Welcome back,{" "}
              <span className="text-emerald-400">
                {user.email?.split("@")[0] ?? "Manager"}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* At a Glance */}
        <section className="mt-10">
          <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">
            At a Glance
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Income"
              value={totalIncome}
              icon="$"
              trendLabel="vs last month"
              positive
              trendPct={incomePct}
            />
            <StatCard
              label="Total Expenses"
              value={totalExpenses}
              icon="−"
              trendLabel="vs last month"
              positive={false}
              trendPct={expensesPct}
            />
            <StatCard
              label="Net Cash Flow"
              value={netCashFlow}
              icon="₵"
              trendLabel="vs last month"
              positive={netCashFlow >= 0}
              trendPct={netPct}
            />
            <StatCard
              label="Properties"
              value={properties.length}
              icon="🏢"
              trendLabel=""
              positive
              isCount
            />
          </div>
        </section>

        {/* Portfolio Trend */}
        {portfolioMonthlyData.length > 0 && (
          <section className="mt-10">
            <PortfolioTrendChart monthlyData={portfolioMonthlyData} />
          </section>
        )}

        {/* Properties */}
        <section className="mt-10 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-slate-100">
                Your Properties
              </h2>
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className={`rounded-full px-3 py-1 text-xs border transition ${!countryFilter ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >
                  All
                </Link>
                <Link
                  href="/dashboard?country=JM"
                  className={`rounded-full px-3 py-1 text-xs border transition ${countryFilter === "JM" ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >
                  Jamaica
                </Link>
                <Link
                  href="/dashboard?country=LC"
                  className={`rounded-full px-3 py-1 text-xs border transition ${countryFilter === "LC" ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300" : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                >
                  St. Lucia
                </Link>
              </div>
            </div>
            {hasProperties && (
              <Link
                href="/properties/new"
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Add property
              </Link>
            )}
          </div>

          {hasProperties ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {properties.map((property) => {
                const stats = propertyStats.get(property.id) || {
                  income: 0,
                  expenses: 0,
                };
                const net = stats.income - stats.expenses;

                return (
                  <article
                    key={property.id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/80 to-slate-900 border border-slate-800/80 shadow-lg shadow-black/40"
                  >
                    <div className="relative h-32 overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-700">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,#22c55e33,transparent_55%),radial-gradient(circle_at_100%_100%,#38bdf833,transparent_55%)]" />
                    </div>
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                      <h3 className="truncate text-sm font-semibold text-slate-50">
                        {property.name ?? "Untitled property"}
                      </h3>
                      {property.address && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                          {property.address}
                        </p>
                      )}
                      {property.country && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-slate-800/60 px-2 py-0.5 text-[0.65rem] font-medium text-slate-400 ring-1 ring-slate-700/60">
                          {property.country === "JM" ? "Jamaica" : "St. Lucia"}
                        </span>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex flex-col gap-1">
                          <span className="text-[0.7rem] uppercase tracking-wide">
                            This month
                          </span>
                          <span className="text-[0.7rem] text-slate-500">
                            Income / Expenses / Net
                          </span>
                        </div>
                        <div className="text-right text-[0.7rem]">
                          <p className="text-emerald-400">
                            {stats.income.toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <p className="text-rose-400">
                            {stats.expenses.toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>
                          <p
                            className={
                              net >= 0 ? "text-emerald-400" : "text-rose-400"
                            }
                          >
                            {net.toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Link
                          href={`/properties/${property.id}`}
                          className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                        >
                          View details →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-slate-50">
                No properties yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Start by adding your first property. Once created, you&apos;ll
                be able to track income, expenses, and cash flow all in one
                place.
              </p>
              <Link
                href="/properties/new"
                className="mt-6 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Add your first property
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: string;
  trendLabel: string;
  positive: boolean;
  isCount?: boolean;
  trendPct?: number | null;
};

function StatCard({
  label,
  value,
  icon,
  trendLabel,
  positive,
  isCount,
  trendPct,
}: StatCardProps) {
  const formattedValue = isCount
    ? value.toString()
    : value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

  // For expense cards, fewer expenses is good (negative pct = positive outcome)
  const trendIsPositive =
    trendPct == null ? positive : positive ? trendPct >= 0 : trendPct <= 0;

  const trendText =
    trendPct == null
      ? `— ${trendLabel}`
      : `${trendPct >= 0 ? "↑" : "↓"} ${Math.abs(trendPct)}% ${trendLabel}`;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-50">
            {formattedValue}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-xs text-emerald-300 ring-1 ring-emerald-500/40">
          {icon}
        </div>
      </div>
      {trendLabel && (
        <p
          className={`mt-2 text-xs ${
            trendIsPositive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {trendText}
        </p>
      )}
    </div>
  );
}
