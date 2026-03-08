"use client";

import { useState } from "react";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/src/lib/categories";

type Budget = {
  id: string;
  category: string;
  period_type: string;
  year: number;
  month: number | null;
  budget_amount: number;
  currency: string;
};

type Props = {
  budgets: Budget[];
  propertyId: string;
  year: number;
  month: number;
  canManage: boolean;
  onSave: (formData: FormData) => Promise<void>;
};

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export default function BudgetManager({
  budgets,
  propertyId,
  year,
  month,
  canManage,
  onSave,
}: Props) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const budgetMap = new Map(budgets.map((b) => [b.category, b]));

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Monthly Budgets</h2>
        <span className="text-sm text-slate-400">
          {new Date(year, month - 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="py-3 pr-4 text-left">Category</th>
              <th className="py-3 pr-4 text-right">Budget (USD)</th>
              {canManage && <th className="py-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {ALL_CATEGORIES.map((category) => {
              const existing = budgetMap.get(category);
              const isEditing = editingCategory === category;

              return (
                <tr key={category} className="align-middle">
                  <td className="py-3 pr-4 text-slate-300">{category}</td>
                  <td className="py-3 pr-4 text-right">
                    {isEditing ? (
                      <form
                        action={async (formData) => {
                          await onSave(formData);
                          setEditingCategory(null);
                        }}
                        className="flex items-center justify-end gap-2"
                      >
                        <input type="hidden" name="propertyId" value={propertyId} />
                        <input type="hidden" name="category" value={category} />
                        <input type="hidden" name="year" value={year} />
                        <input type="hidden" name="month" value={month} />
                        <input type="hidden" name="period_type" value="monthly" />
                        {existing && <input type="hidden" name="id" value={existing.id} />}
                        <input
                          type="number"
                          name="budget_amount"
                          step="0.01"
                          min="0"
                          defaultValue={existing?.budget_amount ?? ""}
                          placeholder="0.00"
                          autoFocus
                          className="w-32 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-medium text-emerald-950 hover:bg-emerald-400 transition"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 transition"
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <span className={existing ? "text-slate-100 font-medium" : "text-slate-500"}>
                        {existing
                          ? existing.budget_amount.toLocaleString(undefined, {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            })
                          : "—"}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3 text-right">
                      {!isEditing && (
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-xs text-slate-400 hover:text-slate-200 transition"
                        >
                          {existing ? "Edit" : "Set"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
