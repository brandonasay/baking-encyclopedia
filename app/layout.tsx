import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: { default: 'Baking Encyclopedia', template: '%s | Baking Encyclopedia' },
  description: 'The complete reference for bakers — recipes, ingredients, and how-to guides.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bakingencyclopedia.com'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
