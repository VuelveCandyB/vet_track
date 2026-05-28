import type { Metadata } from 'next'
import { Geist, Dela_Gothic_One } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const delaGothic = Dela_Gothic_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dela',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VetTrack — Hipódromo Camarero',
  description: 'Sistema de Medicación Equina',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${delaGothic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  )
}
