import { z } from 'zod'
import { UNIT_CODES } from './units'

export const unitCodeSchema = z.enum(UNIT_CODES)

export const pantryItemInputSchema = z.object({
  id: z.string(),
  packageQty: z.number().gt(0),
  packageUnit: unitCodeSchema,
  packagePrice: z.number().nonnegative(),
  usableYieldPct: z.number().gt(0).max(100).default(100),
  gramsPerCup: z.number().positive().nullable().optional(),
  gramsPerEach: z.number().positive().nullable().optional(),
})
export type PantryItemInputSchema = z.infer<typeof pantryItemInputSchema>

export const recipeLineInputSchema = z.object({
  id: z.string(),
  pantryItemId: z.string(),
  qty: z.number().gt(0),
  unit: unitCodeSchema,
})

export const recipeInputSchema = z.object({
  id: z.string(),
  yieldQty: z.number().gt(0),
  activeMinutes: z.number().nonnegative(),
  batchIncrement: z.number().gt(0).default(1),
  lines: z.array(recipeLineInputSchema),
})
export type RecipeInputSchema = z.infer<typeof recipeInputSchema>

export const settingsInputSchema = z.object({
  hourlyRate: z.number().nonnegative(),
  monthlyOverhead: z.number().nonnegative(),
  expectedProductsPerMonth: z.number().nonnegative(),
  defaultMarginPct: z.number().min(0).max(90),
  priceStep: z.number().gt(0).default(0.5),
  // Hobby-seller toggle (not in the original PRD spec — added at Brandon's
  // request): when false, labor is excluded from the cost basis entirely.
  countLaborAsCost: z.boolean().default(true),
})
export type SettingsInputSchema = z.infer<typeof settingsInputSchema>

export const feePresetInputSchema = z.object({
  feePct: z.number().min(0).max(1),
  feeFixed: z.number().nonnegative(),
})
export type FeePresetInputSchema = z.infer<typeof feePresetInputSchema>

export const productComponentInputSchema = z.object({
  recipeId: z.string(),
  qty: z.number().gt(0),
})

export const productPackagingLineInputSchema = z.object({
  id: z.string(),
  pantryItemId: z.string(),
  qty: z.number().gt(0),
  unit: unitCodeSchema,
})

export const productInputSchema = z.object({
  id: z.string(),
  components: z.array(productComponentInputSchema),
  packaging: z.array(productPackagingLineInputSchema),
  extraMinutes: z.number().nonnegative().default(0),
  targetMarginPct: z.number().min(0).max(90).nullable().optional(),
  priceStep: z.number().gt(0).nullable().optional(),
  // null = inherit settings.countLaborAsCost
  countLaborAsCost: z.boolean().nullable().optional(),
})
export type ProductInputSchema = z.infer<typeof productInputSchema>
