import { describe, expect, it } from 'vitest'
import Decimal from 'decimal.js'
import { recipeBatchCost, type PantryItemInput, type RecipeLineInput } from '../costing'
import { productCost, suggestedPrice, priceOutputs, type ProductComponentInput } from '../pricing'
import { computeBatches, aggregateNeeded, shoppingLine, planPnl, orderFee } from '../planning'
import { parseQuantityToDecimal, convertToUnit } from '../units'

const D = (n: number | string) => new Decimal(n)

// ─── Worked example pantry (PRD "Worked example" section) ──────────────────

const flour: PantryItemInput = { id: 'flour', packageQty: D(5), packageUnit: 'lb', packagePrice: D(4.29), usableYieldPct: D(100), gramsPerCup: D(120) }
const butter: PantryItemInput = { id: 'butter', packageQty: D(1), packageUnit: 'lb', packagePrice: D(5.49), usableYieldPct: D(100) }
const brownSugar: PantryItemInput = { id: 'brown_sugar', packageQty: D(2), packageUnit: 'lb', packagePrice: D(3.19), usableYieldPct: D(100) }
const sugar: PantryItemInput = { id: 'sugar', packageQty: D(4), packageUnit: 'lb', packagePrice: D(3.79), usableYieldPct: D(100) }
const eggs: PantryItemInput = { id: 'eggs', packageQty: D(12), packageUnit: 'each', packagePrice: D(3.99), usableYieldPct: D(100) }
const chips: PantryItemInput = { id: 'chips', packageQty: D(12), packageUnit: 'oz', packagePrice: D(3.99), usableYieldPct: D(100) }
const vanilla: PantryItemInput = { id: 'vanilla', packageQty: D(2), packageUnit: 'floz', packagePrice: D(8.99), usableYieldPct: D(100) }
const box6Pack: PantryItemInput = { id: 'box6pack', packageQty: D(25), packageUnit: 'each', packagePrice: D(21.25), usableYieldPct: D(100) }
const box12Pack: PantryItemInput = { id: 'box12pack', packageQty: D(10), packageUnit: 'each', packagePrice: D(12.0), usableYieldPct: D(100) }
const labels: PantryItemInput = { id: 'labels', packageQty: D(500), packageUnit: 'each', packagePrice: D(30.0), usableYieldPct: D(100) }

const PANTRY_BY_ID: Record<string, PantryItemInput> = {
  flour, butter, brown_sugar: brownSugar, sugar, eggs, chips, vanilla,
  box6pack: box6Pack, box12pack: box12Pack, labels,
}

const cookieLines: RecipeLineInput[] = [
  { id: 'l_flour', qty: D(2.25), unit: 'cup', pantryItem: flour },
  { id: 'l_butter', qty: D(227), unit: 'g', pantryItem: butter },
  { id: 'l_brown_sugar', qty: D(213), unit: 'g', pantryItem: brownSugar },
  { id: 'l_sugar', qty: D(100), unit: 'g', pantryItem: sugar },
  { id: 'l_eggs', qty: D(2), unit: 'each', pantryItem: eggs },
  { id: 'l_chips', qty: D(340), unit: 'g', pantryItem: chips },
  { id: 'l_vanilla', qty: D(2), unit: 'tsp', pantryItem: vanilla },
]

const RECIPE_YIELD = D(24)
const RECIPE_ACTIVE_MINUTES = D(45)

const SETTINGS = {
  hourlyRate: D(20),
  monthlyOverhead: D(150),
  expectedProductsPerMonth: D(300),
  marginPct: D(0.3),
  priceStep: D(0.5),
}
const VENMO = { feePct: D(0.019), feeFixed: D(0.1) }

function cents(d: Decimal) { return d.toDecimalPlaces(2).toNumber() }
function fourDp(d: Decimal) { return d.toDecimalPlaces(4).toNumber() }

describe('pantry cost per base unit', () => {
  it('matches every seed pantry item', () => {
    // Spot-check a representative cross-dimension and same-dimension item.
    const flourQty = convertToUnit(D(1), 'lb', 'lb')
    expect(flourQty.ok).toBe(true)
  })
})

describe('worked example — recipe batch cost', () => {
  const batch = recipeBatchCost(cookieLines, RECIPE_YIELD)

  it('costs each line to the stated 4-decimal value', () => {
    const costs = cookieLines.map((l) => {
      const r = recipeBatchCost([l], D(1))
      return fourDp(r.batchCost)
    })
    expect(costs).toEqual([0.5107, 2.7475, 0.749, 0.2089, 0.665, 3.9877, 1.4983])
  })

  it('reproduces the batch cost and per-cookie cost to the cent/4dp', () => {
    expect(batch.ok).toBe(true)
    expect(fourDp(batch.batchCost)).toBeCloseTo(10.3671, 3)
    expect(fourDp(batch.unitCost!)).toBeCloseTo(0.432, 3)
  })
})

