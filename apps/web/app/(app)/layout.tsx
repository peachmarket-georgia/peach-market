/**
 * 앱 레이아웃
 * 메인 앱에서 사용하는 레이아웃 (헤더, 네비게이션 등 포함)
 */

import { ResponsiveLayout } from "@/components/layout";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};

export default AppLayout;
