/**
 * 피치마켓 마켓플레이스
 */

import { ProductGrid } from "@/components/product";
import { products } from "@/lib/data";

const MarketplacePage = () => {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        내 근처 매물
      </h2>
      <ProductGrid products={products} />
    </div>
  );
};

export default MarketplacePage;
