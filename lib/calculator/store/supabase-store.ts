'use client'

import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/database.types'
import type { CalculatorDocument, DeleteResult, Plan, PantryItem, Product, Recipe, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import type { CalculatorStore } from './types'

type Client = ReturnType<typeof createClient>

function uniq(ids: string[]): string[] {
  return [...new Set(ids)]
}

// ─── Row <-> domain mappers ──────────────────────────────────────────────

function settingsFromRow(row: Database['public']['Tables']['calc_settings']['Row']): Settings {
  return {
    hourlyRate: row.hourly_rate,
    monthlyOverhead: row.monthly_overhead,
    expectedProductsPerMonth: row.expected_products_per_month,
    defaultMarginPct: row.default_margin_pct,
    defaultFeePresetId: row.default_fee_preset_id,
    customFeePct: row.custom_fee_pct,
    customFeeFixed: row.custom_fee_fixed,
    priceStep: row.price_step,
    currency: row.currency,
    countLaborAsCost: row.count_labor_as_cost,
  }
}

function pantryItemFromRow(row: Database['public']['Tables']['calc_pantry_items']['Row']): PantryItem {
  return {
    id: row.id,
    ingredientId: row.ingredient_id,
    name: row.name,
    kind: row.kind,
    packageQty: row.package_qty,
    packageUnit: row.package_unit,
    packagePrice: row.package_price,
    usableYieldPct: row.usable_yield_pct,
    gramsPerCup: row.grams_per_cup,
    gramsPerEach: row.grams_per_each,
    notes: row.notes,
  }
}

function recipeFromRows(
  row: Database['public']['Tables']['calc_recipes']['Row'],
  lineRows: Database['public']['Tables']['calc_recipe_lines']['Row'][]
): Recipe {
  return {
    id: row.id,
    name: row.name,
    yieldQty: row.yield_qty,
    yieldUnitLabel: row.yield_unit_label,
    activeMinutes: row.active_minutes,
    batchIncrement: row.batch_increment,
    notes: row.notes,
    lines: lineRows
      .filter((l) => l.recipe_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({ id: l.id, pantryItemId: l.pantry_item_id, qty: l.qty, unit: l.unit, note: l.note, sortOrder: l.sort_order })),
  }
}

function productFromRows(
  row: Database['public']['Tables']['calc_products']['Row'],
  componentRows: Database['public']['Tables']['calc_product_components']['Row'][],
  packagingRows: Database['public']['Tables']['calc_product_packaging']['Row'][]
): Product {
  return {
    id: row.id,
    name: row.name,
    extraMinutes: row.extra_minutes,
    targetMarginPct: row.target_margin_pct,
    feePresetId: row.fee_preset_id,
    setPrice: row.set_price,
    priceStep: row.price_step,
    countLaborAsCost: row.count_labor_as_cost,
    components: componentRows
      .filter((c) => c.product_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => ({ id: c.id, recipeId: c.recipe_id, qty: c.qty, sortOrder: c.sort_order })),
    packaging: packagingRows
      .filter((p) => p.product_id === row.id)
      .map((p) => ({ id: p.id, pantryItemId: p.pantry_item_id, qty: p.qty, unit: p.unit })),
  }
}

function planFromRows(
  row: Database['public']['Tables']['calc_plans']['Row'],
  orderRows: Database['public']['Tables']['calc_plan_orders']['Row'][],
  orderLineRows: Database['public']['Tables']['calc_plan_order_lines']['Row'][],
  onHandRows: Database['public']['Tables']['calc_plan_on_hand']['Row'][]
): Plan {
  return {
    id: row.id,
    name: row.name,
    saleDate: row.sale_date,
    feePresetId: row.fee_preset_id,
    frozenAt: row.frozen_at,
    frozenSnapshot: row.frozen_snapshot,
    orders: orderRows
      .filter((o) => o.plan_id === row.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
        id: o.id,
        customerLabel: o.customer_label,
        note: o.note,
        sortOrder: o.sort_order,
        lines: orderLineRows
          .filter((l) => l.order_id === o.id)
          .map((l) => ({ id: l.id, productId: l.product_id, qty: l.qty, unitPriceOverride: l.unit_price_override })),
      })),
    onHand: onHandRows
      .filter((h) => h.plan_id === row.id)
      .map((h) => ({ pantryItemId: h.pantry_item_id, qty: h.qty, unit: h.unit, checked: h.checked })),
  }
}

export class SupabaseStore implements CalculatorStore {
  private client: Client
  private userId: string

