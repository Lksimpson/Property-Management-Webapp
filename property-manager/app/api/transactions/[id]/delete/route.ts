import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: transactionId } = await params;

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First, get the transaction to check permissions
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .select("property_id")
    .eq("id", transactionId)
    .single();

  if (fetchError || !transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  // Delete the transaction (RLS will enforce permissions)
  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (deleteError) {
    console.error("Error deleting transaction:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

