import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/database.types'
import ExportMailingListButton from './ExportMailingListButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Users' }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminUsersPage() {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, role, mailing_list, created_at')
    .order('created_at', { ascending: false })

  const profiles = (data ?? []) as Pick<Profile, 'id' | 'email' | 'display_name' | 'role' | 'mailing_list' | 'created_at'>[]
  const subscriberCount = profiles.filter((p) => p.mailing_list).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#201D20]">Users</h1>
          <p className="text-sm text-[#6D5E6D] mt-0.5">
            {profiles.length} total &middot; {subscriberCount} on mailing list
          </p>
        </div>
        <ExportMailingListButton />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#EBD2AD] overflow-hidden">
        {profiles.length === 0 ? (
          <div className="py-16 text-center text-[#6D5E6D]">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EBD2AD] bg-[#FCFFEB]">
                  <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Display Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Mailing List</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#201D20]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b border-[#EBD2AD] last:border-0 hover:bg-[#FCFFEB] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#201D20]">{profile.email}</td>
                    <td className="px-4 py-3 text-[#6D5E6D]">
                      {profile.display_name ?? <span className="text-[#6D5E6D]/40 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile.role === 'admin'
                            ? 'bg-[#FBF3DC] text-[#A87225] border border-amber-200'
                            : 'bg-[#FCFFEB] text-[#6D5E6D] border border-[#EBD2AD]'
                        }`}
                      >
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {profile.mailing_list ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EEF3EA] text-[#41622D] border border-[#B5C9A8]">
                          Subscribed
                        </span>
                      ) : (
                        <span className="text-[#6D5E6D]/60 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#6D5E6D] whitespace-nowrap">
                      {formatDate(profile.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
