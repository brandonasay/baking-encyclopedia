import { describe, expect, it } from 'vitest'
import { computeProductPricing, computePlanSummary, resolveOrderLinePrice } from '../bridge'
import { DEFAULT_SETTINGS, type FeePreset, type PantryItem, type Plan, type Product, type Recipe, type Settings } from '../types'

// Same worked example as lib/calculator/__tests__/fixture.test.ts, but built
// through the domain types + bridge (what the UI actually calls) instead of
// the engine directly — exercises computePlanSummary end to end.

function pantryItem(partial: Partial<PantryItem> & Pick<PantryItem, 'id' | 'name' | 'packageQty' | 'packageUnit' | 'packagePrice'>): PantryItem {
  return { ingredientId: null, kind: 'ingredient', usableYieldPct: 100, gramsPerCup: null, gramsPerEach: null, notes: null, ...partial }
}

const flour = pantryItem({ id: 'flour', name: 'Flour', packageQty: 5, packageUnit: 'lb', packagePrice: 4.29, gramsPerCup: 120 })
const butter = pantryItem({ id: 'butter', name: 'Butter', packageQty: 1, packageUnit: 'lb', packagePrice: 5.49 })
const brownSugar = pantryItem({ id: 'brown_sugar', name: 'Brown sugar', packageQty: 2, packageUnit: 'lb', packagePrice: 3.19 })
const sugar = pantryItem({ id: 'sugar', name: 'Sugar', packageQty: 4, packageUnit: 'lb', packagePrice: 3.79 })
const eggs = pantryItem({ id: 'eggs', name: 'Eggs', packageQty: 12, packageUnit: 'each', packagePrice: 3.99 })
const chips = pantryItem({ id: 'chips', name: 'Chocolate chips', packageQty: 12, packageUnit: 'oz', packagePrice: 3.99 })
const vanilla = pantryItem({ id: 'vanilla', name: 'Vanilla', packageQty: 2, packageUnit: 'floz', packagePrice: 8.99 })
const box6Pack = pantryItem({ id: 'box6pack', name: '6-cookie box', kind: 'packaging', packageQty: 25, packageUnit: 'each', packagePrice: 21.25 })
const box12Pack = pantryItem({ id: 'box12pack', name: '12-cookie box', kind: 'packaging', packageQty: 10, packageUnit: 'each', packagePrice: 12.0 })
const labels = pantryItem({ id: 'labels', name: 'Labels', kind: 'packaging', packageQty: 500, packageUnit: 'each', packagePrice: 30.0 })

const pantryById = Object.fromEntries(
  [flour, butter, brownSugar, sugar, eggs, chips, vanilla, box6Pack, box12Pack, labels].map((p) => [p.id, p])
)

const cookieRecipe: Recipe = {
  id: 'cookie', name: 'Chocolate Chip Cookies', yieldQty: 24, yieldUnitLabel: 'cookies',
  activeMinutes: 45, batchIncrement: 1, notes: null,
  lines: [
    { id: 'l1', pantryItemId: 'flour', qty: 2.25, unit: 'cup', note: null, sortOrder: 0 },
    { id: 'l2', pantryItemId: 'butter', qty: 227, unit: 'g', note: null, sortOrder: 1 },
    { id: 'l3', pantryItemId: 'brown_sugar', qty: 213, unit: 'g', note: null, sortOrder: 2 },
    { id: 'l4', pantryItemId: 'sugar', qty: 100, unit: 'g', note: null, sortOrder: 3 },
    { id: 'l5', pantryItemId: 'eggs', qty: 2, unit: 'each', note: null, sortOrder: 4 },
    { id: 'l6', pantryItemId: 'chips', qty: 340, unit: 'g', note: null, sortOrder: 5 },
    { id: 'l7', pantryItemId: 'vanilla', qty: 2, unit: 'tsp', note: null, sortOrder: 6 },
  ],
}
const recipesById = { cookie: cookieRecipe }

const settings: Settings = { ...DEFAULT_SETTINGS, hourlyRate: 20, monthlyOverhead: 150, expectedProductsPerMonth: 300, defaultMarginPct: 0.3, priceStep: 0.5, countLaborAsCost: true }
const venmo: FeePreset = { id: 'venmo', name: 'Venmo', feePct: 0.019, feeFixed: 0.1, sortOrder: 0 }
const feePresets = [venmo]
const settingsWithVenmo: Settings = { ...settings, defaultFeePresetId: 'venmo' }

