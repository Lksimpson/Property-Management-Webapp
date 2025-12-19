"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteTransactionModalProps = {
  transactionId: string;
  transactionDescription: string;
  onClose: () => void;
};

export default function DeleteTransactionModal({
  transactionId,
  transactionDescription,
  onClose,
}: DeleteTransactionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/delete`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete transaction");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-50 mb-2">
          Delete Transaction
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Are you sure you want to delete this transaction? This action cannot
          be undone.
        </p>
        {transactionDescription && (
          <div className="mb-6 rounded-lg bg-slate-800/60 p-3 border border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Transaction:</p>
            <p className="text-sm text-slate-200">{transactionDescription}</p>
          </div>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

