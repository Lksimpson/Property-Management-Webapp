import Link from "next/link";
import SignOutButton from "@/src/components/SignOutButton";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

type Property = {
  id: string;
  name: string | null;
  address: string | null;
};

type Transaction = {
  property_id: string;
  amount: number;
  type: "income" | "expense";
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch properties the current user has access to (RLS-enforced).
  const { data: rawProperties } = await supabase
    .from("properties")
    .select("id, name, address")
    .order("created_at", { ascending: false });

  const properties: Property[] = rawProperties ?? [];

  const propertyIds = properties.map((p) => p.id);

  // Fetch transactions for this month for all of the user's properties.
  let totalIncome = 0;
  let totalExpenses = 0;

  if (propertyIds.length > 0) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);

    const { data: transactions = [] } = await supabase
      .from("transactions")
      .select("property_id, amount, type")
      .in("property_id", propertyIds)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth);

    for (const tx of transactions as Transaction[]) {
      if (tx.type === "income") {
        totalIncome += Number(tx.amount);
      } else if (tx.type === "expense") {
        totalExpenses += Number(tx.amount);
      }
    }
  }

  const netCashFlow = totalIncome - totalExpenses;

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
                {session.user.email?.split("@")[0] ?? "Manager"}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SignOutButton />
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40">
              {session.user.email?.[0]?.toUpperCase() ?? "U"}
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
            />
            <StatCard
              label="Total Expenses"
              value={totalExpenses}
              icon="−"
              trendLabel="vs last month"
              positive={false}
            />
            <StatCard
              label="Net Cash Flow"
              value={netCashFlow}
              icon="₵"
              trendLabel="vs last month"
              positive={netCashFlow >= 0}
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

        {/* Properties */}
        <section className="mt-10 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-100">
              Your Properties
            </h2>
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
              {properties.map((property) => (
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
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.7rem] uppercase tracking-wide">
                          This month
                        </span>
                        <span className="text-[0.7rem] text-slate-500">
                          Income / Expenses / Net
                        </span>
                      </div>
                      {/* Placeholder mini-metrics per property – can be wired to real data later */}
                      <div className="text-right text-[0.7rem]">
                        <p className="text-emerald-400">—</p>
                        <p className="text-rose-400">—</p>
                        <p className="text-sky-400">—</p>
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
              ))}
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
};

function StatCard({
  label,
  value,
  icon,
  trendLabel,
  positive,
  isCount,
}: StatCardProps) {
  const formattedValue = isCount
    ? value.toString()
    : value.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

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
            positive ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {/* Placeholder trend; can be wired to real comparisons later */}
          {positive ? "↑" : "↓"} 0% {trendLabel}
        </p>
      )}
    </div>
  );
}
