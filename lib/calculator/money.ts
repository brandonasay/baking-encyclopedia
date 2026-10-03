import Decimal from 'decimal.js'

// All engine math stays full-precision Decimal; these are the only place
// rounding happens, and only for display.
export function roundCents(d: Decimal): Decimal {
  return d.toDecimalPlaces(2)
}

export function formatMoney(d: Decimal): string {
  const rounded = roundCents(d)
  const sign = rounded.isNegative() ? '-' : ''
  return `${sign}$${rounded.abs().toFixed(2)}`
}

export function roundQuantity(d: Decimal): Decimal {
  return d.toDecimalPlaces(2)
}

export function formatPercent(fraction: Decimal, decimals = 1): string {
  return `${fraction.times(100).toDecimalPlaces(decimals).toFixed(decimals)}%`
}
