import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Collection, Recipe } from '@/lib/database.types'
import RecipeCard from '@/components/recipes/RecipeCard'
import CollectionDetailManager from './CollectionDetailManager'
import RemoveFromCollectionButton from './RemoveFromCollectionButton'
import { BookOpen, Globe, Lock, ArrowLeft, Link as LinkIcon } from 'lucide-react'

type CollectionItem = {
  id: string
  sort_order: number
  recipes: Pick<
    Recipe,
    'id' | 'slug' | 'title' | 'headline' | 'image_url' | 'difficulty' | 'total_time_minutes' | 'tags' | 'has_gluten_free' | 'has_high_protein'
  > | null
}

type CollectionWithItems = Collection & {
  collection_items: CollectionItem[]
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('collections')
    .select('*, collection_items(id, sort_order, recipes(id,slug,title,headline,image_url,difficulty,total_time_minutes,tags,has_gluten_free,has_high_protein))')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!data) redirect('/account/collections')

  const collection = data as unknown as CollectionWithItems
  const items = collection.collection_items
    .filter((i) => i.recipes !== null)
    .sort((a, b) => a.sort_order - b.sort_order)

  const publicUrl = collection.is_public && collection.public_slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/collections/${collection.public_slug}`
    : null

  return (
    <div className="bg-[#FAF8F4] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Back link */}
        <Link
          href="/account/collections"
          className="inline-flex items-center gap-1.5 text-sm text-[#7A6A5E] hover:text-[#C8652A] mb-6 transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          All Collections
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F5EDE4] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-[#C8652A]" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-[#1C1410]"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {collection.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    collection.is_public
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#FAF8F4] text-[#7A6A5E] border border-[#E8E0D5]'
                  }`}
                >
                  {collection.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {collection.is_public ? 'Public' : 'Private'}
                </span>
                <span className="text-xs text-[#7A6A5E]">
                  {items.length} {items.length === 1 ? 'recipe' : 'recipes'}
                </span>
              </div>
            </div>
          </div>

          {/* Public share link */}
          {publicUrl && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[#E8E0D5] text-sm">
              <LinkIcon className="w-4 h-4 text-[#C8652A] shrink-0" />
              <span className="text-[#7A6A5E] truncate max-w-[220px]">{publicUrl}</span>
              <button
                onClick={() => navigator.clipboard.writeText(publicUrl)}
                className="text-[#C8652A] hover:underline whitespace-nowrap text-xs font-medium"
              >
                Copy
              </button>
            </div>
          )}
        </div>

        {/* Client-managed detail (toggle public, remove recipes) */}
        <CollectionDetailManager collectionId={id} isPublic={collection.is_public} />

        {/* Recipes grid */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <BookOpen className="w-14 h-14 text-[#E8E0D5]" />
            <h2
              className="text-xl font-bold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              This collection is empty
            </h2>
            <p className="text-[#7A6A5E] max-w-sm text-sm">
              Browse recipes and add them to this collection.
            </p>
            <Link
              href="/recipes"
              className="mt-2 px-6 py-2.5 rounded-lg bg-[#C8652A] hover:bg-[#b55a25] text-white font-medium text-sm transition-colors duration-150"
            >
              Browse Recipes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const recipe = item.recipes!
              return (
                <div key={item.id} className="relative">
                  <RecipeCard recipe={recipe} />
                  <RemoveFromCollectionButton
                    collectionId={id}
                    itemId={item.id}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

