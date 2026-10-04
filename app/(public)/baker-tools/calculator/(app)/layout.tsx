import type { Metadata } from 'next'
import CalculatorShell from '@/components/baker-tools/calculator/CalculatorShell'

export const metadata: Metadata = {
  title: { default: 'Home Bakery Calculator', template: '%s | Home Bakery Calculator' },
  robots: { index: false, follow: true },
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <CalculatorShell>{children}</CalculatorShell>
}
