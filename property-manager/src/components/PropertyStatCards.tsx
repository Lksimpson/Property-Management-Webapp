type PropertyStatCardsProps = {
  thisMonthNet: number;
  ytdNet: number;
  allTimeNet: number;
  avgMonthlyNet: number;
  expenseRatioPct: number | null;
};

function NetCard({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold ${
          isPositive ? "text-emerald-400" : "text-rose-400"
        }`}
      >
        {value.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })}
      </p>
    </div>
  );
}

export default function PropertyStatCards({
  thisMonthNet,
  ytdNet,
  allTimeNet,
  avgMonthlyNet,
  expenseRatioPct,
}: PropertyStatCardsProps) {
  const ratioColor =
    expenseRatioPct === null
      ? "text-slate-400 bg-slate-500/20 ring-slate-500/40"
      : expenseRatioPct < 40
      ? "text-emerald-300 bg-emerald-500/20 ring-emerald-500/40"
      : expenseRatioPct <= 60
      ? "text-amber-300 bg-amber-500/20 ring-amber-500/40"
      : "text-rose-300 bg-rose-500/20 ring-rose-500/40";

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <NetCard label="This Month Net" value={thisMonthNet} />
      <NetCard label="YTD Net" value={ytdNet} />
      <NetCard label="All-Time Net" value={allTimeNet} />
      <NetCard label="Avg Monthly Net (6M)" value={avgMonthlyNet} />

      {/* Expense Ratio Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Expense Ratio
        </p>
        <div className="mt-2">
          {expenseRatioPct === null ? (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xl font-semibold ring-1 ${ratioColor}`}
            >
              N/A
            </span>
          ) : (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xl font-semibold ring-1 ${ratioColor}`}
            >
              {expenseRatioPct}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