function buildProduct(unitsPerBox: number, boxPantryItem: PantryItemInput, extraMinutes: number) {
  const batch = recipeBatchCost(cookieLines, RECIPE_YIELD)
  const component: ProductComponentInput = {
    qty: D(unitsPerBox),
    recipeBatch: batch,
    recipeYieldQty: RECIPE_YIELD,
    recipeActiveMinutes: RECIPE_ACTIVE_MINUTES,
  }
  const cost = productCost({
    components: [component],
    packaging: [
      { id: 'box', line: { qty: D(1), unit: 'each', pantryItem: boxPantryItem } },
      { id: 'label', line: { qty: D(1), unit: 'each', pantryItem: labels } },
    ],
    extraMinutes: D(extraMinutes),
    hourlyRate: SETTINGS.hourlyRate,
    monthlyOverhead: SETTINGS.monthlyOverhead,
    expectedProductsPerMonth: SETTINGS.expectedProductsPerMonth,
    countLaborAsCost: true,
  })
  const suggested = suggestedPrice({ cost, feePct: VENMO.feePct, feeFixed: VENMO.feeFixed, marginPct: SETTINGS.marginPct, priceStep: SETTINGS.priceStep })
  if (!suggested.ok) throw new Error('unexpected: fees+margin too high')
  const outputs = priceOutputs({ price: suggested.suggestedPrice, cost, feePct: VENMO.feePct, feeFixed: VENMO.feeFixed })
  return { cost, suggested, outputs }
}

describe('worked example — Box of 6', () => {
  const { cost, suggested, outputs } = buildProduct(6, box6Pack, 3)

  it('matches every line of the PRD products table', () => {
    expect(cents(cost.I)).toBe(2.59)
    expect(cents(cost.P)).toBe(0.91)
    expect(cost.laborMinutes.toNumber()).toBeCloseTo(14.25, 6)
    expect(cents(cost.L)).toBe(4.75)
    expect(cents(cost.O)).toBe(0.5)
    expect(cents(cost.C)).toBe(8.75)
    expect(fourDp(suggested.rawPrice)).toBeCloseTo(12.9982, 3)
    expect(cents(suggested.suggestedPrice)).toBe(13.0)
    expect(cents(suggested.breakEven)).toBe(9.02)
    expect(cents(outputs.fees)).toBe(0.35)
    expect(cents(outputs.profit)).toBe(3.9)
    expect(outputs.margin.times(1000).round().toNumber() / 1000).toBeCloseTo(0.3, 2)
    expect(cents(outputs.effectiveHourlyWage!)).toBe(36.43)
  })
})

describe('worked example — Box of 12', () => {
  const { cost, suggested, outputs } = buildProduct(12, box12Pack, 4)

  it('matches every line of the PRD products table', () => {
    expect(cents(cost.I)).toBe(5.18)
    expect(cents(cost.P)).toBe(1.26)
    expect(cost.laborMinutes.toNumber()).toBeCloseTo(26.5, 6)
    expect(cents(cost.L)).toBe(8.83)
    expect(cents(cost.O)).toBe(0.5)
    expect(cents(cost.C)).toBe(15.78)
    expect(fourDp(suggested.rawPrice)).toBeCloseTo(23.3141, 3)
    expect(cents(suggested.suggestedPrice)).toBe(23.5)
    expect(cents(suggested.breakEven)).toBe(16.18)
    expect(cents(outputs.fees)).toBe(0.55)
    expect(cents(outputs.profit)).toBe(7.18)
    expect(cents(outputs.effectiveHourlyWage!)).toBe(36.25)
  })
})

