"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type PreviewRow = {
  date: string | null;
  type: string;
  category: string | null;
  payee_payer: string | null;
  description: string | null;
  amount: number;
  currency: string | null;
};

export default function TransactionImportClient({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePreview(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMessage('Please choose a file first');
    setLoading(true);
    setMessage(null);
    setErrors([]);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('propertyId', propertyId);
    fd.append('action', 'preview');

    try {
      const res = await fetch('/api/transactions/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message || 'Preview failed');
        if (json.errors) setErrors(json.errors);
      } else {
        setPreview(json.preview || []);
        setErrors(json.errors || []);
      }
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMessage('Please choose a file first');
    if (!confirm('Import will insert validated rows into the database. Continue?')) return;

    setLoading(true);
    setMessage(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('propertyId', propertyId);
    fd.append('action', 'import');

    try {
      const res = await fetch('/api/transactions/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.message || 'Import failed');
        setErrors(json.errors || []);
      } else {
        setMessage(`Successfully imported ${json.inserted} row(s). Redirecting...`);
        setPreview(null);
        setFile(null);
        // Redirect to property details page after 1.5 seconds
        setTimeout(() => {
          router.push(`/properties/${propertyId}`);
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
        <form onSubmit={handlePreview} className="space-y-6">
          {/* File Input */}
          <div>
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-slate-200 mb-2"
            >
              Select file
            </label>
            <div className="relative">
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer cursor-pointer"
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-emerald-400">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !file}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {loading ? "Processing..." : "Preview"}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || !file || !preview}
              className="flex items-center gap-2 rounded-lg bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg
                className="h-5 w-5"
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
              Import
            </button>
          </div>
        </form>
      </div>

      {/* Messages and Errors */}
      {message && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            message.includes("Imported") || message.includes("success")
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
              : "border-slate-700/60 bg-slate-900/60 text-slate-300"
          }`}
        >
          {message}
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="rounded-lg border border-rose-500/60 bg-rose-900/20 p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-rose-200">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Validation Errors
          </div>
          <ul className="mt-2 space-y-1 text-sm text-rose-200">
            {errors.map((err, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-400">•</span>
                <span>
                  <span className="font-medium">Row {err.row}:</span>{" "}
                  {err.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {preview && preview.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-base font-semibold text-slate-100">
                Preview ({preview.length} rows)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Review the data below before importing
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th className="py-3 pr-4">Date</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Payee/Payer</th>
                  <th className="py-3 pr-4">Description</th>
                  <th className="py-3 pr-4 text-right">Amount</th>
                  <th className="py-3 pr-4">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {preview.map((r, i) => (
                  <tr key={i} className="align-middle">
                    <td className="py-3 pr-4 text-slate-200">
                      {r.date
                        ? new Date(r.date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td
                      className={`py-3 pr-4 text-xs font-medium ${
                        r.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {r.type === "income" ? "Income" : "Expense"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {r.category ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      {r.payee_payer ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {r.description ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-100">
                      {r.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-3 pr-4 text-slate-300">
                      <span className="inline-flex items-center rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-200">
                        {r.currency ?? "USD"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
