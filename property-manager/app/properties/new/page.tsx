import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

async function createProperty(formData: FormData) {
  "use server";

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
    // In a real app you might handle validation errors more gracefully,
    // but for now we just bail out.
    redirect("/properties/new");
  }

  // 1) Create the property
  const {
    data: property,
    error: propertyError,
  } = await supabase
    .from("properties")
    .insert({ name, address })
    .select("id")
    .single();

  if (propertyError || !property) {
    console.error("Error creating property:", propertyError);
    redirect("/properties/new");
  }

  // 2) Add the current user as an owner in property_members
  const { error: memberError } = await supabase.from("property_members").insert({
    property_id: property.id,
    user_id: session.user.id,
    role: "owner",
  });

  if (memberError) {
    console.error("Error creating property membership:", memberError);
    // Property is created but membership failed; redirect back to dashboard
    // so at least the property list refreshes based on RLS.
    redirect("/dashboard");
  }

  // Redirect to dashboard (or later, a property detail page)
  redirect("/dashboard");
}

export default async function NewPropertyPage() {
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
            Add a new property
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Once created, you&apos;ll be set as the{" "}
            <span className="font-semibold text-emerald-400">owner</span> for
            this property and can invite managers or viewers later.
          </p>
        </header>

        <main className="flex-1 rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-6 shadow-lg shadow-black/40">
          <form action={createProperty} className="space-y-6">
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
                required
                placeholder="Riverside Apartments"
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
                placeholder="245 River Road, Portland, OR"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <a
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Create property
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}


