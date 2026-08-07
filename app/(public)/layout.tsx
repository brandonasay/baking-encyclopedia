import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PageViewTracker from '@/components/PageViewTracker'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageViewTracker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
