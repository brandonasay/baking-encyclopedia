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
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8E0D5] hover:border-red-300 hover:text-red-600 text-[#7A6A5E] text-sm font-medium transition-colors duration-150 shrink-0"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
