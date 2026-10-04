'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/database.types'
import { calculatorDocumentSchema, type CalculatorDocument } from '../types'

export interface ImportResult {
  ok: boolean
  importedCount: number
  error?: string
}

// Imports a guest's local document into the signed-in user's account, in
// dependency order, using the client-generated ids already on every row so
// re-running this (e.g. a retry after a dropped connection) upserts the
// same rows rather than creating duplicates.
export async function importGuestData(doc: CalculatorDocument): Promise<ImportResult> {
  const parsed = calculatorDocumentSchema.safeParse(doc)
  if (!parsed.success) return { ok: false, importedCount: 0, error: 'Local data failed validation.' }
  const data = parsed.data

  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { ok: false, importedCount: 0, error: 'Not signed in.' }
  const userId = userData.user.id

  let importedCount = 0

  try {
    // Settings: imported only if the account has none yet.
    if (data.settings) {
      const { data: existingSettings } = await supabase.from('calc_settings').select('user_id').eq('user_id', userId).maybeSingle()
      if (!existingSettings) {
        const { error } = await supabase.from('calc_settings').insert({
          user_id: userId,
          hourly_rate: data.settings.hourlyRate,
          monthly_overhead: data.settings.monthlyOverhead,
          expected_products_per_month: data.settings.expectedProductsPerMonth,
          default_margin_pct: data.settings.defaultMarginPct,
          default_fee_preset_id: data.settings.defaultFeePresetId,
          custom_fee_pct: data.settings.customFeePct,
          custom_fee_fixed: data.settings.customFeeFixed,
          price_step: data.settings.priceStep,
          currency: data.settings.currency,
          count_labor_as_cost: data.settings.countLaborAsCost,
        })
        if (error) throw error
        importedCount++
      }
    }

    // Pantry items
    if (data.pantryItems.length > 0) {
      const { error } = await supabase.from('calc_pantry_items').upsert(
        data.pantryItems.map((p) => ({
          id: p.id,
          user_id: userId,
          ingredient_id: p.ingredientId,
          name: p.name,
          kind: p.kind,
          package_qty: p.packageQty,
          package_unit: p.packageUnit,
          package_price: p.packagePrice,
          usable_yield_pct: p.usableYieldPct,
          grams_per_cup: p.gramsPerCup,
          grams_per_each: p.gramsPerEach,
          notes: p.notes,
        }))
      )
      if (error) throw error
      importedCount += data.pantryItems.length
    }

    // Recipes + lines
    if (data.recipes.length > 0) {
      const { error } = await supabase.from('calc_recipes').upsert(
        data.recipes.map((r) => ({
          id: r.id,
          user_id: userId,
          name: r.name,
          yield_qty: r.yieldQty,
          yield_unit_label: r.yieldUnitLabel,
          active_minutes: r.activeMinutes,
          batch_increment: r.batchIncrement,
          notes: r.notes,
        }))
      )
      if (error) throw error

      const allLines = data.recipes.flatMap((r) =>
        r.lines.map((l) => ({
          id: l.id,
          recipe_id: r.id,
          pantry_item_id: l.pantryItemId,
          qty: l.qty,
          unit: l.unit,
          note: l.note,
          sort_order: l.sortOrder,
        }))
      )
      if (allLines.length > 0) {
        const { error: lineError } = await supabase.from('calc_recipe_lines').upsert(allLines)
        if (lineError) throw lineError
      }
      importedCount += data.recipes.length
    }

    // Products + components + packaging
    if (data.products.length > 0) {
      const { error } = await supabase.from('calc_products').upsert(
        data.products.map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          extra_minutes: p.extraMinutes,
          target_margin_pct: p.targetMarginPct,
          fee_preset_id: p.feePresetId,
          set_price: p.setPrice,
          price_step: p.priceStep,
          count_labor_as_cost: p.countLaborAsCost,
        }))
      )
      if (error) throw error

      const allComponents = data.products.flatMap((p) =>
        p.components.map((c) => ({ id: c.id, product_id: p.id, recipe_id: c.recipeId, qty: c.qty, sort_order: c.sortOrder }))
      )
      if (allComponents.length > 0) {
        const { error: compError } = await supabase.from('calc_product_components').upsert(allComponents)
        if (compError) throw compError
      }

      const allPackaging = data.products.flatMap((p) =>
        p.packaging.map((pk) => ({ id: pk.id, product_id: p.id, pantry_item_id: pk.pantryItemId, qty: pk.qty, unit: pk.unit }))
      )
      if (allPackaging.length > 0) {
        const { error: packError } = await supabase.from('calc_product_packaging').upsert(allPackaging)
        if (packError) throw packError
      }
      importedCount += data.products.length
    }

    // Plans + orders + order lines + on-hand
    if (data.plans.length > 0) {
      const { error } = await supabase.from('calc_plans').upsert(
        data.plans.map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          sale_date: p.saleDate,
          fee_preset_id: p.feePresetId,
          frozen_at: p.frozenAt,
          frozen_snapshot: p.frozenSnapshot as Json | null,
        }))
      )
      if (error) throw error

      const allOrders = data.plans.flatMap((p) =>
        p.orders.map((o) => ({ id: o.id, plan_id: p.id, customer_label: o.customerLabel, note: o.note, sort_order: o.sortOrder }))
      )
      if (allOrders.length > 0) {
        const { error: orderError } = await supabase.from('calc_plan_orders').upsert(allOrders)
        if (orderError) throw orderError
      }

      const allOrderLines = data.plans.flatMap((p) =>
        p.orders.flatMap((o) =>
          o.lines.map((l) => ({ id: l.id, order_id: o.id, product_id: l.productId, qty: l.qty, unit_price_override: l.unitPriceOverride }))
        )
      )
      if (allOrderLines.length > 0) {
        const { error: lineError } = await supabase.from('calc_plan_order_lines').upsert(allOrderLines)
        if (lineError) throw lineError
      }

      const allOnHand = data.plans.flatMap((p) =>
        p.onHand.map((h) => ({ plan_id: p.id, pantry_item_id: h.pantryItemId, qty: h.qty, unit: h.unit, checked: h.checked }))
      )
      if (allOnHand.length > 0) {
        const { error: onHandError } = await supabase.from('calc_plan_on_hand').upsert(allOnHand, { onConflict: 'plan_id,pantry_item_id' })
        if (onHandError) throw onHandError
      }
      importedCount += data.plans.length
    }

    return { ok: true, importedCount }
  } catch (err) {
    return { ok: false, importedCount: 0, error: err instanceof Error ? err.message : 'Import failed.' }
  }
}