  constructor(client: Client, userId: string) {
    this.client = client
    this.userId = userId
  }

  async getSettings(): Promise<Settings | null> {
    const { data } = await this.client.from('calc_settings').select('*').eq('user_id', this.userId).maybeSingle()
    return data ? settingsFromRow(data) : null
  }

  async upsertSettings(settings: Settings): Promise<void> {
    const { error } = await this.client.from('calc_settings').upsert({
      user_id: this.userId,
      hourly_rate: settings.hourlyRate,
      monthly_overhead: settings.monthlyOverhead,
      expected_products_per_month: settings.expectedProductsPerMonth,
      default_margin_pct: settings.defaultMarginPct,
      default_fee_preset_id: settings.defaultFeePresetId,
      custom_fee_pct: settings.customFeePct,
      custom_fee_fixed: settings.customFeeFixed,
      price_step: settings.priceStep,
      currency: settings.currency,
      count_labor_as_cost: settings.countLaborAsCost,
    })
    if (error) throw error
  }

  async listPantryItems(): Promise<PantryItem[]> {
    const { data, error } = await this.client.from('calc_pantry_items').select('*').order('name')
    if (error) throw error
    return (data ?? []).map(pantryItemFromRow)
  }

  async upsertPantryItem(item: PantryItem): Promise<void> {
    const { error } = await this.client.from('calc_pantry_items').upsert({
      id: item.id,
      user_id: this.userId,
      ingredient_id: item.ingredientId,
      name: item.name,
      kind: item.kind,
      package_qty: item.packageQty,
      package_unit: item.packageUnit,
      package_price: item.packagePrice,
      usable_yield_pct: item.usableYieldPct,
      grams_per_cup: item.gramsPerCup,
      grams_per_each: item.gramsPerEach,
      notes: item.notes,
    })
    if (error) throw error
  }

  async deletePantryItem(id: string): Promise<DeleteResult> {
    const blockedBy = await this.findPantryItemUsage(id)
    if (blockedBy.length > 0) return { ok: false, blockedBy }
    const { error } = await this.client.from('calc_pantry_items').delete().eq('id', id)
    if (error) return { ok: false, blockedBy: [error.message] }
    return { ok: true }
  }

  private async findPantryItemUsage(pantryItemId: string): Promise<string[]> {
    const [lines, packaging, onHand] = await Promise.all([
      this.client.from('calc_recipe_lines').select('recipe_id').eq('pantry_item_id', pantryItemId),
      this.client.from('calc_product_packaging').select('product_id').eq('pantry_item_id', pantryItemId),
      this.client.from('calc_plan_on_hand').select('plan_id').eq('pantry_item_id', pantryItemId),
    ])
    const [recipeNames, productNames, planNames] = await Promise.all([
      this.namesFor('calc_recipes', uniq((lines.data ?? []).map((r) => r.recipe_id))),
      this.namesFor('calc_products', uniq((packaging.data ?? []).map((r) => r.product_id))),
      this.namesFor('calc_plans', uniq((onHand.data ?? []).map((r) => r.plan_id))),
    ])
    return [
      ...recipeNames.map((n) => `recipe: ${n}`),
      ...productNames.map((n) => `product: ${n}`),
      ...planNames.map((n) => `plan: ${n}`),
    ]
  }

  private async namesFor(table: 'calc_recipes' | 'calc_products' | 'calc_plans', ids: string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const { data } = await this.client.from(table).select('name').in('id', ids)
    return (data ?? []).map((r) => r.name)
  }

  async listRecipes(): Promise<Recipe[]> {
    const { data: recipeRows, error } = await this.client.from('calc_recipes').select('*').order('name')
    if (error) throw error
    const ids = (recipeRows ?? []).map((r) => r.id)
    if (ids.length === 0) return []
    const { data: lineRows } = await this.client.from('calc_recipe_lines').select('*').in('recipe_id', ids)
    return (recipeRows ?? []).map((r) => recipeFromRows(r, lineRows ?? []))
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const { data: row } = await this.client.from('calc_recipes').select('*').eq('id', id).maybeSingle()
    if (!row) return null
    const { data: lineRows } = await this.client.from('calc_recipe_lines').select('*').eq('recipe_id', id)
    return recipeFromRows(row, lineRows ?? [])
  }

