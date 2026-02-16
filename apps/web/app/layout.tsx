import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import { MixpanelProvider } from '@/components/mixpanel-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: '피치마켓 | 조지아 한인 중고거래',
  description: '조지아주 한인 커뮤니티를 위한 안전한 중고거래 플랫폼',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased">
        <MixpanelProvider>{children}</MixpanelProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
