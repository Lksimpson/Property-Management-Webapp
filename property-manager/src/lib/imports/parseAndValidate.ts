import Papa from "papaparse";
import ExcelJS from "exceljs";
import { KNOWN_CATEGORIES } from "@/src/lib/categories";

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

async function parseXLSX(buffer: ArrayBuffer): Promise<{ data: RawRow[]; errors: [] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { data: [], errors: [] };

  const rows: RawRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row, rowIndex) => {
    // ExcelJS uses 1-based index with a leading undefined at index 0
    const values = (row.values as ExcelJS.CellValue[]).slice(1);

    if (rowIndex === 1) {
      headers = values.map((v) => (v == null ? "" : String(v)));
    } else {
      const record: RawRow = {};
      headers.forEach((header, i) => {
        let cellVal: any = values[i];
        if (cellVal instanceof Date) {
          const y = cellVal.getFullYear();
          const m = String(cellVal.getMonth() + 1).padStart(2, "0");
          const d = String(cellVal.getDate()).padStart(2, "0");
          cellVal = `${y}-${m}-${d}`;
        } else if (cellVal != null && typeof cellVal === "object") {
          // Formula result
          if ("result" in cellVal) cellVal = (cellVal as any).result ?? null;
          // Rich text
          else if ("richText" in cellVal) cellVal = (cellVal as any).richText?.map((r: any) => r.text).join("") ?? null;
          else if ("text" in cellVal) cellVal = (cellVal as any).text ?? null;
        }
        record[header] = cellVal ?? null;
      });
      rows.push(record);
    }
  });

  return { data: rows, errors: [] };
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
      const parsed = await parseXLSX(buffer);
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

    // Hard errors: skip row
    const hardErrors: ValidationError[] = [];
    if (!type) {
      hardErrors.push({ row: rowNum, message: `Invalid or missing 'type' (expected 'income' or 'expense')`, field: 'type', value: typeRaw });
    }
    if (amount == null || Number.isNaN(amount)) {
      hardErrors.push({ row: rowNum, message: `Invalid or missing 'amount'`, field: 'amount', value: normalized['amount'] });
    }

    hardErrors.forEach((e) => errors.push(e));

    if (hardErrors.length > 0) return;

    // Soft warnings: imported as-is but flagged
    if (category && !KNOWN_CATEGORIES.has(category)) {
      errors.push({ row: rowNum, message: `Unknown category '${category}' — imported as-is`, field: 'category', value: category });
    }

    rows.push({ date, type: type!, category, payee_payer, description, amount: amount!, currency });
  });

  return { rows, errors };
}
