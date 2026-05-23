'use client'

import { useState } from 'react'
import RecipeImporter, { type ImportedRecipeData } from '@/components/admin/RecipeImporter'
import RecipeForm from '@/components/admin/RecipeForm'
import type { RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

interface Props {
  categories: RecipeCategory[]
  subcategories: RecipeSubcategory[]
}

export default function NewRecipePage({ categories, subcategories }: Props) {
  const [importedData, setImportedData] = useState<ImportedRecipeData | undefined>()

  return (
    <>
      <RecipeImporter onImport={setImportedData} />
      <RecipeForm
        key={importedData?.title ?? 'empty'}
        categories={categories}
        subcategories={subcategories}
        initialValues={importedData}
      />
    </>
  )
}
