type Item = {
  id: string;
  date: string | null;
  category: string | null;
  payee_payer: string | null;
  description: string | null;
  usdAmount: number;
};

type Props = {
  topIncome: Item[];
  topExpenses: Item[];
};

function TransactionList({
  items,
  type,
}: {
  items: Item[];
  type: "income" | "expense";
}) {
  const amountColor =
    type === "income" ? "text-emerald-400" : "text-rose-400";
  const headingColor =
    type === "income" ? "text-emerald-300" : "text-rose-300";

  return (
    <div>
      <h3
        className={`mb-3 text-xs font-medium uppercase tracking-[0.18em] ${headingColor}`}
      >
        Top {type === "income" ? "Income" : "Expenses"}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No {type} transactions.</p>
      ) : (
        <ul className="divide-y divide-slate-800/70">
          {items.map((item) => {
            const label =
              item.payee_payer ?? item.category ?? item.description ?? "—";
            return (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500">
                    {item.date
                      ? new Date(item.date + "T00:00:00").toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <span className={`ml-4 shrink-0 text-sm font-semibold ${amountColor}`}>
                  {item.usdAmount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function LargestTransactionsPanel({ topIncome, topExpenses }: Props) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
      <h2 className="mb-5 text-lg font-semibold text-slate-100">
        Largest Transactions
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TransactionList items={topIncome} type="income" />
        <TransactionList items={topExpenses} type="expense" />
      </div>
    </div>
  );
}
