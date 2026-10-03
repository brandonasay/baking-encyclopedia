import Decimal from 'decimal.js'
import { lineCost, type PantryItemInput, type RecipeBatchResult } from './costing'
import type { UnitCode } from './units'

export interface ProductComponentInput {
  qty: Decimal // in the recipe's yield unit
  recipeBatch: RecipeBatchResult
  recipeYieldQty: Decimal
  recipeActiveMinutes: Decimal
}

export interface ProductPackagingLineInput {
  qty: Decimal
  unit: UnitCode
  pantryItem: PantryItemInput
}

export interface ProductCostResult {
  ok: boolean
  I: Decimal
  P: Decimal
  L: Decimal // full labor cost, before the hobby toggle is applied
  O: Decimal
  C: Decimal // I + P + O + (L if countLaborAsCost)
  laborMinutes: Decimal
  missingComponentRecipeIds: string[]
  missingPackagingLineIds: string[]
}

// I, P, L, O, C from the product-cost formula. laborMinutes is always
// computed (it's time, not cost) so effective hourly wage works regardless
// of the countLaborAsCost toggle.
export function productCost(params: {
  components: ProductComponentInput[]
  packaging: { id: string; line: ProductPackagingLineInput }[]
  extraMinutes: Decimal
  hourlyRate: Decimal
  monthlyOverhead: Decimal
  expectedProductsPerMonth: Decimal
  countLaborAsCost: boolean
}): ProductCostResult {
  let I = new Decimal(0)
  let laborMinutes = new Decimal(0)
  const missingComponentRecipeIds: string[] = []

  for (const comp of params.components) {
    if (!comp.recipeBatch.ok || comp.recipeBatch.unitCost === null) {
      missingComponentRecipeIds.push('unknown')
      continue
    }
    I = I.plus(comp.qty.times(comp.recipeBatch.unitCost))
    if (comp.recipeYieldQty.gt(0)) {
      laborMinutes = laborMinutes.plus(comp.qty.div(comp.recipeYieldQty).times(comp.recipeActiveMinutes))
    }
  }
  laborMinutes = laborMinutes.plus(params.extraMinutes)

  let P = new Decimal(0)
  const missingPackagingLineIds: string[] = []
  for (const pack of params.packaging) {
    const r = lineCost({ id: pack.id, qty: pack.line.qty, unit: pack.line.unit, pantryItem: pack.line.pantryItem })
    if (r.ok) P = P.plus(r.cost)
    else missingPackagingLineIds.push(pack.id)
  }

  const L = params.hourlyRate.div(60).times(laborMinutes)
  const O = params.expectedProductsPerMonth.gt(0)
    ? params.monthlyOverhead.div(params.expectedProductsPerMonth)
    : new Decimal(0)

  const effectiveL = params.countLaborAsCost ? L : new Decimal(0)
  const C = I.plus(P).plus(effectiveL).plus(O)

  return {
    ok: missingComponentRecipeIds.length === 0 && missingPackagingLineIds.length === 0,
    I, P, L, O, C, laborMinutes,
    missingComponentRecipeIds,
    missingPackagingLineIds,
  }
}

export type SuggestedPriceResult =
  | { ok: true; rawPrice: Decimal; suggestedPrice: Decimal; breakEven: Decimal }
  | { ok: false; reason: 'fees_plus_margin_too_high' }

// p* = (C + F) / (1 - f - m), rounded UP to the price step (guarantees the
// margin is met). Break-even uses the same numerator over (1 - f), not
// step-rounded.
export function suggestedPrice(params: {
  cost: ProductCostResult
  feePct: Decimal
  feeFixed: Decimal
  marginPct: Decimal
  priceStep: Decimal
}): SuggestedPriceResult {
  const denom = new Decimal(1).minus(params.feePct).minus(params.marginPct)
  if (denom.lte(0)) return { ok: false, reason: 'fees_plus_margin_too_high' }

  const numerator = params.cost.C.plus(params.feeFixed)
  const rawPrice = numerator.div(denom)
  const breakEven = numerator.div(new Decimal(1).minus(params.feePct))
  const steps = rawPrice.div(params.priceStep).ceil()
  const suggestedPrice = steps.times(params.priceStep)

  return { ok: true, rawPrice, suggestedPrice, breakEven }
}

export interface PriceOutputs {
  price: Decimal
  fees: Decimal
  profit: Decimal
  margin: Decimal
  markupOnCost: Decimal
  effectiveHourlyWage: Decimal | null
  breakdown: { I: Decimal; P: Decimal; L: Decimal; O: Decimal; fees: Decimal; profit: Decimal }
}

// Outputs for any price (suggested, or one the baker types in).
export function priceOutputs(params: {
  price: Decimal
  cost: ProductCostResult
  feePct: Decimal
  feeFixed: Decimal
}): PriceOutputs {
  const fees = params.price.times(params.feePct).plus(params.feeFixed)
  const profit = params.price.minus(fees).minus(params.cost.C)
  const margin = params.price.gt(0) ? profit.div(params.price) : new Decimal(0)
  const markupOnCost = params.cost.C.gt(0) ? params.price.minus(params.cost.C).div(params.cost.C) : new Decimal(0)
  const laborHours = params.cost.laborMinutes.div(60)
  const effectiveHourlyWage = laborHours.gt(0)
    ? params.price.minus(fees).minus(params.cost.I).minus(params.cost.P).minus(params.cost.O).div(laborHours)
    : null

  return {
    price: params.price,
    fees,
    profit,
    margin,
    markupOnCost,
    effectiveHourlyWage,
    breakdown: { I: params.cost.I, P: params.cost.P, L: params.cost.L, O: params.cost.O, fees, profit },
  }
}
