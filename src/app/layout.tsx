import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import SocialFooter from '@/components/SocialFooter'

export const metadata: Metadata = {
  title: 'Landing Page Report | lansky.tech',
  description: 'Analyze your landing page against best-practice criteria and get actionable insights to boost conversions. Free comprehensive analysis covering speed, design, CTAs, and more.',
  openGraph: {
    title: 'Landing Page Report | lansky.tech',
    description: 'Analyze your landing page against best-practice criteria and get actionable insights to boost conversions. Free comprehensive analysis covering speed, design, CTAs, and more.',
    url: 'https://landingpage.report',
    siteName: 'Landing Page Report',
    images: [
      {
        url: 'https://dqyensy76zvxvjzs.public.blob.vercel-storage.com/screenshot-aHR0cHM6Ly-2025-06-04T13-30-36-766Z.png',
        width: 1200,
        height: 630,
        alt: 'Landing Page Report - Analyze your landing page performance',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Landing Page Report | lansky.tech',
    description: 'Analyze your landing page against best-practice criteria and get actionable insights to boost conversions.',
    images: ['https://dqyensy76zvxvjzs.public.blob.vercel-storage.com/screenshot-aHR0cHM6Ly-2025-06-04T13-30-36-766Z.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <SocialFooter />
        <Analytics />
      </body>
    </html>
  )
}
