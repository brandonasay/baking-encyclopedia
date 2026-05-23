import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecipeCard from '@/components/recipes/RecipeCard'
import type { Recipe } from '@/lib/database.types'
import UnsaveButton from './UnsaveButton'
import { Bookmark } from 'lucide-react'

type SavedRow = {
  saved_at: string
  recipes: Pick<
    Recipe,
    'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'
  > | null
}

export default async function SavedRecipesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('saved_recipes')
    .select('saved_at, recipes(id,slug,title,headline,image_url,difficulty,total_time_minutes,tags,has_gluten_free,has_high_protein)')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const saved = (data ?? []) as unknown as SavedRow[]
  const validSaved = saved.filter((s) => s.recipes !== null)

  return (
    <div className="bg-[#FAF8F4] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#F5EDE4] flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-[#C8652A]" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Saved Recipes
            </h1>
            <p className="text-sm text-[#7A6A5E]">
              {validSaved.length} {validSaved.length === 1 ? 'recipe' : 'recipes'} saved
            </p>
          </div>
        </div>

        {/* Empty state */}
        {validSaved.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Bookmark className="w-14 h-14 text-[#E8E0D5]" />
            <h2
              className="text-xl font-bold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              No saved recipes yet
            </h2>
            <p className="text-[#7A6A5E] max-w-sm">
              When you save a recipe you&apos;ll find it here for quick access.
            </p>
            <Link
              href="/recipes"
              className="mt-2 px-6 py-2.5 rounded-lg bg-[#C8652A] hover:bg-[#b55a25] text-white font-medium text-sm transition-colors duration-150"
            >
              Browse Recipes
            </Link>
          </div>
        )}

        {/* Grid */}
        {validSaved.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {validSaved.map((row) => {
              const recipe = row.recipes!
              return (
                <div key={recipe.id} className="relative">
                  <RecipeCard recipe={recipe} />
                  <div className="absolute top-3 right-3 z-10">
                    <UnsaveButton recipeId={recipe.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
