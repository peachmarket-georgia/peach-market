import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

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
      <body className="antialiased">{children}</body>
    </html>
  )
}

export default RootLayout
