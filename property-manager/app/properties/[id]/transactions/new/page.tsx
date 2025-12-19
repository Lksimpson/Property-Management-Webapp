import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

async function createTransaction(formData: FormData) {
  "use server";

  const propertyId = formData.get("propertyId")?.toString();
  if (!propertyId) {
    redirect("/dashboard");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const type = formData.get("type")?.toString() as "income" | "expense";
  const date = formData.get("date")?.toString();
  const category = formData.get("category")?.toString() || null;
  const payee_payer = formData.get("payee_payer")?.toString() || null;
  const description = formData.get("description")?.toString() || null;
  const amountStr = formData.get("amount")?.toString() || "0";
  const currency = formData.get("currency")?.toString() || "USD";

  const amount = Number(amountStr);

  if (!type || !date || Number.isNaN(amount)) {
    redirect(`/properties/${propertyId}/transactions/new`);
  }

  const { error } = await supabase.from("transactions").insert({
    property_id: propertyId,
    type,
    date,
    category,
    payee_payer,
    description,
    amount,
    currency,
    created_by: session.user.id,
  });

  if (error) {
    console.error("Error creating transaction:", error);
    redirect(`/properties/${propertyId}/transactions/new`);
  }

  redirect(`/properties/${propertyId}`);
}

export default async function NewTransactionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: propertyId } = await props.params;

  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pb-12 pt-10 lg:px-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Add transaction
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Record income or expenses for this property.
          </p>
        </header>

        <main className="flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
          <form action={createTransaction} className="space-y-6">
            <input type="hidden" name="propertyId" value={propertyId} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-slate-200"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-slate-200"
                >
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-slate-200"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-slate-200"
                >
                  Currency
                </label>
                <input
                  id="currency"
                  name="currency"
                  defaultValue="USD"
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-slate-200"
                >
                  Category
                </label>
                <input
                  id="category"
                  name="category"
                  placeholder="Rent, Maintenance, Utilities..."
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
              <div>
                <label
                  htmlFor="payee_payer"
                  className="block text-sm font-medium text-slate-200"
                >
                  Counterparty
                </label>
                <input
                  id="payee_payer"
                  name="payee_payer"
                  placeholder="Tenant, vendor, etc."
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-slate-200"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional details about this transaction."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <a
                href={`/properties/${propertyId}`}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Save transaction
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}


