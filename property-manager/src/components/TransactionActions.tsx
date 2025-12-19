"use client";

import { useState } from "react";
import Link from "next/link";
import DeleteTransactionModal from "./DeleteTransactionModal";

type TransactionActionsProps = {
  transactionId: string;
  propertyId: string;
  transactionDescription: string;
};

export default function TransactionActions({
  transactionId,
  propertyId,
  transactionDescription,
}: TransactionActionsProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/properties/${propertyId}/transactions/${transactionId}/edit`}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800/60 transition"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-rose-500/70 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 transition"
        >
          Delete
        </button>
      </div>
      {showDeleteModal && (
        <DeleteTransactionModal
          transactionId={transactionId}
          transactionDescription={transactionDescription}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}

