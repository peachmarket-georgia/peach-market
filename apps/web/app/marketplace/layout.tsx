import { Header } from '@/components/layout/header';

const MarketPlaceLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="antialiased">
      <Header />
      {children}
    </div>
  );
};

export default MarketPlaceLayout;
