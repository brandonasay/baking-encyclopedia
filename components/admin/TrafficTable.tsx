'use client'

import { useMemo, useState } from 'react'
import type { PageViewPath } from '@/lib/database.types'

type SortKey = 'path' | 'views_today' | 'views_7d' | 'views_30d' | 'views_total'

const columns: { key: SortKey; label: string }[] = [
  { key: 'path', label: 'Page' },
  { key: 'views_today', label: 'Today' },
  { key: 'views_7d', label: '7 Days' },
  { key: 'views_30d', label: '30 Days' },
  { key: 'views_total', label: 'Total' },
]

export default function TrafficTable({ data }: { data: PageViewPath[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('views_30d')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sorted = useMemo(() => {
    const copy = [...data]
    copy.sort((a, b) => {
      if (sortKey === 'path') {
        return sortDir === 'asc' ? a.path.localeCompare(b.path) : b.path.localeCompare(a.path)
      }
      const diff = a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? diff : -diff
    })
    return copy
  }, [data, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'path' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#EBD2AD] overflow-hidden">
      {data.length === 0 ? (
        <div className="py-16 text-center text-[#6D5E6D]">
          <p>No traffic data yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EBD2AD] bg-[#FCFFEB]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-3 font-medium text-[#6D5E6D] cursor-pointer select-none hover:text-[#C58930] transition-colors ${col.key === 'path' ? 'text-left' : 'text-right'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && <span className="text-[#C58930]">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBD2AD]">
              {sorted.map((row) => (
                <tr key={row.path} className="hover:bg-[#FCFFEB] transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[#201D20] max-w-xs truncate">{row.path}</td>
                  <td className="px-4 py-2.5 text-right text-[#201D20]">{row.views_today.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-[#201D20]">{row.views_7d.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-[#201D20]">{row.views_30d.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[#201D20]">{row.views_total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
