import Papa from "papaparse";
import * as XLSX from "xlsx";

export type RawRow = Record<string, any>;
export type ValidatedRow = {
  date: string | null;
  type: "income" | "expense";
  category: string | null;
  payee_payer: string | null;
  description: string | null;
  amount: number;
  currency: string | null;
};

export type ValidationError = {
  row: number;
  message: string;
  field?: string;
  value?: any;
};

function normalizeHeader(h: string) {
  // normalize header names: trim, lowercase, and replace non-alphanumeric with underscore
  return (h || "").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function parseCSV(text: string) {
  const result = Papa.parse<Record<string, any>>(text, { header: true, skipEmptyLines: true });
  return { data: result.data, errors: result.errors };
}

function parseXLSX(buffer: ArrayBuffer) {
  // Read workbook with `cellDates: true` so real Excel dates become JS Date objects
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Use raw:false so XLSX will format cell values (dates, etc.) when possible
  const json: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  return { data: json, errors: [] };
}

function cleanString(val: any) {
  if (val == null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function parseAmount(val: any) {
  if (val == null || val === "") return null;
  const n = Number(String(val).replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDate(val: any) {
  if (val == null || val === "") return null;
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  // try parsing ISO manually
  const parsed = Date.parse(String(val));
  if (!isNaN(parsed)) return new Date(parsed).toISOString();
  return null;
}

export async function parseAndValidateFile(
  fileName: string,
  buffer: ArrayBuffer
): Promise<{ rows: ValidatedRow[]; errors: ValidationError[] }> {
  // determine type by extension
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  let raw: RawRow[] = [];

  try {
    if (ext === "csv" || ext === "txt") {
      const text = new TextDecoder().decode(buffer);
      const parsed = parseCSV(text);
      raw = parsed.data as RawRow[];
    } else if (ext === "xls" || ext === "xlsx") {
      const parsed = parseXLSX(buffer);
      raw = parsed.data as RawRow[];
    } else {
      // try CSV as fallback
      const text = new TextDecoder().decode(buffer);
      const parsed = parseCSV(text);
      raw = parsed.data as RawRow[];
    }
  } catch (err: any) {
    return { rows: [], errors: [{ row: 0, message: `Failed to parse file: ${err?.message || err}` }] };
  }

  const rows: ValidatedRow[] = [];
  const errors: ValidationError[] = [];

  // Expected columns (case-insensitive): date, type, category, payee_payer, description, amount, currency
  raw.forEach((r, idx) => {
    const rowNum = idx + 2; // assume header on row 1
    // normalize keys map
    const normalized: Record<string, any> = {};
    Object.keys(r).forEach((k) => {
      normalized[normalizeHeader(k)] = r[k];
    });

    const date = parseDate(normalized["date"] ?? normalized["transaction date"] ?? normalized["transaction_date"] ?? normalized["date (yyyy-mm-dd)"] ?? null);
    const typeRaw = cleanString(normalized["type"] ?? normalized["transaction type"] ?? null);
    const type = typeRaw && (typeRaw.toLowerCase() === "income" || typeRaw.toLowerCase() === "expense") ? (typeRaw.toLowerCase() as "income" | "expense") : null;
    const category = cleanString(normalized["category"] ?? null);
    // Support common header names for counterparties: "payee_payer", "payee/payer", "payee", "payer", "counterparty"
    const payee_payer = cleanString(
      normalized["payee_payer"] ?? normalized["payee/payer"] ?? normalized["payee"] ?? normalized["payer"] ?? normalized["counterparty"] ?? null
    );
    const description = cleanString(normalized["description"] ?? null);
    const amount = parseAmount(normalized["amount"] ?? normalized["amt"] ?? null);
    const currency = cleanString(normalized["currency"] ?? normalized["curr"] ?? null);

    // Validate required fields: type and amount (and date optional)
    if (!type) {
      errors.push({ row: rowNum, message: `Invalid or missing 'type' (expected 'income' or 'expense')`, field: 'type', value: typeRaw });
    }
    if (amount == null || Number.isNaN(amount)) {
      errors.push({ row: rowNum, message: `Invalid or missing 'amount'`, field: 'amount', value: normalized['amount'] });
    }

    // If any errors for this row, skip adding to rows
    const rowErrors = errors.filter((e) => e.row === rowNum);
    if (rowErrors.length === 0) {
      rows.push({ date, type: type!, category, payee_payer, description, amount: amount!, currency });
    }
  });

  return { rows, errors };
}
