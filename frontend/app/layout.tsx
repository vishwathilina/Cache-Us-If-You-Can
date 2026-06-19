import type { Metadata } from 'next'
import { Bai_Jamjuree, Inter } from 'next/font/google'
import { Auth0Provider } from '@auth0/nextjs-auth0/client'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const bai = Bai_Jamjuree({
  variable: '--font-bai',
  weight: ['200', '300', '400', '500', '600', '700'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nova Bank – Smart Banking',
  description: 'Secure, modern banking with Nova Bank',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  )
}
