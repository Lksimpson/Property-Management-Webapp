type FilterParams = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  filterType?: string;
  filterCategory?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyTransactionFilters(query: any, params: FilterParams): any {
  const { search, dateFrom, dateTo, filterType, filterCategory } = params;

  if (search) {
    query = query.or(
      `payee_payer.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }

  if (dateTo) {
    query = query.lte("date", dateTo);
  }

  if (filterType === "income" || filterType === "expense") {
    query = query.eq("type", filterType);
  }

  if (filterCategory) {
    if (filterCategory === "Uncategorized") {
      query = query.or("category.is.null,category.eq.");
    } else {
      query = query.eq("category", filterCategory);
    }
  }

  return query;
}
