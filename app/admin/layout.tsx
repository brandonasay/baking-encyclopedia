import AdminSidebar from '@/components/admin/AdminSidebar'

export const metadata = {
  title: { default: 'Admin', template: '%s | Admin — Baking Encyclopedia' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile top-bar spacer */}
        <div className="lg:hidden h-14" aria-hidden="true" />
        <main className="flex-1 bg-[#FAF8F4] p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
