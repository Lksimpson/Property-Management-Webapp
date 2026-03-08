export function convertToUSD(
  amount: number,
  fromCurrency: string,
  rateMap: Map<string, number>
): number {
  if (fromCurrency === "USD") return amount;
  const rate = rateMap.get(`${fromCurrency}-USD`);
  return rate !== undefined ? amount * rate : amount;
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rateMap: Map<string, number>
): number {
  if (from === to) return amount;

  let usdAmount = amount;
  if (from !== "USD") {
    const toUsdRate = rateMap.get(`${from}-USD`);
    if (toUsdRate !== undefined) {
      usdAmount = amount * toUsdRate;
    } else {
      console.warn(`No exchange rate found for ${from}-USD`);
      return amount;
    }
  }

  if (to === "USD") return usdAmount;

  const toTargetRate = rateMap.get(`${to}-USD`);
  if (toTargetRate !== undefined && toTargetRate > 0) {
    return usdAmount / toTargetRate;
  }

  console.warn(`No exchange rate found for ${to}-USD`);
  return usdAmount;
}
