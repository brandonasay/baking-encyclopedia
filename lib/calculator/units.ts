import Decimal from 'decimal.js'

export type Dimension = 'mass' | 'volume' | 'count'

export const UNIT_CODES = [
  'g', 'kg', 'oz', 'lb',
  'ml', 'l', 'tsp', 'tbsp', 'floz', 'cup', 'pint', 'quart', 'gallon',
  'each', 'dozen',
] as const

export type UnitCode = (typeof UNIT_CODES)[number]

interface UnitDef {
  dimension: Dimension
  // Amount of the dimension's base unit (g, ml, or each) equal to 1 of this unit.
  toBase: Decimal
}

const D = (s: string) => new Decimal(s)

export const UNIT_DEFS: Record<UnitCode, UnitDef> = {
  g: { dimension: 'mass', toBase: D('1') },
  kg: { dimension: 'mass', toBase: D('1000') },
  oz: { dimension: 'mass', toBase: D('28.349523125') },
  lb: { dimension: 'mass', toBase: D('453.59237') },
  ml: { dimension: 'volume', toBase: D('1') },
  l: { dimension: 'volume', toBase: D('1000') },
  tsp: { dimension: 'volume', toBase: D('4.92892159375') },
  tbsp: { dimension: 'volume', toBase: D('14.78676478125') },
  floz: { dimension: 'volume', toBase: D('29.5735295625') },
  cup: { dimension: 'volume', toBase: D('236.5882365') },
  pint: { dimension: 'volume', toBase: D('473.176473') },
  quart: { dimension: 'volume', toBase: D('946.352946') },
  gallon: { dimension: 'volume', toBase: D('3785.411784') },
  each: { dimension: 'count', toBase: D('1') },
  dozen: { dimension: 'count', toBase: D('12') },
}

export const BASE_UNIT: Record<Dimension, UnitCode> = { mass: 'g', volume: 'ml', count: 'each' }

export function dimensionOf(unit: UnitCode): Dimension {
  return UNIT_DEFS[unit].dimension
}

export function toBaseAmount(qty: Decimal, unit: UnitCode): Decimal {
  return qty.times(UNIT_DEFS[unit].toBase)
}

export function fromBaseAmount(baseQty: Decimal, unit: UnitCode): Decimal {
  return baseQty.div(UNIT_DEFS[unit].toBase)
}

// "t" (teaspoon) and "T" (Tablespoon) are the one case-sensitive baking
// convention worth preserving — everything else normalizes case-insensitively.
const CASE_SENSITIVE_ALIASES: Record<string, UnitCode> = {
  t: 'tsp',
  T: 'tbsp',
}

const ALIASES_LOWER: Record<string, UnitCode> = {
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', '#': 'lb', pound: 'lb', pounds: 'lb',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  floz: 'floz', 'fl oz': 'floz', 'fluid ounce': 'floz', 'fluid ounces': 'floz',
  cup: 'cup', cups: 'cup', c: 'cup',
  pint: 'pint', pints: 'pint', pt: 'pint',
  quart: 'quart', quarts: 'quart', qt: 'quart',
  gallon: 'gallon', gallons: 'gallon', gal: 'gallon',
  each: 'each', ea: 'each',
  dozen: 'dozen', doz: 'dozen',
}

export function normalizeUnit(raw: string): UnitCode | null {
  const trimmed = raw.trim()
  if (trimmed in CASE_SENSITIVE_ALIASES) return CASE_SENSITIVE_ALIASES[trimmed]
  return ALIASES_LOWER[trimmed.toLowerCase()] ?? null
}

const UNICODE_FRACTIONS: Record<string, string> = {
  '¼': '1/4', '½': '1/2', '¾': '3/4',
  '⅓': '1/3', '⅔': '2/3',
  '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
}

// Parses "2", "2.25", "3/4", "2 1/4", "¾", "2¾" into a Decimal. Returns null
// for anything unparseable rather than silently defaulting to 0 — callers
// must treat that as a validation error, not a quantity.
export function parseQuantityToDecimal(raw: string): Decimal | null {
  let s = raw.trim()
  for (const [glyph, frac] of Object.entries(UNICODE_FRACTIONS)) {
    if (s.includes(glyph)) s = s.replace(glyph, ` ${frac}`)
  }
  s = s.replace(/\s+/g, ' ').trim()

  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const [, whole, num, den] = mixed
    if (den === '0') return null
    return new Decimal(whole).plus(new Decimal(num).div(den))
  }

  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) {
    const [, num, den] = frac
    if (den === '0') return null
    return new Decimal(num).div(den)
  }

  if (/^\d+(\.\d+)?$/.test(s)) return new Decimal(s)
  return null
}

export interface Density {
  gramsPerCup?: Decimal | null
  gramsPerEach?: Decimal | null
}

export type ConvertResult =
  | { ok: true; value: Decimal }
  | { ok: false; reason: 'missing_density' | 'unsupported_pair' }

// Converts a quantity from one unit to another, crossing mass/volume/count
// dimensions via density when needed. Volume<->count is never supported.
export function convertToUnit(qty: Decimal, fromUnit: UnitCode, toUnit: UnitCode, density?: Density): ConvertResult {
  const fromDim = dimensionOf(fromUnit)
  const toDim = dimensionOf(toUnit)

  if (fromDim === toDim) {
    return { ok: true, value: fromBaseAmount(toBaseAmount(qty, fromUnit), toUnit) }
  }

  if (fromDim === 'volume' && toDim === 'mass') {
    if (!density?.gramsPerCup) return { ok: false, reason: 'missing_density' }
    const ml = toBaseAmount(qty, fromUnit)
    const gramsPerMl = density.gramsPerCup.div(UNIT_DEFS.cup.toBase)
    return { ok: true, value: fromBaseAmount(ml.times(gramsPerMl), toUnit) }
  }
  if (fromDim === 'mass' && toDim === 'volume') {
    if (!density?.gramsPerCup) return { ok: false, reason: 'missing_density' }
    const grams = toBaseAmount(qty, fromUnit)
    const gramsPerMl = density.gramsPerCup.div(UNIT_DEFS.cup.toBase)
    return { ok: true, value: fromBaseAmount(grams.div(gramsPerMl), toUnit) }
  }
  if (fromDim === 'count' && toDim === 'mass') {
    if (!density?.gramsPerEach) return { ok: false, reason: 'missing_density' }
    const count = toBaseAmount(qty, fromUnit)
    return { ok: true, value: fromBaseAmount(count.times(density.gramsPerEach), toUnit) }
  }
  if (fromDim === 'mass' && toDim === 'count') {
    if (!density?.gramsPerEach) return { ok: false, reason: 'missing_density' }
    const grams = toBaseAmount(qty, fromUnit)
    return { ok: true, value: fromBaseAmount(grams.div(density.gramsPerEach), toUnit) }
  }

  return { ok: false, reason: 'unsupported_pair' }
}
