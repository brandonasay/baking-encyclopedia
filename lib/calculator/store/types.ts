import type { CalculatorDocument, DeleteResult, Plan, PantryItem, Product, Recipe, Settings } from '../types'

// UI/engine code talks only to this interface — which backing store is used
// (LocalStore vs SupabaseStore) depends solely on whether a session exists.
export interface CalculatorStore {
  getSettings(): Promise<Settings | null>
  upsertSettings(settings: Settings): Promise<void>

  listPantryItems(): Promise<PantryItem[]>
  upsertPantryItem(item: PantryItem): Promise<void>
  deletePantryItem(id: string): Promise<DeleteResult>

  listRecipes(): Promise<Recipe[]>
  getRecipe(id: string): Promise<Recipe | null>
  upsertRecipe(recipe: Recipe): Promise<void>
  deleteRecipe(id: string): Promise<DeleteResult>

  listProducts(): Promise<Product[]>
  getProduct(id: string): Promise<Product | null>
  upsertProduct(product: Product): Promise<void>
  deleteProduct(id: string): Promise<DeleteResult>

  listPlans(): Promise<Plan[]>
  getPlan(id: string): Promise<Plan | null>
  upsertPlan(plan: Plan): Promise<void>
  deletePlan(id: string): Promise<DeleteResult>

  exportAll(): Promise<CalculatorDocument>
}
