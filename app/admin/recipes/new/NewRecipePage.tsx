'use client'

import { useState } from 'react'
import RecipeGenerator from '@/components/admin/RecipeGenerator'
import RecipeImporter, { type ImportedRecipeData } from '@/components/admin/RecipeImporter'
import RecipeForm from '@/components/admin/RecipeForm'
import type { RecipeCategory, RecipeSubcategory } from '@/lib/database.types'

interface Props {
  categories: RecipeCategory[]
  subcategories: RecipeSubcategory[]
}

export default function NewRecipePage({ categories, subcategories }: Props) {
  const [importedData, setImportedData] = useState<ImportedRecipeData | undefined>()
  const [version, setVersion] = useState(0)

  function handleData(data: ImportedRecipeData) {
    setImportedData(data)
    setVersion((v) => v + 1)
  }

  return (
    <>
      <RecipeGenerator onGenerate={handleData} />
      <RecipeImporter onImport={handleData} />
      <RecipeForm
        key={version}
        categories={categories}
        subcategories={subcategories}
        initialValues={importedData}
      />
    </>
  )
}
