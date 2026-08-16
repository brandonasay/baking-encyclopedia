import Link from 'next/link'
import type { RecipeIngredient } from '@/lib/database.types'
import { formatIngredientQuantity, type UnitSystem } from '@/lib/quantity'

export function IngredientsList({
  ingredients,
  scale = 1,
  unitSystem = 'us',
  checked,
  onToggle,
  ingredientLinks = {},
}: {
  ingredients: RecipeIngredient[]
  scale?: number
  unitSystem?: UnitSystem
  checked: Set<number>
  onToggle: (index: number) => void
  ingredientLinks?: Record<string, string>
}) {
  // Group by group_label, keeping each item's index into the original
  // (flat, unscaled) array so checked state stays stable across grouping.
  const groups: { label: string | null; items: { ing: RecipeIngredient; index: number }[] }[] = []
  ingredients.forEach((ing, index) => {
    const label = ing.group_label ?? null
    const existing = groups.find((g) => g.label === label)
    if (existing) {
      existing.items.push({ ing, index })
    } else {
      groups.push({ label, items: [{ ing, index }] })
    }
  })

  return (
    <div className="space-y-5">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6D5E6D] mb-3">
              {group.label}
            </h3>
          )}
          <ul className="space-y-2.5">
            {group.items.map(({ ing, index }) => {
              const isChecked = checked.has(index)
              const slug = ing.ingredient_id ? ingredientLinks[ing.ingredient_id] : undefined
              const nameNode = slug ? (
                <Link
                  href={`/ingredients/${slug}`}
                  className="underline decoration-[#C58930]/40 underline-offset-2 hover:decoration-[#C58930] transition-colors"
                >
                  {ing.ingredient_name}
                </Link>
              ) : (
                ing.ingredient_name
              )
              return (
                <li key={index} className="flex items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    id={`ingredient-${index}`}
                    checked={isChecked}
                    onChange={() => onToggle(index)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-[#C58930] cursor-pointer"
                  />
                  <label
                    htmlFor={`ingredient-${index}`}
                    className={`cursor-pointer ${isChecked ? 'text-[#B8AEB0] line-through' : ''}`}
                  >
                    {isChecked ? (
                      <span>
                        {formatIngredientQuantity(ing, scale, unitSystem)} {nameNode}
                        {ing.notes && `, ${ing.notes}`}
                      </span>
                    ) : (
                      <span>
                        <span className="font-medium text-[#201D20]">
                          {formatIngredientQuantity(ing, scale, unitSystem)}
                        </span>{' '}
                        <span className="text-[#201D20]">{nameNode}</span>
                        {ing.notes && <span className="text-[#6D5E6D]">, {ing.notes}</span>}
                      </span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
