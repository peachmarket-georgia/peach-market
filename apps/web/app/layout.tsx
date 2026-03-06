import type { Metadata } from 'next'
import './globals.css'
// import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import { MixpanelProvider } from '@/components/mixpanel-provider'
import { SocketProvider } from '@/context/socket-provider'
import { Toaster } from '@/components/ui/sonner'
import { FeedbackButton } from '@/components/feedback-button'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: '피치마켓 | 조지아 한인 중고거래',
  description: '조지아주 한인 커뮤니티를 위한 안전한 중고거래 플랫폼',
  icons: {
    icon: [
      { url: '/logo/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logo/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: '/logo/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    other: [
      { rel: 'android-chrome', url: '/logo/android-chrome-192x192.png', sizes: '192x192' },
      { rel: 'android-chrome', url: '/logo/android-chrome-512x512.png', sizes: '512x512' },
    ],
  },
}

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased">
        <SocketProvider>
          <MixpanelProvider>
            {children}
            <FeedbackButton />
          </MixpanelProvider>
        </SocketProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
        <Toaster />
      </body>
    </html>
  )
}

export default RootLayout
