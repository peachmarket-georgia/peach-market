import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { DesktopHeader } from "./DesktopHeader";
import { FloatingActionButton } from "./FloatingActionButton";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* 모바일 헤더 */}
      <MobileHeader />

      {/* 데스크탑 헤더 */}
      <DesktopHeader />

      {/* 메인 콘텐츠 */}
      <main className="px-4 py-4 pb-24 md:pb-8 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* 모바일 FAB */}
      <FloatingActionButton />

      {/* 모바일 하단 네비 */}
      <MobileBottomNav />
    </div>
  );
};
