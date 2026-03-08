export const INCOME_CATEGORIES = [
  "Rent",
  "Security Deposit",
  "Late Fee",
  "Pet Fee",
  "Parking",
  "Laundry",
  "Storage",
  "Short-Term Rental",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Mortgage / Loan Payment",
  "Insurance",
  "Property Tax",
  "HOA Fee",
  "Maintenance",
  "Repairs",
  "Utilities",
  "Landscaping",
  "Cleaning",
  "Property Management Fee",
  "Advertising",
  "Legal / Professional",
  "Capital Improvement",
  "Supplies",
  "Other Expense",
] as const;

export const KNOWN_CATEGORIES = new Set<string>([
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES,
]);
