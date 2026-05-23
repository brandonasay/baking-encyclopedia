import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { GroceryList, GroceryListCheck, RecipeIngredient } from '@/lib/database.types'

export const revalidate = 0
import { ShoppingCart } from 'lucide-react'
import GroceryListView from './GroceryListView'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type GroceryListItem = {
  id: string
  grocery_list_id: string
  recipe_id: string
  scale_factor: number
  added_at: string
  recipes: {
    title: string
    slug: string
    ingredients: RecipeIngredient[]
  } | null
}

export type GroceryListFull = GroceryList & {
  grocery_list_items: GroceryListItem[]
  grocery_list_checks: GroceryListCheck[]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function GroceryListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('grocery_lists')
    .select('*, grocery_list_items(*, recipes(title, ingredients, slug)), grocery_list_checks(*)')
    .eq('user_id', user.id)
    .single()

  const groceryList = data as GroceryListFull | null

  return (
    <div className="bg-[#FCFFEB] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#F5EAC8] flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-[#C58930]" />
          </div>
          <h1
            className="text-3xl font-bold text-[#201D20]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Grocery List
          </h1>
        </div>

        {/* Empty state */}
        {!groceryList || groceryList.grocery_list_items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <ShoppingCart className="w-14 h-14 text-[#EBD2AD]" />
            <h2
              className="text-xl font-bold text-[#201D20]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Your grocery list is empty
            </h2>
            <p className="text-[#6D5E6D] max-w-sm text-sm">
              Add recipes to your grocery list and all the ingredients will appear here.
            </p>
            <Link
              href="/recipes"
              className="mt-2 px-6 py-2.5 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium text-sm transition-colors duration-150"
            >
              Browse Recipes
            </Link>
          </div>
        ) : (
          <GroceryListView groceryList={groceryList} />
        )}
      </div>
    </div>
  )
}
