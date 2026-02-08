/**
 * 마케팅 페이지 레이아웃
 * 랜딩페이지 등 앱 셸 없이 독립적인 레이아웃 사용
 */

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout = ({ children }: MarketingLayoutProps) => {
  return <div className="min-h-screen bg-background">{children}</div>;
};

export default MarketingLayout;
