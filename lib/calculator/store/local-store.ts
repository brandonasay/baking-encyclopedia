'use client'

import {
  CALCULATOR_DOC_VERSION,
  calculatorDocumentSchema,
  emptyDocument,
  type CalculatorDocument,
  type DeleteResult,
  type Plan,
  type PantryItem,
  type Product,
  type Recipe,
  type Settings,
} from '../types'
import type { CalculatorStore } from './types'

const STORAGE_KEY = 'be-calculator:v1'

function storageAvailable(): boolean {
  try {
    const testKey = '__be_calculator_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

// Module-level fallback used when localStorage is unavailable (private mode,
// blocked) so the tool still works for the current page session, in memory.
let memoryDoc: CalculatorDocument = emptyDocument()

function readDoc(): { doc: CalculatorDocument; persistent: boolean; recoveredFromBackup: boolean } {
  if (typeof window === 'undefined') return { doc: emptyDocument(), persistent: false, recoveredFromBackup: false }
  if (!storageAvailable()) return { doc: memoryDoc, persistent: false, recoveredFromBackup: false }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { doc: emptyDocument(), persistent: true, recoveredFromBackup: false }

  try {
    const parsed = JSON.parse(raw)
    if (parsed?.version !== CALCULATOR_DOC_VERSION) {
      // No prior versions exist yet to migrate from — treat an unknown
      // version as corrupt rather than guessing at a migration.
      throw new Error('unknown document version')
    }
    const result = calculatorDocumentSchema.safeParse(parsed)
    if (!result.success) throw new Error('schema validation failed')
    return { doc: result.data, persistent: true, recoveredFromBackup: false }
  } catch {
    const backupKey = `${STORAGE_KEY}:backup:${Date.now()}`
    window.localStorage.setItem(backupKey, raw)
    window.localStorage.removeItem(STORAGE_KEY)
    return { doc: emptyDocument(), persistent: true, recoveredFromBackup: true }
  }
}

function writeDoc(doc: CalculatorDocument): boolean {
  if (typeof window === 'undefined') return false
  if (!storageAvailable()) {
    memoryDoc = doc
    return false
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doc))
  return true
}

export class LocalStore implements CalculatorStore {
  async getSettings(): Promise<Settings | null> {
    return readDoc().doc.settings
  }

  async upsertSettings(settings: Settings): Promise<void> {
    const { doc } = readDoc()
    writeDoc({ ...doc, settings })
  }

  async listPantryItems(): Promise<PantryItem[]> {
    return readDoc().doc.pantryItems
  }

  async upsertPantryItem(item: PantryItem): Promise<void> {
    const { doc } = readDoc()
    const pantryItems = upsertById(doc.pantryItems, item)
    writeDoc({ ...doc, pantryItems })
  }

  async deletePantryItem(id: string): Promise<DeleteResult> {
    const { doc } = readDoc()
    const blockedBy: string[] = []
    for (const r of doc.recipes) if (r.lines.some((l) => l.pantryItemId === id)) blockedBy.push(`recipe: ${r.name}`)
    for (const p of doc.products) if (p.packaging.some((l) => l.pantryItemId === id)) blockedBy.push(`product: ${p.name}`)
    for (const pl of doc.plans) if (pl.onHand.some((o) => o.pantryItemId === id)) blockedBy.push(`plan: ${pl.name}`)
    if (blockedBy.length > 0) return { ok: false, blockedBy }
    writeDoc({ ...doc, pantryItems: doc.pantryItems.filter((p) => p.id !== id) })
    return { ok: true }
  }

  async listRecipes(): Promise<Recipe[]> {
    return readDoc().doc.recipes
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    return readDoc().doc.recipes.find((r) => r.id === id) ?? null
  }

  async upsertRecipe(recipe: Recipe): Promise<void> {
    const { doc } = readDoc()
    writeDoc({ ...doc, recipes: upsertById(doc.recipes, recipe) })
  }

  async deleteRecipe(id: string): Promise<DeleteResult> {
    const { doc } = readDoc()
    const blockedBy: string[] = []
    for (const p of doc.products) if (p.components.some((c) => c.recipeId === id)) blockedBy.push(`product: ${p.name}`)
    if (blockedBy.length > 0) return { ok: false, blockedBy }
    writeDoc({ ...doc, recipes: doc.recipes.filter((r) => r.id !== id) })
    return { ok: true }
  }

  async listProducts(): Promise<Product[]> {
    return readDoc().doc.products
  }

  async getProduct(id: string): Promise<Product | null> {
    return readDoc().doc.products.find((p) => p.id === id) ?? null
  }

  async upsertProduct(product: Product): Promise<void> {
    const { doc } = readDoc()
    writeDoc({ ...doc, products: upsertById(doc.products, product) })
  }

  async deleteProduct(id: string): Promise<DeleteResult> {
    const { doc } = readDoc()
    const blockedBy: string[] = []
    for (const pl of doc.plans) {
      for (const o of pl.orders) {
        if (o.lines.some((l) => l.productId === id)) blockedBy.push(`plan: ${pl.name}`)
      }
    }
    if (blockedBy.length > 0) return { ok: false, blockedBy }
    writeDoc({ ...doc, products: doc.products.filter((p) => p.id !== id) })
    return { ok: true }
  }

  async listPlans(): Promise<Plan[]> {
    return readDoc().doc.plans
  }

  async getPlan(id: string): Promise<Plan | null> {
    return readDoc().doc.plans.find((p) => p.id === id) ?? null
  }

  async upsertPlan(plan: Plan): Promise<void> {
    const { doc } = readDoc()
    writeDoc({ ...doc, plans: upsertById(doc.plans, plan) })
  }

  async deletePlan(id: string): Promise<DeleteResult> {
    const { doc } = readDoc()
    writeDoc({ ...doc, plans: doc.plans.filter((p) => p.id !== id) })
    return { ok: true }
  }

  async exportAll(): Promise<CalculatorDocument> {
    return readDoc().doc
  }

  // Non-interface helpers the UI banner needs.
  static status(): { persistent: boolean; recoveredFromBackup: boolean } {
    const { persistent, recoveredFromBackup } = readDoc()
    return { persistent, recoveredFromBackup }
  }

  static clear(): void {
    if (typeof window === 'undefined') return
    if (storageAvailable()) window.localStorage.removeItem(STORAGE_KEY)
    memoryDoc = emptyDocument()
  }
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id)
  if (idx === -1) return [...list, item]
  const copy = [...list]
  copy[idx] = item
  return copy
}