  async upsertRecipe(recipe: Recipe): Promise<void> {
    const { error } = await this.client.from('calc_recipes').upsert({
      id: recipe.id,
      user_id: this.userId,
      name: recipe.name,
      yield_qty: recipe.yieldQty,
      yield_unit_label: recipe.yieldUnitLabel,
      active_minutes: recipe.activeMinutes,
      batch_increment: recipe.batchIncrement,
      notes: recipe.notes,
    })
    if (error) throw error

    // Replace-all strategy for child lines — simplest correct approach at
    // this app's scale (a handful of ingredient lines per recipe).
    await this.client.from('calc_recipe_lines').delete().eq('recipe_id', recipe.id)
    if (recipe.lines.length > 0) {
      const { error: lineError } = await this.client.from('calc_recipe_lines').insert(
        recipe.lines.map((l) => ({
          id: l.id,
          recipe_id: recipe.id,
          pantry_item_id: l.pantryItemId,
          qty: l.qty,
          unit: l.unit,
          note: l.note,
          sort_order: l.sortOrder,
        }))
      )
      if (lineError) throw lineError
    }
  }

  async deleteRecipe(id: string): Promise<DeleteResult> {
    const { data } = await this.client.from('calc_product_components').select('product_id').eq('recipe_id', id)
    const productNames = await this.namesFor('calc_products', uniq((data ?? []).map((r) => r.product_id)))
    if (productNames.length > 0) return { ok: false, blockedBy: productNames.map((n) => `product: ${n}`) }
    const { error } = await this.client.from('calc_recipes').delete().eq('id', id)
    if (error) return { ok: false, blockedBy: [error.message] }
    return { ok: true }
  }

