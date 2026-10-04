// Converts the plain-number domain types (from the store) into the Decimal
// engine inputs and calls the engine — the one place UI code touches
// Decimal, so screens themselves can stay in plain numbers/strings.
import Decimal from 'decimal.js'
import { costPerBaseUnit, lineQuantityInBase, recipeBatchCost, type PantryItemInput as EnginePantryItemInput, type RecipeBatchResult, type RecipeLineInput } from './costing'
import { productCost, suggestedPrice, priceOutputs, type ProductCostResult, type PriceOutputs, type SuggestedPriceResult } from './pricing'
import { aggregateNeeded, computeBatches, orderFee, planPnl, shoppingLine, type BatchResult, type PlanPnlResult, type ShoppingLineResult } from './planning'
import type { FeePreset, PantryItem, Plan, Product, Recipe, Settings } from './types'

const D = (n: number) => new Decimal(n)

export function toEnginePantryItem(item: PantryItem): EnginePantryItemInput {
  return {
    id: item.id,
    packageQty: D(item.packageQty),
    packageUnit: item.packageUnit,
    packagePrice: D(item.packagePrice),
    usableYieldPct: D(item.usableYieldPct),
    gramsPerCup: item.gramsPerCup != null ? D(item.gramsPerCup) : null,
    gramsPerEach: item.gramsPerEach != null ? D(item.gramsPerEach) : null,
  }
}

export function computeRecipeBatch(recipe: Recipe, pantryById: Record<string, PantryItem>): RecipeBatchResult {
  const lines: RecipeLineInput[] = recipe.lines
    .filter((l) => pantryById[l.pantryItemId])
    .map((l) => ({ id: l.id, qty: D(l.qty), unit: l.unit, pantryItem: toEnginePantryItem(pantryById[l.pantryItemId]) }))
  const missingFromDeletedItems = recipe.lines.filter((l) => !pantryById[l.pantryItemId]).map((l) => l.id)
  const result = recipeBatchCost(lines, D(recipe.yieldQty))
  return { ...result, ok: result.ok && missingFromDeletedItems.length === 0, missingLineIds: [...result.missingLineIds, ...missingFromDeletedItems] }
}

export interface FeeTerms {
  feePct: Decimal
  feeFixed: Decimal
}

// Resolution order: product override -> settings default preset -> settings
// custom fee -> zero.
export function resolveFeeTerms(product: Product, settings: Settings, feePresets: FeePreset[]): FeeTerms {
  const presetId = product.feePresetId ?? settings.defaultFeePresetId
  if (presetId) {
    const preset = feePresets.find((p) => p.id === presetId)
    if (preset) return { feePct: D(preset.feePct), feeFixed: D(preset.feeFixed) }
  }
  if (settings.customFeePct != null || settings.customFeeFixed != null) {
    return { feePct: D(settings.customFeePct ?? 0), feeFixed: D(settings.customFeeFixed ?? 0) }
  }
  return { feePct: D(0), feeFixed: D(0) }
}

export function resolveMarginPct(product: Product, settings: Settings): Decimal {
  return D(product.targetMarginPct ?? settings.defaultMarginPct)
}

export function resolvePriceStep(product: Product, settings: Settings): Decimal {
  return D(product.priceStep ?? settings.priceStep)
}

export function resolveCountLaborAsCost(product: Product, settings: Settings): boolean {
  return product.countLaborAsCost ?? settings.countLaborAsCost
}

export interface ProductPricing {
  cost: ProductCostResult
  suggested: SuggestedPriceResult
  outputsAtSuggested: PriceOutputs | null
  outputsAtPrice: (price: number) => PriceOutputs
  feeTerms: FeeTerms
}

