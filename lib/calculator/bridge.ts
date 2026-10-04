// Converts the plain-number domain types (from the store) into the Decimal
// engine inputs and calls the engine — the one place UI code touches
// Decimal, so screens themselves can stay in plain numbers/strings.
import Decimal from 'decimal.js'
import { recipeBatchCost, type PantryItemInput as EnginePantryItemInput, type RecipeBatchResult, type RecipeLineInput } from './costing'
import { productCost, suggestedPrice, priceOutputs, type ProductCostResult, type PriceOutputs, type SuggestedPriceResult } from './pricing'
import type { FeePreset, PantryItem, Product, Recipe, Settings } from './types'

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