const box6: Product = {
  id: 'box6', name: 'Box of 6', extraMinutes: 3, targetMarginPct: null, feePresetId: null, setPrice: null, priceStep: null, countLaborAsCost: null,
  components: [{ id: 'c1', recipeId: 'cookie', qty: 6, sortOrder: 0 }],
  packaging: [{ id: 'p1', pantryItemId: 'box6pack', qty: 1, unit: 'each' }, { id: 'p2', pantryItemId: 'labels', qty: 1, unit: 'each' }],
}
const box12: Product = {
  id: 'box12', name: 'Box of 12', extraMinutes: 4, targetMarginPct: null, feePresetId: null, setPrice: null, priceStep: null, countLaborAsCost: null,
  components: [{ id: 'c2', recipeId: 'cookie', qty: 12, sortOrder: 0 }],
  packaging: [{ id: 'p3', pantryItemId: 'box12pack', qty: 1, unit: 'each' }, { id: 'p4', pantryItemId: 'labels', qty: 1, unit: 'each' }],
}
const productsById = { box6, box12 }

function cents(n: number) { return Math.round(n * 100) / 100 }

describe('bridge: product pricing matches the engine-level fixture', () => {
  it('box of 6 prices at $13.00, box of 12 at $23.50', () => {
    const p6 = computeProductPricing(box6, recipesById, pantryById, settingsWithVenmo, feePresets)
    const p12 = computeProductPricing(box12, recipesById, pantryById, settingsWithVenmo, feePresets)
    expect(p6.suggested.ok && cents(p6.suggested.suggestedPrice.toNumber())).toBe(13.0)
    expect(p12.suggested.ok && cents(p12.suggested.suggestedPrice.toNumber())).toBe(23.5)
  })
})

describe('bridge: computePlanSummary reproduces the Saturday plan', () => {
  const plan: Plan = {
    id: 'plan1', name: 'Saturday pickup', saleDate: '2026-10-10', feePresetId: 'venmo', frozenAt: null, frozenSnapshot: null,
    orders: [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `order-box6-${i}`, customerLabel: null, note: null, sortOrder: i,
        lines: [{ id: `line-box6-${i}`, productId: 'box6', qty: 1, unitPriceOverride: null }],
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `order-box12-${i}`, customerLabel: null, note: null, sortOrder: 10 + i,
        lines: [{ id: `line-box12-${i}`, productId: 'box12', qty: 1, unitPriceOverride: null }],
      })),
    ],
    onHand: [],
  }

  const summary = computePlanSummary(plan, productsById, recipesById, pantryById, settingsWithVenmo, feePresets)

  it('resolves order line prices to the suggested price', () => {
    const price = resolveOrderLinePrice(box6, null, recipesById, pantryById, settingsWithVenmo, feePresets)
    expect(price && cents(price.toNumber())).toBe(13.0)
  })

  it('computes 5 batches with 12 cookie surplus', () => {
    expect(summary.ok).toBe(true)
    const batch = summary.batches.find((b) => b.recipeId === 'cookie')!
    expect(batch.batches.toNumber()).toBe(5)
    expect(batch.surplus.toNumber()).toBe(12)
  })

  it('shopping list totals $127.11', () => {
    const total = summary.shopping.reduce((sum, s) => sum + s.estimatedSpend.toNumber(), 0)
    expect(cents(total)).toBe(127.11)
    const flourLine = summary.shopping.find((s) => s.pantryItemId === 'flour')!
    expect(flourLine.packagesToBuy.toNumber()).toBe(1)
    const butterLine = summary.shopping.find((s) => s.pantryItemId === 'butter')!
    expect(butterLine.packagesToBuy.toNumber()).toBe(3)
  })

  it('P&L: revenue $224, profit $55.04, $32.18/hr', () => {
    expect(cents(summary.pnl.revenue.toNumber())).toBe(224.0)
    expect(cents(summary.pnl.profit.toNumber())).toBe(55.04)
    expect(summary.pnl.effectiveHourlyWage && cents(summary.pnl.effectiveHourlyWage.toNumber())).toBe(32.18)
  })
})