export function computeProductPricing(
  product: Product,
  recipesById: Record<string, Recipe>,
  pantryById: Record<string, PantryItem>,
  settings: Settings,
  feePresets: FeePreset[]
): ProductPricing {
  const components = product.components
    .map((c) => {
      const recipe = recipesById[c.recipeId]
      if (!recipe) return null
      return {
        qty: D(c.qty),
        recipeBatch: computeRecipeBatch(recipe, pantryById),
        recipeYieldQty: D(recipe.yieldQty),
        recipeActiveMinutes: D(recipe.activeMinutes),
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  const missingComponents = product.components.length - components.length

  const packaging = product.packaging
    .filter((p) => pantryById[p.pantryItemId])
    .map((p) => ({ id: p.id, line: { qty: D(p.qty), unit: p.unit, pantryItem: toEnginePantryItem(pantryById[p.pantryItemId]) } }))

  const countLaborAsCost = resolveCountLaborAsCost(product, settings)

  const cost = productCost({
    components,
    packaging,
    extraMinutes: D(product.extraMinutes),
    hourlyRate: D(settings.hourlyRate),
    monthlyOverhead: D(settings.monthlyOverhead),
    expectedProductsPerMonth: D(settings.expectedProductsPerMonth),
    countLaborAsCost,
  })
  if (missingComponents > 0) cost.ok = false

  const feeTerms = resolveFeeTerms(product, settings, feePresets)
  const marginPct = resolveMarginPct(product, settings)
  const priceStep = resolvePriceStep(product, settings)

  const suggested = suggestedPrice({ cost, feePct: feeTerms.feePct, feeFixed: feeTerms.feeFixed, marginPct, priceStep })
  const outputsAtSuggested = suggested.ok
    ? priceOutputs({ price: suggested.suggestedPrice, cost, feePct: feeTerms.feePct, feeFixed: feeTerms.feeFixed })
    : null

  return {
    cost,
    suggested,
    outputsAtSuggested,
    outputsAtPrice: (price: number) => priceOutputs({ price: D(price), cost, feePct: feeTerms.feePct, feeFixed: feeTerms.feeFixed }),
    feeTerms,
  }
}

// Resolves what a plan order line actually sells for: an explicit override,
// else the product's own set price, else its suggested price.
export function resolveOrderLinePrice(
  product: Product,
  unitPriceOverride: number | null,
  recipesById: Record<string, Recipe>,
  pantryById: Record<string, PantryItem>,
  settings: Settings,
  feePresets: FeePreset[]
): Decimal | null {
  if (unitPriceOverride != null) return D(unitPriceOverride)
  if (product.setPrice != null) return D(product.setPrice)
  const pricing = computeProductPricing(product, recipesById, pantryById, settings, feePresets)
  return pricing.suggested.ok ? pricing.suggested.suggestedPrice : null
}

export interface PlanSummary {
  ok: boolean
  incompleteReason?: string
  batches: BatchResult[]
  shopping: (ShoppingLineResult & { pantryItem: PantryItem; checked: boolean })[]
  pnl: PlanPnlResult
}

// Everything the Batches / Shopping / P&L tabs need, computed from the
// plan's orders plus the current (live) pantry/recipe/product/settings
// state. A frozen plan instead renders its stored frozenSnapshot verbatim —
// this function is only for the live path.
export function computePlanSummary(
  plan: Plan,
  productsById: Record<string, Product>,
  recipesById: Record<string, Recipe>,
  pantryById: Record<string, PantryItem>,
  settings: Settings,
  feePresets: FeePreset[]
): PlanSummary {
  const allLines = plan.orders.flatMap((o) => o.lines.map((l) => ({ order: o, line: l })))

  // 1. Demand per recipe, in the recipe's own yield unit.
  const demandByRecipe: Record<string, Decimal> = {}
  for (const { line } of allLines) {
    const product = productsById[line.productId]
    if (!product) return { ok: false, incompleteReason: 'A product in this plan no longer exists.', batches: [], shopping: [], pnl: emptyPnl() }
    for (const comp of product.components) {
      const recipe = recipesById[comp.recipeId]
      if (!recipe) continue
      demandByRecipe[comp.recipeId] = (demandByRecipe[comp.recipeId] ?? D(0)).plus(D(line.qty).times(comp.qty))
    }
  }

  const batches = computeBatches(
    Object.entries(demandByRecipe).map(([recipeId, unitsNeeded]) => ({
      recipeId, unitsNeeded, yieldQty: D(recipesById[recipeId].yieldQty), batchIncrement: D(recipesById[recipeId].batchIncrement),
    }))
  )
  const batchesByRecipe = Object.fromEntries(batches.map((b) => [b.recipeId, b]))

  // 2. Shopping list contributions: recipe lines (scaled by batches) + packaging (scaled by order qty).
  const contributions = [
    ...Object.entries(demandByRecipe).flatMap(([recipeId]) => {
      const recipe = recipesById[recipeId]
      const batchCount = batchesByRecipe[recipeId]?.batches ?? D(0)
      return recipe.lines.map((l) => ({ pantryItemId: l.pantryItemId, qty: batchCount.times(l.qty), unit: l.unit }))
    }),
    ...allLines.flatMap(({ line }) => {
      const product = productsById[line.productId]
      return product.packaging.map((p) => ({ pantryItemId: p.pantryItemId, qty: D(line.qty).times(p.qty), unit: p.unit }))
    }),
  ]
  const enginePantryById = Object.fromEntries(Object.entries(pantryById).map(([id, p]) => [id, toEnginePantryItem(p)]))
  const agg = aggregateNeeded(enginePantryById, contributions)
  const onHandByItem = Object.fromEntries(
    plan.onHand.map((h) => {
      const engineItem = enginePantryById[h.pantryItemId]
      if (!engineItem) return [h.pantryItemId, D(0)]
      const r = lineQuantityInBase(D(h.qty), h.unit, engineItem)
      return [h.pantryItemId, r.ok ? r.value : D(0)]
    })
  )
  const shopping = Object.entries(agg.neededByItem)
    .filter(([id]) => pantryById[id])
    .map(([id, needed]) => {
      const item = pantryById[id]
      const onHandEntry = plan.onHand.find((h) => h.pantryItemId === id)
      return { ...shoppingLine(enginePantryById[id], needed, onHandByItem[id] ?? D(0)), pantryItem: item, checked: onHandEntry?.checked ?? false }
    })

  // 3. P&L.
  const feeTerms = resolvePlanFeeTerms(plan, settings, feePresets)
  let revenue = D(0)
  let orderFees = D(0)
  let packaging = D(0)
  let laborMinutesFromExtra = D(0)
  let overhead = D(0)
  const O = settings.expectedProductsPerMonth > 0 ? D(settings.monthlyOverhead).div(settings.expectedProductsPerMonth) : D(0)

  for (const order of plan.orders) {
    let orderTotal = D(0)
    for (const line of order.lines) {
      const product = productsById[line.productId]
      const price = resolveOrderLinePrice(product, line.unitPriceOverride, recipesById, pantryById, settings, feePresets)
      if (price) orderTotal = orderTotal.plus(price.times(line.qty))
      const packagingCost = product.packaging.reduce((sum, p) => {
        const engineItem = enginePantryById[p.pantryItemId]
        if (!engineItem) return sum
        const r = lineQuantityInBase(D(p.qty), p.unit, engineItem)
        if (!r.ok) return sum
        const c = costPerBaseUnit(engineItem)
        return c.ok ? sum.plus(r.value.times(c.costPerBaseUnit)) : sum
      }, D(0))
      packaging = packaging.plus(packagingCost.times(line.qty))
      laborMinutesFromExtra = laborMinutesFromExtra.plus(D(line.qty).times(product.extraMinutes))
      overhead = overhead.plus(D(line.qty).times(O))
    }
    revenue = revenue.plus(orderTotal)
    orderFees = orderFees.plus(orderFee(orderTotal, feeTerms.feePct, feeTerms.feeFixed))
  }

  const ingredientsUsed = batches.reduce((sum, b) => {
    const recipe = recipesById[b.recipeId]
    const batch = recipeBatchCost(
      recipe.lines.map((l) => ({ id: l.id, qty: D(l.qty), unit: l.unit, pantryItem: toEnginePantryItem(pantryById[l.pantryItemId]) })),
      D(recipe.yieldQty)
    )
    return sum.plus(b.batches.times(batch.batchCost))
  }, D(0))

  const laborMinutes = batches
    .reduce((sum, b) => sum.plus(b.batches.times(D(recipesById[b.recipeId].activeMinutes))), D(0))
    .plus(laborMinutesFromExtra)

  const pnl = planPnl({
    revenue, orderFees, ingredientsUsed, packaging, laborMinutes,
    hourlyRate: D(settings.hourlyRate), overhead, countLaborAsCost: settings.countLaborAsCost,
  })

  return { ok: true, batches, shopping, pnl }
}

function resolvePlanFeeTerms(plan: Plan, settings: Settings, feePresets: FeePreset[]): FeeTerms {
  const presetId = plan.feePresetId ?? settings.defaultFeePresetId
  if (presetId) {
    const preset = feePresets.find((p) => p.id === presetId)
    if (preset) return { feePct: D(preset.feePct), feeFixed: D(preset.feeFixed) }
  }
  if (settings.customFeePct != null || settings.customFeeFixed != null) {
    return { feePct: D(settings.customFeePct ?? 0), feeFixed: D(settings.customFeeFixed ?? 0) }
  }
  return { feePct: D(0), feeFixed: D(0) }
}

function emptyPnl(): PlanPnlResult {
  return { revenue: D(0), fees: D(0), ingredientsUsed: D(0), packaging: D(0), laborCost: D(0), laborHours: D(0), overhead: D(0), profit: D(0), effectiveHourlyWage: null }
}

// Decimal survives JSON.stringify as a quoted string (decimal.js defines
// toJSON()), which silently loses every Decimal method on the way back out
// of a jsonb column. A frozen plan snapshot must explicitly round-trip
// through plain strings/numbers instead of trusting `as unknown as X` casts.
export interface SerializedPlanSummary {
  ok: boolean
  incompleteReason?: string
  batches: { recipeId: string; unitsNeeded: string; batches: string; unitsProduced: string; surplus: string }[]
  shopping: { pantryItemId: string; neededAfterOnHand: string; packagesToBuy: string; estimatedSpend: string; fullyCovered: boolean; pantryItem: PantryItem; checked: boolean }[]
  pnl: { revenue: string; fees: string; ingredientsUsed: string; packaging: string; laborCost: string; laborHours: string; overhead: string; profit: string; effectiveHourlyWage: string | null }
}

export function serializePlanSummary(summary: PlanSummary): SerializedPlanSummary {
  return {
    ok: summary.ok,
    incompleteReason: summary.incompleteReason,
    batches: summary.batches.map((b) => ({
      recipeId: b.recipeId, unitsNeeded: b.unitsNeeded.toString(), batches: b.batches.toString(),
      unitsProduced: b.unitsProduced.toString(), surplus: b.surplus.toString(),
    })),
    shopping: summary.shopping.map((s) => ({
      pantryItemId: s.pantryItemId, neededAfterOnHand: s.neededAfterOnHand.toString(), packagesToBuy: s.packagesToBuy.toString(),
      estimatedSpend: s.estimatedSpend.toString(), fullyCovered: s.fullyCovered, pantryItem: s.pantryItem, checked: s.checked,
    })),
    pnl: {
      revenue: summary.pnl.revenue.toString(), fees: summary.pnl.fees.toString(), ingredientsUsed: summary.pnl.ingredientsUsed.toString(),
      packaging: summary.pnl.packaging.toString(), laborCost: summary.pnl.laborCost.toString(), laborHours: summary.pnl.laborHours.toString(),
      overhead: summary.pnl.overhead.toString(), profit: summary.pnl.profit.toString(),
      effectiveHourlyWage: summary.pnl.effectiveHourlyWage ? summary.pnl.effectiveHourlyWage.toString() : null,
    },
  }
}

export function deserializePlanSummary(s: SerializedPlanSummary): PlanSummary {
  return {
    ok: s.ok,
    incompleteReason: s.incompleteReason,
    batches: s.batches.map((b) => ({
      recipeId: b.recipeId, unitsNeeded: D(Number(b.unitsNeeded)), batches: D(Number(b.batches)),
      unitsProduced: D(Number(b.unitsProduced)), surplus: D(Number(b.surplus)),
    })),
    shopping: s.shopping.map((row) => ({
      pantryItemId: row.pantryItemId, neededAfterOnHand: D(Number(row.neededAfterOnHand)), packagesToBuy: D(Number(row.packagesToBuy)),
      estimatedSpend: D(Number(row.estimatedSpend)), fullyCovered: row.fullyCovered, pantryItem: row.pantryItem, checked: row.checked,
    })),
    pnl: {
      revenue: D(Number(s.pnl.revenue)), fees: D(Number(s.pnl.fees)), ingredientsUsed: D(Number(s.pnl.ingredientsUsed)),
      packaging: D(Number(s.pnl.packaging)), laborCost: D(Number(s.pnl.laborCost)), laborHours: D(Number(s.pnl.laborHours)),
      overhead: D(Number(s.pnl.overhead)), profit: D(Number(s.pnl.profit)),
      effectiveHourlyWage: s.pnl.effectiveHourlyWage != null ? D(Number(s.pnl.effectiveHourlyWage)) : null,
    },
  }
}
