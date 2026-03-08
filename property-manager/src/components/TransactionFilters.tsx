"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

type TransactionFiltersProps = {
  propertyId: string;
  allCategories: string[];
  initialValues: {
    search: string;
    dateFrom: string;
    dateTo: string;
    filterType: string;
    filterCategory: string;
  };
};

export default function TransactionFilters({
  propertyId,
  allCategories,
  initialValues,
}: TransactionFiltersProps) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushFilters(overrides: Partial<typeof initialValues>) {
    const vals = { ...initialValues, ...overrides };
    const params = new URLSearchParams();
    params.set("tab", "transactions");
    params.delete("page");
    if (vals.search) params.set("search", vals.search);
    if (vals.dateFrom) params.set("dateFrom", vals.dateFrom);
    if (vals.dateTo) params.set("dateTo", vals.dateTo);
    if (vals.filterType) params.set("filterType", vals.filterType);
    if (vals.filterCategory) params.set("category", vals.filterCategory);
    router.push(`/properties/${propertyId}?${params.toString()}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ search: value });
    }, 300);
  }

  function handleClear() {
    router.push(`/properties/${propertyId}?tab=transactions`);
  }

  const hasFilters =
    initialValues.search ||
    initialValues.dateFrom ||
    initialValues.dateTo ||
    initialValues.filterType ||
    initialValues.filterCategory;

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Search</span>
        <input
          type="text"
          placeholder="Payee, description, category..."
          defaultValue={initialValues.search}
          onChange={handleSearchChange}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 w-56"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">From</span>
        <input
          type="date"
          defaultValue={initialValues.dateFrom}
          onChange={(e) => pushFilters({ dateFrom: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">To</span>
        <input
          type="date"
          defaultValue={initialValues.dateTo}
          onChange={(e) => pushFilters({ dateTo: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Type</span>
        <select
          value={initialValues.filterType}
          onChange={(e) => pushFilters({ filterType: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Category</span>
        <select
          value={initialValues.filterCategory}
          onChange={(e) => pushFilters({ filterCategory: e.target.value })}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
        >
          <option value="">All Categories</option>
          <option value="Uncategorized">Uncategorized</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={handleClear}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-500 hover:text-slate-200 transition self-end"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
