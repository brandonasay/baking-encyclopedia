import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Profile } from '@/lib/database.types'
import ExportMailingListButton from './ExportMailingListButton'

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
          <h1 className="text-2xl font-bold text-[#1C1410]">Users</h1>
          <p className="text-sm text-[#7A6A5E] mt-0.5">
            {profiles.length} total &middot; {subscriberCount} on mailing list
          </p>
        </div>
        <ExportMailingListButton />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
        {profiles.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A5E]">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D5] bg-[#FAF8F4]">
                  <th className="text-left px-4 py-3 font-semibold text-[#1C1410]">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1C1410]">Display Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1C1410]">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1C1410]">Mailing List</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#1C1410]">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b border-[#E8E0D5] last:border-0 hover:bg-[#FAF8F4] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#1C1410]">{profile.email}</td>
                    <td className="px-4 py-3 text-[#7A6A5E]">
                      {profile.display_name ?? <span className="text-[#7A6A5E]/40 italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          profile.role === 'admin'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-[#FAF8F4] text-[#7A6A5E] border border-[#E8E0D5]'
                        }`}
                      >
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {profile.mailing_list ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Subscribed
                        </span>
                      ) : (
                        <span className="text-[#7A6A5E]/60 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#7A6A5E] whitespace-nowrap">
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
