import Link from 'next/link'
import Image from 'next/image'
import type { Ingredient } from '@/lib/database.types'

type IngredientCardProps = {
  ingredient: Pick<Ingredient, 'slug' | 'name' | 'category' | 'headline' | 'image_url'>
}

export default function IngredientCard({ ingredient }: IngredientCardProps) {
  return (
    <Link
      href={`/ingredients/${ingredient.slug}`}
      className="group block h-full"
      aria-label={ingredient.name}
    >
      <article className="bg-white rounded-xl overflow-hidden border border-[#E8E0D5] h-full flex flex-col transition-shadow duration-200 hover:shadow-lg hover:shadow-[#C8652A]/10">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {ingredient.image_url ? (
            <Image
              src={ingredient.image_url}
              alt={ingredient.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5EDE4] to-[#E8D5C4] flex items-end p-4">
              <span
                className="text-[#7A6A5E] text-sm leading-snug line-clamp-3"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                {ingredient.name}
              </span>
            </div>
          )}

          {/* Category pill */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5EDE4] text-[#C8652A]">
              {ingredient.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-2">
          <h3
            className="text-lg leading-snug text-[#1C1410] line-clamp-2 group-hover:text-[#C8652A] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            {ingredient.name}
          </h3>

          {ingredient.headline && (
            <p className="text-sm text-[#7A6A5E] line-clamp-2 leading-relaxed flex-1">
              {ingredient.headline}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}
