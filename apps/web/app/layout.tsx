import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import mixpanel from 'mixpanel-browser'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''
const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || ''

/**
 * 피치마켓 PWA 메타데이터
 */
export const metadata: Metadata = {
  title: '피치마켓 | 조지아 한인 중고거래',
  description: '조지아주 한인 커뮤니티를 위한 안전한 중고거래 플랫폼',
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  //필요한 기능 추후 추가
  const mp = mixpanel.init(MIXPANEL_TOKEN)
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased">
        {children}
        <GoogleAnalytics gaId={GA_ID} />
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
