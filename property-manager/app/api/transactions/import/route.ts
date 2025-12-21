import { NextResponse } from 'next/server';
import { parseAndValidateFile } from '@/src/lib/imports/parseAndValidate';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as unknown as File | null;
    const propertyId = String(form.get('propertyId') || '');
    const action = String(form.get('action') || 'preview'); // 'preview' or 'import'

    if (!file) {
      return NextResponse.json({ ok: false, message: 'No file uploaded' }, { status: 400 });
    }
    if (!propertyId) {
      return NextResponse.json({ ok: false, message: 'Missing propertyId' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await parseAndValidateFile((file as any).name || 'upload.csv', arrayBuffer);

    if (result.errors && result.errors.length > 0 && action === 'preview') {
      // return preview with errors
      return NextResponse.json({ ok: true, preview: result.rows.slice(0, 50), errors: result.errors });
    }

    if (result.errors && result.errors.length > 0 && action === 'import') {
      return NextResponse.json({ ok: false, message: 'Validation failed', errors: result.errors }, { status: 400 });
    }

    if (action === 'preview') {
      return NextResponse.json({ ok: true, preview: result.rows.slice(0, 50) });
    }

    // action === 'import' and validation passed => batch insert
    const supabase = createSupabaseServerClient();
    // attach property_id and created_at
    const toInsert = result.rows.map((r) => ({
      property_id: propertyId,
      date: r.date,
      type: r.type,
      category: r.category,
      payee_payer: r.payee_payer,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
    }));

    // insert in chunks of 300
    const chunkSize = 300;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const { error } = await supabase.from('transactions').insert(chunk);
      if (error) {
        return NextResponse.json({ ok: false, message: 'DB insert failed', dbError: error }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, inserted: toInsert.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message || String(err) }, { status: 500 });
  }
}
