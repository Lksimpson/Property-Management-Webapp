import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { convertToUSD } from "@/src/lib/currency";
import { applyTransactionFilters } from "@/src/lib/transactionFilters";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, KNOWN_CATEGORIES } from "@/src/lib/categories";
import TransactionTable from "@/src/components/TransactionTable";
import TransactionFilters from "@/src/components/TransactionFilters";
import MonthlyIncomeExpensesChart from "@/src/components/MonthlyIncomeExpensesChart";
import PropertyStatCards from "@/src/components/PropertyStatCards";
import CategoryBreakdownChart from "@/src/components/CategoryBreakdownChart";
import LargestTransactionsPanel from "@/src/components/LargestTransactionsPanel";
import PropertyTabNav from "@/src/components/PropertyTabNav";
import BudgetManager from "@/src/components/BudgetManager";
import BudgetVsActualChart from "@/src/components/BudgetVsActualChart";
import TenantList from "@/src/components/TenantList";

export const dynamic = "force-dynamic";

type Property = {
  id: string;
  name: string | null;
  address: string | null;
  country: "JM" | "LC" | null;
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

type Budget = {
  id: string;
  category: string;
  period_type: string;
  year: number;
  month: number | null;
  budget_amount: number;
  currency: string;
};

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lease_start: string | null;
  lease_end: string | null;
  monthly_rent: number | null;
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

  const { data: deleteMembership } = await supabase
    .from("property_members")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!deleteMembership || deleteMembership.role !== "owner") {
    redirect("/dashboard");
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
  searchParams: Promise<{
    page?: string;
    tab?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    filterType?: string;
    category?: string;
  }>;
}) {
  const { id: propertyId } = await props.params;
  const searchParamsResolved = await props.searchParams;
  const { page: pageParam } = searchParamsResolved;

  const activeTab = (searchParamsResolved.tab || "overview") as
    | "overview"
    | "transactions"
    | "budgets"
    | "tenants";

  const filterSearch = searchParamsResolved.search || "";
  const filterDateFrom = searchParamsResolved.dateFrom || "";
  const filterDateTo = searchParamsResolved.dateTo || "";
  const filterType = searchParamsResolved.filterType || "";
  const filterCategory = searchParamsResolved.category || "";

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
    .select("id, name, address, country, created_at")
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
    notFound();
  }

  const role = membership.role;
  const canManageTransactions = role === "manager" || role === "owner";
  const canEditProperty = role === "manager" || role === "owner";
  const canDeleteProperty = role === "owner";

  // Fetch currency rates
  const { data: currencyRates = [] } = await supabase
    .from("currency_rates")
    .select("base_currency, target_currency, rate, fetched_at")
    .in("base_currency", ["USD", "JMD", "XCD"])
    .in("target_currency", ["USD", "JMD", "XCD"])
    .order("fetched_at", { ascending: false });

  const rateMap = new Map<string, number>();
  (currencyRates ?? []).forEach((rate) => {
    const key = `${rate.base_currency}-${rate.target_currency}`;
    if (!rateMap.has(key)) {
      rateMap.set(key, Number(rate.rate));
    }
  });

  // Always fetch all transactions for stats/charts
  const { data: allTransactions = [] } = await supabase
    .from("transactions")
    .select("id, date, type, category, payee_payer, description, amount, currency")
    .eq("property_id", propertyId)
    .order("date", { ascending: false });

  // Filtered paginated query for transactions tab
  const filterParams = {
    search: filterSearch || undefined,
    dateFrom: filterDateFrom || undefined,
    dateTo: filterDateTo || undefined,
    filterType: filterType || undefined,
    filterCategory: filterCategory || undefined,
  };

  let countQuery = supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("property_id", propertyId);
  countQuery = applyTransactionFilters(countQuery, filterParams);
  const { count } = await countQuery;

  const totalTransactions = count ?? 0;
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  let txQuery = supabase
    .from("transactions")
    .select("id, date, type, category, payee_payer, description, amount, currency")
    .eq("property_id", propertyId)
    .order("date", { ascending: false })
    .range(offset, offset + transactionsPerPage - 1);
  txQuery = applyTransactionFilters(txQuery, filterParams);
  const { data: transactions = [] } = await txQuery;

  // Stat computations from allTransactions
  let thisMonthIncome = 0, thisMonthExpenses = 0;
  let ytdIncome = 0, ytdExpenses = 0;
  let allTimeIncome = 0, allTimeExpenses = 0;
  const monthlyNets = new Map<string, number>();
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const tx of (allTransactions ?? []) as Transaction[]) {
    if (!tx.date) continue;
    const usd = convertToUSD(tx.amount, (tx.currency || "USD").toUpperCase(), rateMap);
    const sign = tx.type === "income" ? 1 : -1;
    const txMonthKey = tx.date.slice(0, 7);

    if (tx.type === "income") { allTimeIncome += usd; }
    else { allTimeExpenses += usd; }

    if (tx.date >= `${now.getFullYear()}-01-01`) {
      if (tx.type === "income") ytdIncome += usd;
      else ytdExpenses += usd;
    }
    if (txMonthKey === thisMonthKey) {
      if (tx.type === "income") thisMonthIncome += usd;
      else thisMonthExpenses += usd;
    }

    monthlyNets.set(txMonthKey, (monthlyNets.get(txMonthKey) ?? 0) + sign * usd);
  }

  const sortedMonthKeys = Array.from(monthlyNets.keys()).sort();
  const last6 = sortedMonthKeys.slice(-6);
  const avgMonthlyNet = last6.length > 0
    ? last6.reduce((s, k) => s + monthlyNets.get(k)!, 0) / last6.length : 0;

  const thisMonthNet = thisMonthIncome - thisMonthExpenses;
  const ytdNet = ytdIncome - ytdExpenses;
  const allTimeNet = allTimeIncome - allTimeExpenses;
  const expenseRatioPct = allTimeIncome > 0
    ? Math.round((allTimeExpenses / allTimeIncome) * 100) : null;

  const last3FullMonths = sortedMonthKeys.filter(k => k < thisMonthKey).slice(-3);
  const avgLast3 = last3FullMonths.length > 0
    ? last3FullMonths.reduce((s, k) => s + monthlyNets.get(k)!, 0) / last3FullMonths.length : 0;
  const remainingMonths = 11 - now.getMonth();
  const projectedYearEndNet = ytdNet + avgLast3 * remainingMonths;

  const withUsd = (txs: Transaction[]) =>
    txs.filter(tx => tx.date)
       .map(tx => ({ ...tx, usdAmount: convertToUSD(tx.amount, (tx.currency || "USD").toUpperCase(), rateMap) }))
       .sort((a, b) => b.usdAmount - a.usdAmount)
       .slice(0, 5);
  const incomeTxs = withUsd((allTransactions ?? []).filter(tx => tx.type === "income") as Transaction[]);
  const expenseTxs = withUsd((allTransactions ?? []).filter(tx => tx.type === "expense") as Transaction[]);

  // All categories for filter dropdown (canonical + legacy)
  const legacyCats = Array.from(new Set((allTransactions ?? []).map(tx => tx.category).filter(Boolean)))
    .filter(c => !KNOWN_CATEGORIES.has(c!)) as string[];
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES, ...legacyCats].sort();

  // Tab-specific data
  let budgets: Budget[] = [];
  let tenants: Tenant[] = [];

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (activeTab === "budgets") {
    const { data } = await supabase
      .from("budgets")
      .select("id, category, period_type, year, month, budget_amount, currency")
      .eq("property_id", propertyId)
      .eq("year", currentYear)
      .or(`period_type.eq.monthly,period_type.eq.annual`);
    budgets = (data ?? []) as Budget[];
  }

  if (activeTab === "tenants") {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, email, phone, lease_start, lease_end, monthly_rent, currency")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    tenants = (data ?? []) as Tenant[];
  }

  // Server action for budget upsert
  async function upsertBudget(formData: FormData) {
    "use server";
    const supabaseAction = createSupabaseServerClient();
    const { data: { user: actionUser } } = await supabaseAction.auth.getUser();
    if (!actionUser) return;

    const pId = formData.get("propertyId")?.toString();
    const category = formData.get("category")?.toString();
    const year = parseInt(formData.get("year")?.toString() || "0");
    const month = parseInt(formData.get("month")?.toString() || "0");
    const period_type = formData.get("period_type")?.toString() || "monthly";
    const budget_amount = parseFloat(formData.get("budget_amount")?.toString() || "0");
    const existingId = formData.get("id")?.toString();

    if (!pId || !category || !year || Number.isNaN(budget_amount)) return;

    if (existingId) {
      await supabaseAction
        .from("budgets")
        .update({ budget_amount, currency: "USD" })
        .eq("id", existingId);
    } else {
      await supabaseAction.from("budgets").insert({
        property_id: pId,
        category,
        period_type,
        year,
        month: period_type === "monthly" ? month : null,
        budget_amount,
        currency: "USD",
      });
    }
  }

  // Budget actuals for current month
  const budgetActuals = (() => {
    const actuals = new Map<string, number>();
    for (const tx of (allTransactions ?? []) as Transaction[]) {
      if (!tx.date || tx.type !== "expense") continue;
      if (tx.date.slice(0, 7) !== thisMonthKey) continue;
      const cat = tx.category || "Uncategorized";
      const usd = convertToUSD(tx.amount, (tx.currency || "USD").toUpperCase(), rateMap);
      actuals.set(cat, (actuals.get(cat) ?? 0) + usd);
    }
    return actuals;
  })();

  const budgetChartItems = budgets
    .filter(b => b.budget_amount > 0)
    .map(b => ({
      category: b.category,
      budget: b.budget_amount,
      actual: budgetActuals.get(b.category) ?? 0,
    }))
    .sort((a, b) => b.budget - a.budget);

  // Tenant occupancy summary
  const todayStr = now.toISOString().slice(0, 10);
  const activeTenants = tenants.filter(t => {
    if (t.lease_end && t.lease_end < todayStr) return false;
    if (t.lease_start && t.lease_start > todayStr) return false;
    return true;
  });
  const expectedMonthlyRent = activeTenants.reduce((sum, t) => {
    if (!t.monthly_rent) return sum;
    return sum + convertToUSD(t.monthly_rent, (t.currency || "USD").toUpperCase(), rateMap);
  }, 0);
  const nextExpiry = tenants
    .filter(t => t.lease_end && t.lease_end >= todayStr)
    .sort((a, b) => (a.lease_end ?? "").localeCompare(b.lease_end ?? ""))[0];

  // Build export query string from current filters
  const exportParams = new URLSearchParams();
  if (filterSearch) exportParams.set("search", filterSearch);
  if (filterDateFrom) exportParams.set("dateFrom", filterDateFrom);
  if (filterDateTo) exportParams.set("dateTo", filterDateTo);
  if (filterType) exportParams.set("filterType", filterType);
  if (filterCategory) exportParams.set("category", filterCategory);
  const exportQueryString = exportParams.toString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 pb-12 pt-10 lg:px-10">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
            {property.country && (
              <p className="mt-1 text-xs text-slate-500">
                {property.country === "JM" ? "Jamaica" : "St. Lucia"}
              </p>
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

        {/* Tab Navigation */}
        <PropertyTabNav propertyId={propertyId} activeTab={activeTab} />

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <section className="mb-8">
              <PropertyStatCards
                thisMonthNet={thisMonthNet}
                ytdNet={ytdNet}
                allTimeNet={allTimeNet}
                avgMonthlyNet={avgMonthlyNet}
                expenseRatioPct={expenseRatioPct}
              />
            </section>

            <section className="mb-8">
              <MonthlyIncomeExpensesChart
                transactions={(allTransactions ?? []) as Transaction[]}
                currencyRates={rateMap}
              />
            </section>

            <section className="mb-8">
              <CategoryBreakdownChart
                transactions={(allTransactions ?? []) as Transaction[]}
                currencyRates={rateMap}
              />
            </section>

            <section className="mb-8">
              <LargestTransactionsPanel
                topIncome={incomeTxs}
                topExpenses={expenseTxs}
              />
            </section>

            <section className="mb-8">
              <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 mb-1">Projection</p>
                <p className="text-sm text-slate-300">
                  At current pace, projected year-end net:{" "}
                  <span className={`font-semibold ${projectedYearEndNet >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {projectedYearEndNet.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    (based on last {last3FullMonths.length} full month{last3FullMonths.length !== 1 ? "s" : ""})
                  </span>
                </p>
              </div>
            </section>
          </>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <>
            <section className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Transactions</h2>
                <p className="mt-1 text-xs text-slate-400">
                  View and manage all transactions for this property.
                </p>
              </div>
              {canManageTransactions && (
                <div className="flex items-center gap-3">
                  <a
                    href={`/api/properties/${propertyId}/transactions/export${exportQueryString ? `?${exportQueryString}` : ""}`}
                    download
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800/60 transition flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </a>
                  <Link
                    href={`/properties/${propertyId}/transactions/import`}
                    className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-800/60 transition flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

            <TransactionFilters
              propertyId={propertyId}
              allCategories={allCategories}
              initialValues={{
                search: filterSearch,
                dateFrom: filterDateFrom,
                dateTo: filterDateTo,
                filterType,
                filterCategory,
              }}
            />

            <section className="flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4 shadow-lg shadow-black/40">
              {totalTransactions > 0 || filterSearch || filterDateFrom || filterDateTo || filterType || filterCategory ? (
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
                  <h3 className="text-lg font-semibold text-slate-50">No transactions yet</h3>
                  <p className="mt-2 max-w-md text-sm text-slate-400">
                    When you start recording income and expenses for this property, they&apos;ll appear here.
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
          </>
        )}

        {/* Budgets Tab */}
        {activeTab === "budgets" && (
          <>
            <section className="mb-8">
              <BudgetVsActualChart items={budgetChartItems} />
            </section>
            <section>
              <BudgetManager
                budgets={budgets}
                propertyId={propertyId}
                year={currentYear}
                month={currentMonth}
                canManage={canManageTransactions}
                onSave={upsertBudget}
              />
            </section>
          </>
        )}

        {/* Tenants Tab */}
        {activeTab === "tenants" && (
          <>
            {/* Occupancy Summary Card */}
            <section className="mb-6">
              <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-5 shadow-lg shadow-black/40">
                <h2 className="mb-4 text-base font-semibold text-slate-100">Occupancy Summary</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Active Tenants</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-50">{activeTenants.length}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Next Lease Expiry</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {nextExpiry
                        ? new Date(nextExpiry.lease_end! + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </p>
                    {nextExpiry && <p className="text-xs text-slate-500">{nextExpiry.name}</p>}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Expected Rent/mo</p>
                    <p className="mt-1 text-sm font-medium text-emerald-400">
                      {expectedMonthlyRent.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Actual Income This Month</p>
                    <p className="mt-1 text-sm font-medium text-emerald-400">
                      {thisMonthIncome.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-100">Tenants</h2>
              {canManageTransactions && (
                <Link
                  href={`/properties/${propertyId}/tenants/new`}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                >
                  Add tenant
                </Link>
              )}
            </section>

            <TenantList
              tenants={tenants}
              propertyId={propertyId}
              canManage={canManageTransactions}
            />
          </>
        )}
      </div>
    </div>
  );
}