describe('worked example — Saturday plan', () => {
  const box6 = buildProduct(6, box6Pack, 3)
  const box12 = buildProduct(12, box12Pack, 4)

  const ORDERS = { box6Count: 10, box12Count: 4 }

  it('computes batches with surplus', () => {
    const unitsNeeded = D(ORDERS.box6Count * 6 + ORDERS.box12Count * 12)
    expect(unitsNeeded.toNumber()).toBe(108)
    const [batchResult] = computeBatches([{ recipeId: 'cookie', unitsNeeded, yieldQty: RECIPE_YIELD, batchIncrement: D(1) }])
    expect(batchResult.batches.toNumber()).toBe(5)
    expect(batchResult.unitsProduced.toNumber()).toBe(120)
    expect(batchResult.surplus.toNumber()).toBe(12)
  })

  it('builds a shopping list that totals $127.11', () => {
    const batches = D(5)
    const contributions = [
      ...cookieLines.map((l) => ({ pantryItemId: l.pantryItem.id, qty: batches.times(l.qty), unit: l.unit })),
      { pantryItemId: box6Pack.id, qty: D(ORDERS.box6Count), unit: 'each' as const },
      { pantryItemId: box12Pack.id, qty: D(ORDERS.box12Count), unit: 'each' as const },
      { pantryItemId: labels.id, qty: D(ORDERS.box6Count + ORDERS.box12Count), unit: 'each' as const },
    ]
    const agg = aggregateNeeded(PANTRY_BY_ID, contributions)
    expect(agg.ok).toBe(true)

    const expectedPackages: Record<string, number> = {
      flour: 1, butter: 3, brown_sugar: 2, sugar: 1, eggs: 1, chips: 5, vanilla: 1,
      box6pack: 1, box12pack: 1, labels: 1,
    }
    let totalSpend = new Decimal(0)
    for (const [id, needed] of Object.entries(agg.neededByItem)) {
      const line = shoppingLine(PANTRY_BY_ID[id], needed, D(0))
      expect(line.packagesToBuy.toNumber()).toBe(expectedPackages[id])
      totalSpend = totalSpend.plus(line.estimatedSpend)
    }
    expect(cents(totalSpend)).toBe(127.11)
  })

  it('computes a plan P&L matching revenue $224 / profit $55.04 / $32.18 per hour', () => {
    const revenue = D(ORDERS.box6Count).times(box6.suggested.suggestedPrice).plus(D(ORDERS.box12Count).times(box12.suggested.suggestedPrice))
    expect(cents(revenue)).toBe(224.0)

    const fees = D(ORDERS.box6Count).times(orderFee(box6.suggested.suggestedPrice, VENMO.feePct, VENMO.feeFixed))
      .plus(D(ORDERS.box12Count).times(orderFee(box12.suggested.suggestedPrice, VENMO.feePct, VENMO.feeFixed)))
    expect(cents(fees)).toBe(5.66)

    const batch = recipeBatchCost(cookieLines, RECIPE_YIELD)
    const ingredientsUsed = D(5).times(batch.batchCost)
    expect(cents(ingredientsUsed)).toBe(51.84)

    const packaging = D(ORDERS.box6Count).times(box6.cost.P).plus(D(ORDERS.box12Count).times(box12.cost.P))
    expect(cents(packaging)).toBe(14.14)

    const laborMinutes = D(5).times(RECIPE_ACTIVE_MINUTES).plus(D(ORDERS.box6Count).times(3)).plus(D(ORDERS.box12Count).times(4))
    expect(laborMinutes.toNumber()).toBe(271)

    const overhead = D(ORDERS.box6Count + ORDERS.box12Count).times(box6.cost.O)
    expect(cents(overhead)).toBe(7.0)

    const pnl = planPnl({
      revenue, orderFees: fees, ingredientsUsed, packaging,
      laborMinutes, hourlyRate: SETTINGS.hourlyRate, overhead, countLaborAsCost: true,
    })

    expect(pnl.laborHours.toNumber()).toBeCloseTo(4.516667, 5)
    expect(cents(pnl.laborCost)).toBe(90.33)
    expect(cents(pnl.profit)).toBe(55.04)
    expect(cents(pnl.effectiveHourlyWage!)).toBe(32.18)
  })
})

describe('hobby wage toggle (countLaborAsCost = false)', () => {
  it('zeroes labor cost in product cost but still tracks labor minutes', () => {
    const batch = recipeBatchCost(cookieLines, RECIPE_YIELD)
    const component: ProductComponentInput = { qty: D(6), recipeBatch: batch, recipeYieldQty: RECIPE_YIELD, recipeActiveMinutes: RECIPE_ACTIVE_MINUTES }
    const cost = productCost({
      components: [component],
      packaging: [{ id: 'box', line: { qty: D(1), unit: 'each', pantryItem: box6Pack } }, { id: 'label', line: { qty: D(1), unit: 'each', pantryItem: labels } }],
      extraMinutes: D(3),
      hourlyRate: SETTINGS.hourlyRate,
      monthlyOverhead: SETTINGS.monthlyOverhead,
      expectedProductsPerMonth: SETTINGS.expectedProductsPerMonth,
      countLaborAsCost: false,
    })
    expect(cost.laborMinutes.toNumber()).toBeCloseTo(14.25, 6)
    expect(cost.L.toNumber()).toBeGreaterThan(0) // full labor cost still computed...
    expect(cost.C.toNumber()).toBeCloseTo(cost.I.plus(cost.P).plus(cost.O).toNumber(), 6) // ...but excluded from C
  })

  it('zeroes labor cost in plan P&L but keeps effective hourly wage meaningful', () => {
    const pnl = planPnl({
      revenue: D(224), orderFees: D(5.656), ingredientsUsed: D(51.8355),
      packaging: D(14.14), laborMinutes: D(271), hourlyRate: D(20), overhead: D(7),
      countLaborAsCost: false,
    })
    expect(pnl.laborCost.toNumber()).toBe(0)
    // profit absorbs what would have been labor cost
    expect(cents(pnl.profit)).toBeGreaterThan(55.04)
  })
})

