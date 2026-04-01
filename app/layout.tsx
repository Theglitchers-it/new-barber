import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "500", "600", "700", "800"] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: {
    default: 'SalonPro - Il Salone che ti Capisce',
    template: '%s | SalonPro',
  },
  description: 'Prenota il tuo appuntamento in 10 secondi. Scegli il tuo esperto preferito, esplora lo shop e goditi il risultato. SalonPro: prenotazioni, fedeltà e shop in un unica app.',
  keywords: ['parrucchiere', 'salone bellezza', 'prenotazione online', 'taglio capelli', 'colore capelli', 'trattamenti capelli'],
  authors: [{ name: 'SalonPro' }],
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    siteName: 'SalonPro',
    title: 'SalonPro - Il Salone che ti Capisce',
    description: 'Prenota il tuo appuntamento in 10 secondi. Scegli il tuo esperto preferito e goditi il risultato.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SalonPro - Il Salone che ti Capisce',
    description: 'Prenota il tuo appuntamento in 10 secondi.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SalonPro',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { getServerLocale } = await import("@/lib/i18n/server")
  const locale = await getServerLocale()

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${geist.variable} ${geistMono.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <Providers locale={locale}>
          {children}
        </Providers>
        <Analytics />
        <script src="/register-sw.js" defer />
      </body>
    </html>
  )
}
