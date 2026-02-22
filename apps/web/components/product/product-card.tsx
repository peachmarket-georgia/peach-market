import Image from 'next/image';
import Link from 'next/link';
import { IconMapPin } from '@tabler/icons-react';
import { STATUS_LABEL } from '@/lib/product-types';
import type { Product } from '@/lib/product-types';

type ProductCardProps = {
  product: Product;
};

export const ProductCard = ({ product }: ProductCardProps) => {
  const isSold = product.status === 'SOLD';
  const isReserved = product.status === 'RESERVED';

  return (
    <Link href={`/marketplace/${product.id}`}>
      <article className="group cursor-pointer bg-white rounded-2xl overflow-hidden border-2 border-orange-50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200">
        {/* 이미지 */}
        <div className="relative aspect-square overflow-hidden bg-orange-50">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-orange-50 to-amber-50" />
          )}

          {/* 예약중 뱃지 */}
          {isReserved && (
            <span className="absolute top-2 left-2 px-2.5 py-1 text-xs font-bold bg-[#FFC107] text-white rounded-lg shadow-md">
              {STATUS_LABEL.RESERVED}
            </span>
          )}

          {/* 판매완료 오버레이 */}
          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">{STATUS_LABEL.SOLD}</span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="p-3">
          <h3
            className={`text-[14px] font-semibold line-clamp-2 leading-snug mb-1.5 ${
              isSold ? 'text-[#9E9E9E]' : 'text-[#212121]'
            }`}
          >
            {product.title}
          </h3>

          {product.location && (
            <p className="flex items-center gap-0.5 text-xs text-[#9E9E9E] mb-1.5">
              <IconMapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.location}</span>
            </p>
          )}

          <p className={`mt-1 text-[15px] font-bold ${isSold ? 'text-muted-foreground' : 'text-foreground'}`}>
            ${product.price.toLocaleString()}
          </p>
        </div>
      </article>
    </Link>
  );
};
