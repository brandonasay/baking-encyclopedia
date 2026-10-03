import Decimal from 'decimal.js'
import { BASE_UNIT, convertToUnit, dimensionOf, toBaseAmount, type UnitCode } from './units'

export interface PantryItemInput {
  id: string
  packageQty: Decimal
  packageUnit: UnitCode
  packagePrice: Decimal
  usableYieldPct: Decimal // 0-100
  gramsPerCup?: Decimal | null
  gramsPerEach?: Decimal | null
}

export type CostPerBaseUnitResult =
  | { ok: true; costPerBaseUnit: Decimal; baseUnit: UnitCode }
  | { ok: false; reason: 'invalid_package' }

// c_i = package price / (package qty in base units * usable yield)
export function costPerBaseUnit(item: PantryItemInput): CostPerBaseUnitResult {
  if (item.packageQty.lte(0) || item.usableYieldPct.lte(0)) return { ok: false, reason: 'invalid_package' }
  const dim = dimensionOf(item.packageUnit)
  const baseUnit = BASE_UNIT[dim]
  const packageQtyInBase = toBaseAmount(item.packageQty, item.packageUnit)
  const usableFraction = item.usableYieldPct.div(100)
  return { ok: true, costPerBaseUnit: item.packagePrice.div(packageQtyInBase.times(usableFraction)), baseUnit }
}

export type LineQuantityResult =
  | { ok: true; value: Decimal; baseUnit: UnitCode }
  | { ok: false; reason: 'missing_density' | 'unsupported_pair' | 'invalid_package' }

// Converts a line's quantity into the pantry item's base unit (g, ml, each) —
// the shared step behind both line costing and shopping-list aggregation.
export function lineQuantityInBase(qty: Decimal, unit: UnitCode, pantryItem: PantryItemInput): LineQuantityResult {
  const dim = dimensionOf(pantryItem.packageUnit)
  const baseUnit = BASE_UNIT[dim]
  const converted = convertToUnit(qty, unit, baseUnit, {
    gramsPerCup: pantryItem.gramsPerCup,
    gramsPerEach: pantryItem.gramsPerEach,
  })
  if (!converted.ok) return converted
  return { ok: true, value: converted.value, baseUnit }
}

export interface RecipeLineInput {
  id: string
  qty: Decimal
  unit: UnitCode
  pantryItem: PantryItemInput
}

export type LineCostResult =
  | { ok: true; cost: Decimal }
  | { ok: false; reason: 'missing_density' | 'unsupported_pair' | 'invalid_package' }

export function lineCost(line: RecipeLineInput): LineCostResult {
  const c = costPerBaseUnit(line.pantryItem)
  if (!c.ok) return c
  const q = lineQuantityInBase(line.qty, line.unit, line.pantryItem)
  if (!q.ok) return q
  return { ok: true, cost: q.value.times(c.costPerBaseUnit) }
}

export interface RecipeBatchResult {
  ok: boolean
  batchCost: Decimal
  unitCost: Decimal | null
  missingLineIds: string[]
}

// B_r = sum of line costs; u_r = B_r / Y_r. Lines that can't be costed are
// named in missingLineIds and excluded from the (partial) total — per PRD,
// an incomplete recipe still shows the cost it can compute.
export function recipeBatchCost(lines: RecipeLineInput[], yieldQty: Decimal): RecipeBatchResult {
  let total = new Decimal(0)
  const missing: string[] = []
  for (const line of lines) {
    const r = lineCost(line)
    if (r.ok) total = total.plus(r.cost)
    else missing.push(line.id)
  }
  return {
    ok: missing.length === 0,
    batchCost: total,
    unitCost: yieldQty.gt(0) ? total.div(yieldQty) : null,
    missingLineIds: missing,
  }
}
