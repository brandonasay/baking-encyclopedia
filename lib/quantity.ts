// Recipe quantity parsing, formatting, and scaling shared by the grocery
// list (per-item scale factors) and the public recipe page (serving scaler).

import type { RecipeIngredient } from './database.types'

export function parseFraction(str: string): number {
  const s = str.trim()
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3])
  // Simple fraction: "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) return parseInt(frac[1]) / parseInt(frac[2])
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

export function formatQuantity(num: number): string {
  if (num === 0) return '0'
  // Common fractions
  const fracs: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.5, '½'],
    [0.667, '⅔'], [0.75, '¾'],
  ]
  const whole = Math.floor(num)
  const frac = num - whole
  if (frac < 0.01) return String(whole)
  for (const [val, sym] of fracs) {
    if (Math.abs(frac - val) < 0.04) {
      return whole > 0 ? `${whole} ${sym}` : sym
    }
  }
  // Fallback to decimal with 1–2 sig figs
  return num % 1 === 0 ? String(num) : num.toFixed(2).replace(/\.?0+$/, '')
}

export const SCALE_OPTIONS: { label: string; value: number }[] = [
  { label: '½×', value: 0.5 },
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '3×', value: 3 },
]

export type UnitSystem = 'us' | 'metric'

// Rounds a scaled gram amount to a sensible display precision — whole grams
// under 100g, nearest 5g above that (matches how gram quantities are
// typically written on packaging and in recipes).
export function formatGrams(grams: number): string {
  const rounded = grams < 100 ? Math.round(grams) : Math.round(grams / 5) * 5
  return String(rounded)
}

const NUMERIC_QUANTITY = /^\d+(\.\d+)?$|^\d+\/\d+$|^\d+\s+\d+\/\d+$/

// Scales a raw ingredient quantity string. Non-numeric quantities (e.g.
// "to taste", "a pinch") are left untouched rather than collapsing to "0".
export function scaleQuantity(quantity: string, scale: number): string {
  const trimmed = quantity.trim()
  if (!trimmed || scale === 1 || !NUMERIC_QUANTITY.test(trimmed)) return quantity
  return formatQuantity(parseFraction(trimmed) * scale)
}

// Formats an ingredient's quantity + unit for the current scale/unit system.
export function formatIngredientQuantity(
  ing: Pick<RecipeIngredient, 'quantity' | 'unit' | 'quantity_grams'>,
  scale: number,
  unitSystem: UnitSystem
): string {
  if (unitSystem === 'metric' && ing.quantity_grams != null) {
    return `${formatGrams(ing.quantity_grams * scale)} g`
  }
  return `${scaleQuantity(ing.quantity, scale)} ${ing.unit}`.trim()
}

// Full display line for an ingredient (quantity + name + notes), shared by
// the ingredients list and the "copy missing ingredients" text.
export function formatIngredientLine(ing: RecipeIngredient, scale: number, unitSystem: UnitSystem): string {
  const qty = formatIngredientQuantity(ing, scale, unitSystem)
  const base = `${qty} ${ing.ingredient_name}`.trim()
  return ing.notes ? `${base}, ${ing.notes}` : base
}

// Scales the leading number in a free-text yield string (e.g. "12 muffins"),
// leaving the rest of the string intact. Falls back to base_servings when
// there's no parseable leading number.
export function scaleYield(
  baseYield: string | null | undefined,
  baseServings: number | null | undefined,
  scale: number
): string | null {
  if (baseYield) {
    const match = baseYield.trim().match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
    if (match) {
      const scaled = formatQuantity(parseFloat(match[1]) * scale)
      return match[2] ? `${scaled} ${match[2]}` : scaled
    }
    return baseYield
  }
  if (baseServings != null) {
    const scaled = Math.round(baseServings * scale)
    return `${scaled} serving${scaled === 1 ? '' : 's'}`
  }
  return null
}
