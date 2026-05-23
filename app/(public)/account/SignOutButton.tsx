'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#EBD2AD] hover:border-red-300 hover:text-red-600 text-[#6D5E6D] text-sm font-medium transition-colors duration-150 shrink-0"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
