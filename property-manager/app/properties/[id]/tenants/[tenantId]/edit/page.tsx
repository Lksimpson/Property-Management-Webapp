import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

async function updateTenant(formData: FormData) {
  "use server";

  const tenantId = formData.get("tenantId")?.toString();
  const propertyId = formData.get("propertyId")?.toString();
  if (!tenantId || !propertyId) redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("property_members")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!membership || (membership.role !== "manager" && membership.role !== "owner")) {
    redirect(`/properties/${propertyId}?tab=tenants`);
  }

  const name = formData.get("name")?.toString() || "";
  if (!name) redirect(`/properties/${propertyId}/tenants/${tenantId}/edit`);

  const email = formData.get("email")?.toString() || null;
  const phone = formData.get("phone")?.toString() || null;
  const lease_start = formData.get("lease_start")?.toString() || null;
  const lease_end = formData.get("lease_end")?.toString() || null;
  const monthly_rent = formData.get("monthly_rent")?.toString()
    ? Number(formData.get("monthly_rent"))
    : null;
  const currency = formData.get("currency")?.toString() || "USD";

  const { error } = await supabase
    .from("tenants")
    .update({ name, email, phone, lease_start, lease_end, monthly_rent, currency })
    .eq("id", tenantId);

  if (error) {
    console.error("Error updating tenant:", error);
    redirect(`/properties/${propertyId}/tenants/${tenantId}/edit`);
  }

  redirect(`/properties/${propertyId}?tab=tenants`);
}

export default async function EditTenantPage(props: {
  params: Promise<{ id: string; tenantId: string }>;
}) {
  const { id: propertyId, tenantId } = await props.params;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("property_members")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const canManage = membership.role === "manager" || membership.role === "owner";

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pb-12 pt-10 lg:px-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Edit tenant</h1>
          <p className="mt-2 text-sm text-slate-400">Update tenant details.</p>
        </header>

        <main className="flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
          <form action={updateTenant} className="space-y-6">
            <input type="hidden" name="tenantId" value={tenantId} />
            <input type="hidden" name="propertyId" value={propertyId} />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-200">
                  Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  defaultValue={tenant.name}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={tenant.email || ""}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-200">
                  Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  defaultValue={tenant.phone || ""}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="lease_start" className="block text-sm font-medium text-slate-200">
                  Lease Start
                </label>
                <input
                  id="lease_start"
                  name="lease_start"
                  type="date"
                  defaultValue={tenant.lease_start || ""}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="lease_end" className="block text-sm font-medium text-slate-200">
                  Lease End
                </label>
                <input
                  id="lease_end"
                  name="lease_end"
                  type="date"
                  defaultValue={tenant.lease_end || ""}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="monthly_rent" className="block text-sm font-medium text-slate-200">
                  Monthly Rent
                </label>
                <input
                  id="monthly_rent"
                  name="monthly_rent"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={tenant.monthly_rent ?? ""}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-200">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={tenant.currency || "USD"}
                  disabled={!canManage}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-400 focus:ring-2 disabled:opacity-50"
                >
                  <option value="USD">USD</option>
                  <option value="JMD">JMD</option>
                  <option value="XCD">XCD</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <a
                href={`/properties/${propertyId}?tab=tenants`}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </a>
              {canManage && (
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                >
                  Save changes
                </button>
              )}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
