import { z } from 'zod'
import { unitCodeSchema } from './schemas'

export const pantryKindSchema = z.enum(['ingredient', 'packaging', 'other'])
export type PantryKind = z.infer<typeof pantryKindSchema>

export const pantryItemSchema = z.object({
  id: z.string(),
  ingredientId: z.string().nullable(),
  name: z.string().min(1),
  kind: pantryKindSchema,
  packageQty: z.number().gt(0),
  packageUnit: unitCodeSchema,
  packagePrice: z.number().nonnegative(),
  usableYieldPct: z.number().gt(0).max(100),
  gramsPerCup: z.number().positive().nullable(),
  gramsPerEach: z.number().positive().nullable(),
  notes: z.string().nullable(),
})
export type PantryItem = z.infer<typeof pantryItemSchema>

export const recipeLineSchema = z.object({
  id: z.string(),
  pantryItemId: z.string(),
  qty: z.number().gt(0),
  unit: unitCodeSchema,
  note: z.string().nullable(),
  sortOrder: z.number().int(),
})
export type RecipeLine = z.infer<typeof recipeLineSchema>

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  yieldQty: z.number().gt(0),
  yieldUnitLabel: z.string().min(1),
  activeMinutes: z.number().nonnegative(),
  batchIncrement: z.number().gt(0),
  notes: z.string().nullable(),
  lines: z.array(recipeLineSchema),
})
export type Recipe = z.infer<typeof recipeSchema>

export const productComponentSchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  qty: z.number().gt(0),
  sortOrder: z.number().int(),
})
export type ProductComponent = z.infer<typeof productComponentSchema>

export const productPackagingLineSchema = z.object({
  id: z.string(),
  pantryItemId: z.string(),
  qty: z.number().gt(0),
  unit: unitCodeSchema,
})
export type ProductPackagingLine = z.infer<typeof productPackagingLineSchema>

export const productSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  extraMinutes: z.number().nonnegative(),
  targetMarginPct: z.number().min(0).max(0.9).nullable(),
  feePresetId: z.string().nullable(),
  setPrice: z.number().nonnegative().nullable(),
  priceStep: z.number().gt(0).nullable(),
  countLaborAsCost: z.boolean().nullable(),
  components: z.array(productComponentSchema),
  packaging: z.array(productPackagingLineSchema),
})
export type Product = z.infer<typeof productSchema>

export const planOrderLineSchema = z.object({
  id: z.string(),
  productId: z.string(),
  qty: z.number().gt(0),
  unitPriceOverride: z.number().nonnegative().nullable(),
})
export type PlanOrderLine = z.infer<typeof planOrderLineSchema>

export const planOrderSchema = z.object({
  id: z.string(),
  customerLabel: z.string().nullable(),
  note: z.string().nullable(),
  sortOrder: z.number().int(),
  lines: z.array(planOrderLineSchema),
})
export type PlanOrder = z.infer<typeof planOrderSchema>

export const planOnHandSchema = z.object({
  pantryItemId: z.string(),
  qty: z.number().nonnegative(),
  unit: unitCodeSchema,
  checked: z.boolean(),
})
export type PlanOnHand = z.infer<typeof planOnHandSchema>

export const planSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  saleDate: z.string().nullable(),
  feePresetId: z.string().nullable(),
  frozenAt: z.string().nullable(),
  frozenSnapshot: z.unknown().nullable(),
  orders: z.array(planOrderSchema),
  onHand: z.array(planOnHandSchema),
})
export type Plan = z.infer<typeof planSchema>

export const settingsSchema = z.object({
  hourlyRate: z.number().nonnegative(),
  monthlyOverhead: z.number().nonnegative(),
  expectedProductsPerMonth: z.number().nonnegative(),
  defaultMarginPct: z.number().min(0).max(0.9),
  defaultFeePresetId: z.string().nullable(),
  customFeePct: z.number().min(0).max(1).nullable(),
  customFeeFixed: z.number().nonnegative().nullable(),
  priceStep: z.number().gt(0),
  currency: z.string(),
  countLaborAsCost: z.boolean(),
})
export type Settings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 15,
  monthlyOverhead: 0,
  expectedProductsPerMonth: 0,
  defaultMarginPct: 0.3,
  defaultFeePresetId: null,
  customFeePct: null,
  customFeeFixed: null,
  priceStep: 0.5,
  currency: 'USD',
  countLaborAsCost: true,
}

export const CALCULATOR_DOC_VERSION = 1

export const calculatorDocumentSchema = z.object({
  version: z.literal(CALCULATOR_DOC_VERSION),
  settings: settingsSchema.nullable(),
  pantryItems: z.array(pantryItemSchema),
  recipes: z.array(recipeSchema),
  products: z.array(productSchema),
  plans: z.array(planSchema),
})
export type CalculatorDocument = z.infer<typeof calculatorDocumentSchema>

export function emptyDocument(): CalculatorDocument {
  return { version: CALCULATOR_DOC_VERSION, settings: null, pantryItems: [], recipes: [], products: [], plans: [] }
}

export interface FeePreset {
  id: string
  name: string
  feePct: number
  feeFixed: number
  sortOrder: number
}

export type DeleteResult = { ok: true } | { ok: false; blockedBy: string[] }
