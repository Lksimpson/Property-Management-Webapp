import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import TransactionTable from "@/src/components/TransactionTable";
import MonthlyIncomeExpensesChart from "@/src/components/MonthlyIncomeExpensesChart";

export const dynamic = "force-dynamic";

type Property = {
  id: string;
  name: string | null;
  address: string | null;
  created_at: string;
};

type Membership = {
  role: "viewer" | "manager" | "owner";
};

type Transaction = {
  id: string;
  date: string | null;
  type: "income" | "expense";
  category: string | null;
  payee_payer: string | null;
  description: string | null;
  amount: number;
  currency: string | null;
};

async function deleteProperty(formData: FormData) {
  "use server";

  const propertyId = formData.get("propertyId")?.toString();
  if (!propertyId) {
    redirect("/dashboard");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId);

  if (error) {
    console.error("Error deleting property:", error);
  }

  redirect("/dashboard");
}

export default async function PropertyDetailsPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id: propertyId } = await props.params;
  const { page: pageParam } = await props.searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10));
  const transactionsPerPage = 10;
  const offset = (currentPage - 1) * transactionsPerPage;

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch property
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, address, created_at")
    .eq("id", propertyId)
    .single<Property>();

  if (propertyError || !property) {
    notFound();
  }

  // Fetch membership for this user
  const { data: membership } = await supabase
    .from("property_members")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single<Membership>();

  if (!membership) {
    // User is not a member; rely on RLS, but we also guard the UI here.
    notFound();
  }

  const role = membership.role;
  const canManageTransactions = role === "manager" || role === "owner";
  const canEditProperty = role === "manager" || role === "owner";
  const canDeleteProperty = role === "owner";

  // Fetch all transactions for this property (for chart)
  const { data: allTransactions = [] } = await supabase
    .from("transactions")
    .select("id, date, type, amount, currency")
    .eq("property_id", propertyId)
    .order("date", { ascending: false });

  // Get total count for pagination
  const { count } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const totalTransactions = count ?? 0;
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  // Fetch paginated transactions for the table (efficient query)
  const { data: transactions = [] } = await supabase
    .from("transactions")
    .select(
      "id, date, type, category, payee_payer, description, amount, currency"
    )
    .eq("property_id", propertyId)
    .order("date", { ascending: false })
    .range(offset, offset + transactionsPerPage - 1);

  // Fetch currency rates (get the most recent rate for each currency pair)
  const { data: currencyRates = [] } = await supabase
    .from("currency_rates")
    .select("base_currency, target_currency, rate, fetched_at")
    .in("base_currency", ["USD", "JMD", "XCD"])
    .in("target_currency", ["USD", "JMD", "XCD"])
    .order("fetched_at", { ascending: false });

  // Build a map for quick lookup: { "JMD-USD": 0.0062, "XCD-USD": 0.37, etc. }
  // Only keep the most recent rate for each pair (since we ordered DESC)
  const rateMap = new Map<string, number>();
  (currencyRates ?? []).forEach((rate) => {
    const key = `${rate.base_currency}-${rate.target_currency}`;
    // Only set if not already in map (since we're processing from most recent to oldest)
    if (!rateMap.has(key)) {
      rateMap.set(key, Number(rate.rate));
    }
  });

  const hasTransactions = (transactions as Transaction[]).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-12 pt-10 lg:px-10">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              Property
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
              {property.name ?? "Untitled property"}
            </h1>
            {property.address && (
              <p className="mt-1 text-sm text-slate-400">{property.address}</p>
            )}
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300 ring-1 ring-slate-700/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="uppercase tracking-[0.18em]">
                {role} access
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-slate-200"
            >
              ← Back to dashboard
            </Link>
            {canEditProperty && (
              <Link
                href={`/properties/${propertyId}/edit`}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 hover:bg-slate-800/60"
              >
                Edit property
              </Link>
            )}
            {canDeleteProperty && (
              <form action={deleteProperty}>
                <input type="hidden" name="propertyId" value={propertyId} />
                <button
                  type="submit"
                  className="rounded-full border border-rose-500/70 px-4 py-2 text-sm text-rose-300 hover:border-rose-400 hover:bg-rose-500/10"
                >
                  Delete property
                </button>
              </form>
            )}
          </div>
        </header>

        {/* Monthly Income vs Expenses Chart */}
        <section className="mb-8">
          <MonthlyIncomeExpensesChart
            transactions={(allTransactions ?? []) as Transaction[]}
            currencyRates={rateMap}
          />
        </section>

        {/* Transactions header */}
        <section className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Transactions
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              View and manage all transactions for this property.
            </p>
          </div>
          {canManageTransactions && (
            <div className="flex items-center gap-3">
              <Link
                href={`/properties/${propertyId}/transactions/import`}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800/60 transition flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Import XLSX
              </Link>
              <Link
                href={`/properties/${propertyId}/transactions/new`}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Add transaction
              </Link>
            </div>
          )}
        </section>

        {/* Transactions list / empty state */}
        <section className="mt-5 flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4 shadow-lg shadow-black/40">
          {hasTransactions ? (
            <Suspense fallback={<div className="py-8 text-center text-slate-400">Loading transactions...</div>}>
              <TransactionTable
                transactions={transactions as Transaction[]}
                propertyId={propertyId}
                canManageTransactions={canManageTransactions}
                currencyRates={rateMap}
                currentPage={currentPage}
                totalPages={totalPages}
                totalTransactions={totalTransactions}
              />
            </Suspense>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-50">
                No transactions yet
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                When you start recording income and expenses for this property,
                they&apos;ll appear here. Use transactions to track cash flow,
                tenants, vendors, and more.
              </p>
              {canManageTransactions && (
                <Link
                  href={`/properties/${propertyId}/transactions/new`}
                  className="mt-6 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                >
                  Add first transaction
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}


