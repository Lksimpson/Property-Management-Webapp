/**
 * Currency rates refresh endpoint.
 *
 * POST /api/currency-rates/refresh
 * Header: x-refresh-secret: <CURRENCY_REFRESH_SECRET env var>
 *
 * Fetches live exchange rates from frankfurter.app (free, no API key required)
 * and upserts 6 pairs into the currency_rates table:
 *   USD <-> JMD, USD <-> XCD, JMD <-> XCD
 *
 * Scheduling options:
 *   - Supabase pg_cron: call this endpoint daily via net.http_post()
 *   - Vercel Cron (vercel.json): { "crons": [{ "path": "/api/currency-rates/refresh", "schedule": "0 6 * * *" }] }
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function POST(req: Request) {
  const secret = req.headers.get("x-refresh-secret");
  if (!secret || secret !== process.env.CURRENCY_REFRESH_SECRET) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  // Fetch USD base rates for JMD and XCD from frankfurter.app (no API key needed)
  let usdToJmd: number;
  let usdToXcd: number;

  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?base=USD&symbols=JMD,XCD"
    );
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: `frankfurter.app returned ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    usdToJmd = data.rates["JMD"];
    usdToXcd = data.rates["XCD"];
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: `Failed to fetch rates: ${err?.message ?? err}` },
      { status: 502 }
    );
  }

  if (!usdToJmd || !usdToXcd) {
    return NextResponse.json(
      { ok: false, message: "Unexpected response shape from frankfurter.app" },
      { status: 502 }
    );
  }

  const now = new Date().toISOString();

  const rows = [
    { base_currency: "USD", target_currency: "JMD", rate: usdToJmd, fetched_at: now },
    { base_currency: "USD", target_currency: "XCD", rate: usdToXcd, fetched_at: now },
    { base_currency: "JMD", target_currency: "USD", rate: 1 / usdToJmd, fetched_at: now },
    { base_currency: "XCD", target_currency: "USD", rate: 1 / usdToXcd, fetched_at: now },
    { base_currency: "JMD", target_currency: "XCD", rate: usdToXcd / usdToJmd, fetched_at: now },
    { base_currency: "XCD", target_currency: "JMD", rate: usdToJmd / usdToXcd, fetched_at: now },
  ];

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("currency_rates")
    .upsert(rows, { onConflict: "base_currency,target_currency" });

  if (error) {
    return NextResponse.json(
      { ok: false, message: "DB upsert failed", error },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, updated: rows.length, fetched_at: now });
}
