import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

async function updateProperty(formData: FormData) {
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

  const name = formData.get("name")?.toString().trim();
  const addressRaw = formData.get("address");
  const address =
    typeof addressRaw === "string" && addressRaw.trim().length > 0
      ? addressRaw.trim()
      : null;

  if (!name) {
    redirect(`/properties/${propertyId}/edit`);
  }

  const { error } = await supabase
    .from("properties")
    .update({ name, address })
    .eq("id", propertyId);

  if (error) {
    console.error("Error updating property:", error);
    redirect(`/properties/${propertyId}/edit`);
  }

  redirect(`/properties/${propertyId}`);
}

export default async function EditPropertyPage(props: {
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

  const { data: property } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("id", propertyId)
    .single();

  if (!property) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 pb-12 pt-10 lg:px-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Edit property
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Update the basic details for this property.
          </p>
        </header>

        <main className="flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
          <form action={updateProperty} className="space-y-6">
            <input type="hidden" name="propertyId" value={propertyId} />

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-200"
              >
                Property name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={property.name ?? ""}
                required
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-slate-200"
              >
                Address (optional)
              </label>
              <input
                id="address"
                name="address"
                defaultValue={property.address ?? ""}
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
                Save changes
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}


