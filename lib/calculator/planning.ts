import Decimal from 'decimal.js'
import { lineQuantityInBase, type PantryItemInput } from './costing'
import type { UnitCode } from './units'

export interface BatchInput {
  recipeId: string
  unitsNeeded: Decimal
  yieldQty: Decimal
  batchIncrement: Decimal
}

export interface BatchResult {
  recipeId: string
  unitsNeeded: Decimal
  batches: Decimal
  unitsProduced: Decimal
  surplus: Decimal
}

// Batches = units needed / yield, rounded up to the recipe's batch increment.
export function computeBatches(demand: BatchInput[]): BatchResult[] {
  return demand.map((d) => {
    const rawBatches = d.unitsNeeded.div(d.yieldQty)
    const steps = rawBatches.div(d.batchIncrement).ceil()
    const batches = steps.times(d.batchIncrement)
    const unitsProduced = batches.times(d.yieldQty)
    return { recipeId: d.recipeId, unitsNeeded: d.unitsNeeded, batches, unitsProduced, surplus: unitsProduced.minus(d.unitsNeeded) }
  })
}

export interface DemandContribution {
  pantryItemId: string
  qty: Decimal
  unit: UnitCode
}

export interface AggregateNeededResult {
  ok: boolean
  neededByItem: Record<string, Decimal>
  missingItemIds: string[]
}

// Sums every demand contribution (recipe-line-times-batches, packaging-times-
// order-qty) into needed-per-pantry-item, all converted to that item's base
// unit. A contribution that can't be converted (missing density, unknown
// item) marks that item's total as incomplete rather than silently dropping it.
export function aggregateNeeded(
  pantryItems: Record<string, PantryItemInput>,
  contributions: DemandContribution[]
): AggregateNeededResult {
  const neededByItem: Record<string, Decimal> = {}
  const missing = new Set<string>()

  for (const c of contributions) {
    const item = pantryItems[c.pantryItemId]
    if (!item) { missing.add(c.pantryItemId); continue }
    const r = lineQuantityInBase(c.qty, c.unit, item)
    if (!r.ok) { missing.add(c.pantryItemId); continue }
    neededByItem[c.pantryItemId] = (neededByItem[c.pantryItemId] ?? new Decimal(0)).plus(r.value)
  }

  return { ok: missing.size === 0, neededByItem, missingItemIds: [...missing] }
}

export interface ShoppingLineResult {
  pantryItemId: string
  neededAfterOnHand: Decimal
  packagesToBuy: Decimal
  estimatedSpend: Decimal
  fullyCovered: boolean
}

// Needed (after subtracting on-hand, floored at 0) -> packages to buy,
// rounded up -> estimated spend.
export function shoppingLine(item: PantryItemInput, neededBase: Decimal, onHandBase: Decimal): ShoppingLineResult {
  const net = Decimal.max(0, neededBase.minus(onHandBase))
  const packageQtyInBase = item.packageQty.times(unitToBaseFactor(item))
  const packagesToBuy = net.gt(0) ? net.div(packageQtyInBase).ceil() : new Decimal(0)
  return {
    pantryItemId: item.id,
    neededAfterOnHand: net,
    packagesToBuy,
    estimatedSpend: packagesToBuy.times(item.packagePrice),
    fullyCovered: net.eq(0),
  }
}

// Internal helper — package qty is always same-dimension as its own unit, so
// this never needs density.
function unitToBaseFactor(item: PantryItemInput): Decimal {
  const r = lineQuantityInBase(new Decimal(1), item.packageUnit, item)
  if (!r.ok) throw new Error('package unit must share a dimension with itself — this should never happen')
  return r.value
}

export interface PlanPnlInput {
  revenue: Decimal
  orderFees: Decimal
  ingredientsUsed: Decimal
  packaging: Decimal
  laborMinutes: Decimal
  hourlyRate: Decimal
  overhead: Decimal
  countLaborAsCost: boolean
}

export interface PlanPnlResult {
  revenue: Decimal
  fees: Decimal
  ingredientsUsed: Decimal
  packaging: Decimal
  laborCost: Decimal
  laborHours: Decimal
  overhead: Decimal
  profit: Decimal
  effectiveHourlyWage: Decimal | null
}

export function planPnl(input: PlanPnlInput): PlanPnlResult {
  const laborHours = input.laborMinutes.div(60)
  const fullLaborCost = input.hourlyRate.div(60).times(input.laborMinutes)
  const laborCost = input.countLaborAsCost ? fullLaborCost : new Decimal(0)

  const profit = input.revenue
    .minus(input.orderFees)
    .minus(input.ingredientsUsed)
    .minus(input.packaging)
    .minus(laborCost)
    .minus(input.overhead)

  const effectiveHourlyWage = laborHours.gt(0) ? profit.plus(laborCost).div(laborHours) : null

  return {
    revenue: input.revenue,
    fees: input.orderFees,
    ingredientsUsed: input.ingredientsUsed,
    packaging: input.packaging,
    laborCost,
    laborHours,
    overhead: input.overhead,
    profit,
    effectiveHourlyWage,
  }
}

// Fee is charged once per order (on the order's line-sum total), not per line.
export function orderFee(orderTotal: Decimal, feePct: Decimal, feeFixed: Decimal): Decimal {
  return orderTotal.times(feePct).plus(feeFixed)
}
