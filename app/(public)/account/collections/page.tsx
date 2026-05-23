import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Collection } from '@/lib/database.types'
import { BookOpen } from 'lucide-react'
import CollectionsManager from './CollectionsManager'

type CollectionWithCount = Collection & {
  collection_items: { count: number }[]
}

export default async function CollectionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const collections = (data ?? []) as unknown as CollectionWithCount[]

  return (
    <div className="bg-[#FAF8F4] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#F5EDE4] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#C8652A]" />
          </div>
          <div>
            <h1
              className="text-3xl font-bold text-[#1C1410]"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              My Collections
            </h1>
            <p className="text-sm text-[#7A6A5E]">
              {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
            </p>
          </div>
        </div>

        <CollectionsManager collections={collections} />
      </div>
    </div>
  )
}
