import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { applyTransactionFilters } from "@/src/lib/transactionFilters";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await props.params;
  const { searchParams } = req.nextUrl;

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: membership } = await supabase
    .from("property_members")
    .select("role")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const filterParams = {
    search: searchParams.get("search") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    filterType: searchParams.get("filterType") || undefined,
    filterCategory: searchParams.get("category") || undefined,
  };

  let query = supabase
    .from("transactions")
    .select("date, type, category, payee_payer, description, amount, currency")
    .eq("property_id", propertyId)
    .order("date", { ascending: false })
    .range(0, 9999);

  query = applyTransactionFilters(query, filterParams);

  const { data: transactions, error } = await query;

  if (error) {
    return new Response("Failed to fetch transactions", { status: 500 });
  }

  const rows = transactions ?? [];

  const header = ["Date", "Type", "Category", "Counterparty", "Description", "Amount", "Currency"];

  function escapeCSV(val: string | null | undefined): string {
    if (val == null) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvLines = [
    header.join(","),
    ...rows.map((tx) =>
      [
        escapeCSV(tx.date),
        escapeCSV(tx.type),
        escapeCSV(tx.category),
        escapeCSV(tx.payee_payer),
        escapeCSV(tx.description),
        escapeCSV(tx.amount != null ? String(tx.amount) : null),
        escapeCSV(tx.currency),
      ].join(",")
    ),
  ];

  const csv = csvLines.join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions-${propertyId}-${today}.csv"`,
    },
  });
}
