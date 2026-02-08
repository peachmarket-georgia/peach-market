import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * 🍑 피치마켓 PWA 메타데이터
 */
export const metadata: Metadata = {
  title: "피치마켓 | 조지아 한인 중고거래",
  description: "조지아주 한인 커뮤니티를 위한 안전한 중고거래 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "피치마켓",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ff8c42",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="ko">
      <head>
        {/* PWA iOS 지원 */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
