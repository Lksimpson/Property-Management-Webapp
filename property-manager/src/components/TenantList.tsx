import Link from "next/link";

type Tenant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lease_start: string | null;
  lease_end: string | null;
  monthly_rent: number | null;
  currency: string | null;
};

type Props = {
  tenants: Tenant[];
  propertyId: string;
  canManage: boolean;
};

function getTenantStatus(tenant: Tenant): "Active" | "Upcoming" | "Past" {
  const today = new Date().toISOString().slice(0, 10);
  const { lease_start, lease_end } = tenant;

  if (lease_end && lease_end < today) return "Past";
  if (lease_start && lease_start > today) return "Upcoming";
  return "Active";
}

const statusStyles = {
  Active: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
  Upcoming: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
  Past: "bg-slate-700/40 text-slate-400 ring-1 ring-slate-600/40",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function TenantList({ tenants, propertyId, canManage }: Props) {
  if (tenants.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-8 text-center shadow-lg shadow-black/40">
        <p className="text-slate-400">No tenants added yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-4 shadow-lg shadow-black/40 overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="border-b border-slate-800/80 text-xs uppercase tracking-[0.16em] text-slate-500">
          <tr>
            <th className="py-3 pr-4 text-left">Name</th>
            <th className="py-3 pr-4 text-left">Contact</th>
            <th className="py-3 pr-4 text-left">Lease Period</th>
            <th className="py-3 pr-4 text-right">Rent/mo</th>
            <th className="py-3 pr-4 text-left">Status</th>
            {canManage && <th className="py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/70">
          {tenants.map((tenant) => {
            const status = getTenantStatus(tenant);
            return (
              <tr key={tenant.id} className="align-middle">
                <td className="py-3 pr-4 font-medium text-slate-100">{tenant.name}</td>
                <td className="py-3 pr-4 text-slate-400">
                  <div className="flex flex-col gap-0.5">
                    {tenant.email && <span>{tenant.email}</span>}
                    {tenant.phone && <span>{tenant.phone}</span>}
                    {!tenant.email && !tenant.phone && <span>—</span>}
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-300">
                  {formatDate(tenant.lease_start)} – {formatDate(tenant.lease_end)}
                </td>
                <td className="py-3 pr-4 text-right text-slate-100">
                  {tenant.monthly_rent != null
                    ? tenant.monthly_rent.toLocaleString(undefined, {
                        style: "currency",
                        currency: tenant.currency || "USD",
                        maximumFractionDigits: 0,
                      })
                    : "—"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
                  >
                    {status}
                  </span>
                </td>
                {canManage && (
                  <td className="py-3 text-right">
                    <Link
                      href={`/properties/${propertyId}/tenants/${tenant.id}/edit`}
                      className="text-xs text-slate-400 hover:text-slate-200 transition"
                    >
                      Edit
                    </Link>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
