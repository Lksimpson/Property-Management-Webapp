"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TransactionActions from "./TransactionActions";

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

type TransactionTableProps = {
  transactions: Transaction[];
  propertyId: string;
  canManageTransactions: boolean;
  currencyRates: Map<string, number>;
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
};

type Currency = "USD" | "JMD" | "XCD" | "ALL";

export default function TransactionTable({
  transactions,
  propertyId,
  canManageTransactions,
  currencyRates,
  currentPage,
  totalPages,
  totalTransactions,
}: TransactionTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterCurrency, setFilterCurrency] = useState<Currency>("ALL");
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "JMD" | "XCD">("USD");

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (newPage === 1) {
      params.delete("page");
    } else {
      params.set("page", newPage.toString());
    }
    router.push(`/properties/${propertyId}?${params.toString()}`);
  };

  // Convert amount from source currency to target currency
  // Rates in currency_rates are stored as: base_currency -> target_currency = rate
  // e.g., JMD -> USD = 0.0062 means 1 JMD = 0.0062 USD
  const convertCurrency = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): number => {
    if (fromCurrency === toCurrency) return amount;

    // Normalize to USD first (if not already USD)
    let usdAmount = amount;
    if (fromCurrency !== "USD") {
      const toUsdKey = `${fromCurrency}-USD`;
      const toUsdRate = currencyRates.get(toUsdKey);
      if (toUsdRate !== undefined) {
        usdAmount = amount * toUsdRate;
      } else {
        // If no rate found, return original amount
        console.warn(`No exchange rate found for ${toUsdKey}`);
        return amount;
      }
    }

    // Convert from USD to target currency
    if (toCurrency === "USD") return usdAmount;

    const toTargetKey = `${toCurrency}-USD`;
    const toTargetRate = currencyRates.get(toTargetKey);
    if (toTargetRate !== undefined && toTargetRate > 0) {
      // To convert from USD to target: divide USD amount by the rate
      // e.g., if 1 XCD = 0.37 USD, then X USD = X / 0.37 XCD
      return usdAmount / toTargetRate;
    }

    console.warn(`No exchange rate found for ${toTargetKey}`);
    return usdAmount;
  };

  const filteredTransactions = useMemo(() => {
    const filtered =
      filterCurrency === "ALL"
        ? transactions
        : transactions.filter(
            (tx) => (tx.currency || "USD").toUpperCase() === filterCurrency
          );

    // Convert amounts to display currency
    return filtered.map((tx) => {
      const txCurrency = (tx.currency || "USD").toUpperCase();
      const convertedAmount = convertCurrency(
        tx.amount,
        txCurrency,
        displayCurrency
      );

      return {
        ...tx,
        originalCurrency: txCurrency,
        originalAmount: tx.amount,
        convertedAmount,
        displayCurrency,
      };
    });
  }, [transactions, filterCurrency, displayCurrency, currencyRates]);

  return (
    <>
      {/* Currency Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Filter by currency:
            </span>
            <select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value as Currency)}
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="JMD">JMD</option>
              <option value="XCD">XCD</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Display as:
            </span>
            <select
              value={displayCurrency}
              onChange={(e) =>
                setDisplayCurrency(e.target.value as "USD" | "JMD" | "XCD")
              }
              className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
            >
              <option value="USD">USD</option>
              <option value="JMD">JMD</option>
              <option value="XCD">XCD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Type</th>
              <th className="py-3 pr-4">Category</th>
              <th className="py-3 pr-4">Counterparty</th>
              <th className="py-3 pr-4">Description</th>
              <th className="py-3 pr-4 text-right">Amount</th>
              <th className="py-3 pr-4">Currency</th>
              {canManageTransactions && (
                <th className="py-3 pr-4 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx: any) => {
                const txCurrency = tx.originalCurrency;
                const showOriginalCurrency = txCurrency !== tx.displayCurrency;

                return (
                  <tr key={tx.id} className="align-middle">
                    <td className="py-3 pr-4 text-slate-200">
                      {tx.date
                        ? new Date(tx.date + "T00:00:00").toLocaleDateString()
                        : "—"}
                    </td>
                    <td
                      className={`py-3 pr-4 text-xs font-medium ${
                        tx.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "Income" : "Expense"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {tx.category ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {tx.payee_payer ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {tx.description ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-100">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">
                          {tx.convertedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {tx.displayCurrency}
                        </span>
                        {showOriginalCurrency && (
                          <span className="text-xs text-slate-500">
                            ({tx.originalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            {txCurrency})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      <span className="inline-flex items-center rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                        {txCurrency}
                      </span>
                    </td>
                    {canManageTransactions && (
                      <td className="py-3 pr-4 text-right">
                        <TransactionActions
                          transactionId={tx.id}
                          propertyId={propertyId}
                          transactionDescription={
                            tx.description ||
                            `${tx.type === "income" ? "Income" : "Expense"}: ${tx.originalAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ${txCurrency}`
                          }
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={canManageTransactions ? 8 : 7}
                  className="py-8 text-center text-slate-400"
                >
                  No transactions found for the selected currency.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalTransactions)} of{" "}
            {totalTransactions} transactions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updatePage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 px-4 py-2 text-sm text-slate-200">
              <span className="text-slate-400">Page</span>
              <span className="font-medium">{currentPage}</span>
              <span className="text-slate-400">of</span>
              <span className="font-medium">{totalPages}</span>
            </div>
            <button
              onClick={() => updatePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
}