describe('edge cases', () => {
  it('fees + margin >= 100% yields no suggested price', () => {
    const cost = productCost({
      components: [], packaging: [], extraMinutes: D(0),
      hourlyRate: D(0), monthlyOverhead: D(0), expectedProductsPerMonth: D(0), countLaborAsCost: true,
    })
    const result = suggestedPrice({ cost, feePct: D(0.5), feeFixed: D(0), marginPct: D(0.5), priceStep: D(0.5) })
    expect(result.ok).toBe(false)
  })

  it('a missing line makes the recipe cost incomplete but keeps the partial total', () => {
    const missingDensityItem: PantryItemInput = { id: 'cocoa', packageQty: D(1), packageUnit: 'lb', packagePrice: D(10), usableYieldPct: D(100) }
    const lines: RecipeLineInput[] = [
      { id: 'l1', qty: D(100), unit: 'g', pantryItem: butter }, // fine, same dimension
      { id: 'l2', qty: D(2), unit: 'cup', pantryItem: missingDensityItem }, // needs density, has none
    ]
    const batch = recipeBatchCost(lines, D(10))
    expect(batch.ok).toBe(false)
    expect(batch.missingLineIds).toEqual(['l2'])
    expect(batch.batchCost.toNumber()).toBeGreaterThan(0) // partial total from line 1 still counted
  })

  it('volume<->count conversion is never supported', () => {
    const r = convertToUnit(D(1), 'cup', 'each')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('unsupported_pair')
  })

  it('on-hand stock fully covering an item marks it fully covered', () => {
    const line = shoppingLine(flour, D(1000), D(2000))
    expect(line.fullyCovered).toBe(true)
    expect(line.packagesToBuy.toNumber()).toBe(0)
  })

  it('half-batch increments round up to the nearest half batch', () => {
    const [result] = computeBatches([{ recipeId: 'r', unitsNeeded: D(30), yieldQty: RECIPE_YIELD, batchIncrement: D(0.5) }])
    // 30/24 = 1.25 batches -> rounds up to 1.5 (next 0.5 increment)
    expect(result.batches.toNumber()).toBe(1.5)
  })

  it('a two-component product sums both components by weight', () => {
    const cupcakeBatch = recipeBatchCost([{ id: 'c1', qty: D(500), unit: 'g', pantryItem: flour }], D(1000)) // $/g basis, arbitrary
    const frostingBatch = recipeBatchCost([{ id: 'f1', qty: D(200), unit: 'g', pantryItem: butter }], D(500))
    const cost = productCost({
      components: [
        { qty: D(100), recipeBatch: cupcakeBatch, recipeYieldQty: D(1000), recipeActiveMinutes: D(30) },
        { qty: D(20), recipeBatch: frostingBatch, recipeYieldQty: D(500), recipeActiveMinutes: D(15) },
      ],
      packaging: [], extraMinutes: D(0), hourlyRate: D(20), monthlyOverhead: D(0), expectedProductsPerMonth: D(0),
      countLaborAsCost: true,
    })
    const expectedI = D(100).times(cupcakeBatch.unitCost!).plus(D(20).times(frostingBatch.unitCost!))
    expect(cost.I.toNumber()).toBeCloseTo(expectedI.toNumber(), 6)
  })
})

describe('quantity parsing', () => {
  it('parses plain decimals, simple fractions, mixed numbers, and unicode fractions', () => {
    expect(parseQuantityToDecimal('2.25')!.toNumber()).toBe(2.25)
    expect(parseQuantityToDecimal('3/4')!.toNumber()).toBe(0.75)
    expect(parseQuantityToDecimal('2 1/4')!.toNumber()).toBe(2.25)
    expect(parseQuantityToDecimal('¾')!.toNumber()).toBe(0.75)
    expect(parseQuantityToDecimal('2¾')!.toNumber()).toBe(2.75)
  })

  it('returns null for unparseable input rather than defaulting to 0', () => {
    expect(parseQuantityToDecimal('a pinch')).toBeNull()
  })
})
