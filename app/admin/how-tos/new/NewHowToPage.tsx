'use client'

import { useState } from 'react'
import HowToGenerator, { type GeneratedHowToData } from '@/components/admin/HowToGenerator'
import HowToForm from '@/components/admin/HowToForm'

export default function NewHowToPage() {
  const [generatedData, setGeneratedData] = useState<GeneratedHowToData | undefined>()

  return (
    <>
      <HowToGenerator onGenerate={setGeneratedData} />
      <HowToForm key={generatedData?.title ?? 'empty'} initialValues={generatedData} />
    </>
  )
}