  async listProducts(): Promise<Product[]> {
    const { data: productRows, error } = await this.client.from('calc_products').select('*').order('name')
    if (error) throw error
    const ids = (productRows ?? []).map((p) => p.id)
    if (ids.length === 0) return []
    const [{ data: componentRows }, { data: packagingRows }] = await Promise.all([
      this.client.from('calc_product_components').select('*').in('product_id', ids),
      this.client.from('calc_product_packaging').select('*').in('product_id', ids),
    ])
    return (productRows ?? []).map((p) => productFromRows(p, componentRows ?? [], packagingRows ?? []))
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data: row } = await this.client.from('calc_products').select('*').eq('id', id).maybeSingle()
    if (!row) return null
    const [{ data: componentRows }, { data: packagingRows }] = await Promise.all([
      this.client.from('calc_product_components').select('*').eq('product_id', id),
      this.client.from('calc_product_packaging').select('*').eq('product_id', id),
    ])
    return productFromRows(row, componentRows ?? [], packagingRows ?? [])
  }

  async upsertProduct(product: Product): Promise<void> {
    const { error } = await this.client.from('calc_products').upsert({
      id: product.id,
      user_id: this.userId,
      name: product.name,
      extra_minutes: product.extraMinutes,
      target_margin_pct: product.targetMarginPct,
      fee_preset_id: product.feePresetId,
      set_price: product.setPrice,
      price_step: product.priceStep,
      count_labor_as_cost: product.countLaborAsCost,
    })
    if (error) throw error

    await Promise.all([
      this.client.from('calc_product_components').delete().eq('product_id', product.id),
      this.client.from('calc_product_packaging').delete().eq('product_id', product.id),
    ])
    if (product.components.length > 0) {
      const { error: compError } = await this.client.from('calc_product_components').insert(
        product.components.map((c) => ({ id: c.id, product_id: product.id, recipe_id: c.recipeId, qty: c.qty, sort_order: c.sortOrder }))
      )
      if (compError) throw compError
    }
    if (product.packaging.length > 0) {
      const { error: packError } = await this.client.from('calc_product_packaging').insert(
        product.packaging.map((p) => ({ id: p.id, product_id: product.id, pantry_item_id: p.pantryItemId, qty: p.qty, unit: p.unit }))
      )
      if (packError) throw packError
    }
  }

  async deleteProduct(id: string): Promise<DeleteResult> {
    const { data: lines } = await this.client.from('calc_plan_order_lines').select('order_id').eq('product_id', id)
    const orderIds = uniq((lines ?? []).map((l) => l.order_id))
    let planNames: string[] = []
    if (orderIds.length > 0) {
      const { data: orders } = await this.client.from('calc_plan_orders').select('plan_id').in('id', orderIds)
      planNames = await this.namesFor('calc_plans', uniq((orders ?? []).map((o) => o.plan_id)))
    }
    if (planNames.length > 0) return { ok: false, blockedBy: planNames.map((n) => `plan: ${n}`) }
    const { error } = await this.client.from('calc_products').delete().eq('id', id)
    if (error) return { ok: false, blockedBy: [error.message] }
    return { ok: true }
  }

  async listPlans(): Promise<Plan[]> {
    const { data: planRows, error } = await this.client.from('calc_plans').select('*').order('sale_date', { ascending: false })
    if (error) throw error
    const ids = (planRows ?? []).map((p) => p.id)
    if (ids.length === 0) return []
    const { data: orderRows } = await this.client.from('calc_plan_orders').select('*').in('plan_id', ids)
    const orderIds = (orderRows ?? []).map((o) => o.id)
    const [{ data: orderLineRows }, { data: onHandRows }] = await Promise.all([
      orderIds.length > 0
        ? this.client.from('calc_plan_order_lines').select('*').in('order_id', orderIds)
        : Promise.resolve({ data: [] }),
      this.client.from('calc_plan_on_hand').select('*').in('plan_id', ids),
    ])
    return (planRows ?? []).map((p) => planFromRows(p, orderRows ?? [], orderLineRows ?? [], onHandRows ?? []))
  }

  async getPlan(id: string): Promise<Plan | null> {
    const { data: row } = await this.client.from('calc_plans').select('*').eq('id', id).maybeSingle()
    if (!row) return null
    const { data: orderRows } = await this.client.from('calc_plan_orders').select('*').eq('plan_id', id)
    const orderIds = (orderRows ?? []).map((o) => o.id)
    const [{ data: orderLineRows }, { data: onHandRows }] = await Promise.all([
      orderIds.length > 0
        ? this.client.from('calc_plan_order_lines').select('*').in('order_id', orderIds)
        : Promise.resolve({ data: [] }),
      this.client.from('calc_plan_on_hand').select('*').eq('plan_id', id),
    ])
    return planFromRows(row, orderRows ?? [], orderLineRows ?? [], onHandRows ?? [])
  }

  async upsertPlan(plan: Plan): Promise<void> {
    const { error } = await this.client.from('calc_plans').upsert({
      id: plan.id,
      user_id: this.userId,
      name: plan.name,
      sale_date: plan.saleDate,
      fee_preset_id: plan.feePresetId,
      frozen_at: plan.frozenAt,
      frozen_snapshot: plan.frozenSnapshot as Database['public']['Tables']['calc_plans']['Row']['frozen_snapshot'],
    })
    if (error) throw error

    const { data: existingOrders } = await this.client.from('calc_plan_orders').select('id').eq('plan_id', plan.id)
    const existingOrderIds = (existingOrders ?? []).map((o) => o.id)
    if (existingOrderIds.length > 0) {
      await this.client.from('calc_plan_order_lines').delete().in('order_id', existingOrderIds)
    }
    await this.client.from('calc_plan_orders').delete().eq('plan_id', plan.id)
    await this.client.from('calc_plan_on_hand').delete().eq('plan_id', plan.id)

    if (plan.orders.length > 0) {
      const { error: orderError } = await this.client.from('calc_plan_orders').insert(
        plan.orders.map((o) => ({ id: o.id, plan_id: plan.id, customer_label: o.customerLabel, note: o.note, sort_order: o.sortOrder }))
      )
      if (orderError) throw orderError

      const allLines = plan.orders.flatMap((o) =>
        o.lines.map((l) => ({ id: l.id, order_id: o.id, product_id: l.productId, qty: l.qty, unit_price_override: l.unitPriceOverride }))
      )
      if (allLines.length > 0) {
        const { error: lineError } = await this.client.from('calc_plan_order_lines').insert(allLines)
        if (lineError) throw lineError
      }
    }

    if (plan.onHand.length > 0) {
      const { error: onHandError } = await this.client.from('calc_plan_on_hand').insert(
        plan.onHand.map((h) => ({ plan_id: plan.id, pantry_item_id: h.pantryItemId, qty: h.qty, unit: h.unit, checked: h.checked }))
      )
      if (onHandError) throw onHandError
    }
  }

  async deletePlan(id: string): Promise<DeleteResult> {
    const { error } = await this.client.from('calc_plans').delete().eq('id', id)
    if (error) return { ok: false, blockedBy: [error.message] }
    return { ok: true }
  }

  async exportAll(): Promise<CalculatorDocument> {
    const [settings, pantryItems, recipes, products, plans] = await Promise.all([
      this.getSettings(),
      this.listPantryItems(),
      this.listRecipes(),
      this.listProducts(),
      this.listPlans(),
    ])
    return { version: 1, settings: settings ?? DEFAULT_SETTINGS, pantryItems, recipes, products, plans }
  }
}
