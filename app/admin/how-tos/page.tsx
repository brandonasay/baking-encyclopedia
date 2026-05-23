import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { HowToArticle } from '@/lib/database.types'
import DeleteButton from '../recipes/DeleteButton'

export const metadata = { title: 'How-Tos' }

type ArticleRow = Pick<HowToArticle, 'id' | 'title' | 'slug' | 'section' | 'published' | 'featured' | 'created_at'>

export default async function AdminHowTosPage() {
  const { data } = await supabaseAdmin
    .from('howto_articles')
    .select('id, title, slug, section, published, featured, created_at')
    .order('created_at', { ascending: false })

  const articles = (data ?? []) as ArticleRow[]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1410]">How-Tos</h1>
          <p className="text-sm text-[#7A6A5E] mt-0.5">{articles.length} total</p>
        </div>
        <Link
          href="/admin/how-tos/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#C8652A] text-white rounded-lg font-medium text-sm hover:bg-[#B55A24] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New How-To
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E8E0D5] overflow-hidden">
        {articles.length === 0 ? (
          <div className="py-16 text-center text-[#7A6A5E]">
            <p>No how-to articles yet.</p>
            <Link href="/admin/how-tos/new" className="text-[#C8652A] hover:underline mt-2 inline-block text-sm">Write your first article</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E0D5] bg-[#FAF8F4]">
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden sm:table-cell">Section</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E]">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-[#7A6A5E] hidden md:table-cell">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-[#FAF8F4] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <Link href={`/admin/how-tos/${article.id}`} className="font-medium text-[#1C1410] hover:text-[#C8652A]">
                          {article.title}
                        </Link>
                        {article.featured && (
                          <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#F5EDE4] text-[#C8652A] rounded font-medium">Featured</span>
                        )}
                        <p className="text-xs text-[#7A6A5E] font-mono">{article.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="capitalize text-[#7A6A5E]">{article.section}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${article.published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {article.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#7A6A5E] hidden md:table-cell">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/how-tos/${article.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-[#1C1410] border border-[#E8E0D5] rounded-lg hover:border-[#C8652A] hover:text-[#C8652A] transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteButton id={article.id} label={article.title} type="how-tos" />
                      </div>
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
