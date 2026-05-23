import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/database.types'

export const revalidate = 0
import Link from 'next/link'
import AccountSettingsForm from './AccountSettingsForm'
import SignOutButton from './SignOutButton'
import { BookOpen, Bookmark, ShoppingCart, ChevronRight, User } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function AvatarInitial({ profile }: { profile: Profile }) {
  const initial = (profile.display_name ?? profile.email ?? '?')[0].toUpperCase()
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={profile.display_name ?? profile.email}
        className="w-20 h-20 rounded-full object-cover border-4 border-[#EBD2AD]"
      />
    )
  }
  return (
    <div className="w-20 h-20 rounded-full bg-[#C58930] flex items-center justify-center border-4 border-[#EBD2AD]">
      <span className="text-white text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
        {initial}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <User className="w-12 h-12 text-[#6D5E6D]" />
        <h1
          className="text-2xl font-bold text-[#201D20]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Please sign in
        </h1>
        <p className="text-[#6D5E6D]">You need to be signed in to view your account.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-lg bg-[#C58930] hover:bg-[#a87225] text-white font-medium transition-colors duration-150"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const [profileResult, savedCountResult, collectionsCountResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('saved_recipes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('collections').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const profile = profileResult.data as Profile | null
  const savedCount = savedCountResult.count ?? 0
  const collectionsCount = collectionsCountResult.count ?? 0

  const quickLinks = [
    { href: '/account/saved', icon: Bookmark, label: 'Saved Recipes', count: savedCount },
    { href: '/account/collections', icon: BookOpen, label: 'My Collections', count: collectionsCount },
    { href: '/account/grocery-list', icon: ShoppingCart, label: 'Grocery List', count: null },
  ]

  return (
    <div className="bg-[#FCFFEB] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <h1
          className="text-3xl font-bold text-[#201D20] mb-8"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          My Account
        </h1>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[#EBD2AD] p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
          {profile && <AvatarInitial profile={profile} />}
          <div className="flex-1 min-w-0">
            <p
              className="text-xl font-bold text-[#201D20] truncate"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              {profile?.display_name ?? 'Baker'}
            </p>
            <p className="text-sm text-[#6D5E6D] truncate">{profile?.email ?? user.email}</p>
            <p className="text-xs text-[#6D5E6D] mt-1">
              Member since {profile ? formatDate(profile.created_at) : '—'}
            </p>
          </div>
          <SignOutButton />
        </div>

        {/* Stats / quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {quickLinks.map(({ href, icon: Icon, label, count }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl border border-[#EBD2AD] p-5 flex items-center justify-between hover:border-[#C58930] hover:shadow-sm transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F5EAC8] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#C58930]" />
                </div>
                <div>
                  <p className="text-xs text-[#6D5E6D]">{label}</p>
                  {count !== null && (
                    <p className="text-lg font-bold text-[#201D20]">{count}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6D5E6D] group-hover:text-[#C58930] transition-colors duration-150" />
            </Link>
          ))}
        </div>

        {/* Mailing list status */}
        {profile && (
          <div className="bg-white rounded-xl border border-[#EBD2AD] p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#201D20]">Newsletter</p>
              <p className="text-xs text-[#6D5E6D]">
                {profile.mailing_list ? 'You are subscribed to our newsletter.' : 'You are not subscribed.'}
              </p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                profile.mailing_list
                  ? 'bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]'
                  : 'bg-[#FCFFEB] text-[#6D5E6D] border border-[#EBD2AD]'
              }`}
            >
              {profile.mailing_list ? 'Subscribed' : 'Not subscribed'}
            </span>
          </div>
        )}

        {/* Settings form */}
        {profile && (
          <div className="bg-white rounded-2xl border border-[#EBD2AD] p-6">
            <h2
              className="text-lg font-bold text-[#201D20] mb-5"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Account Settings
            </h2>
            <AccountSettingsForm profile={profile} />
          </div>
        )}
      </div>
    </div>
  )
}
