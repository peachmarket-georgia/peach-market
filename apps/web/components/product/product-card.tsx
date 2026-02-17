import Image from 'next/image'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { STATUS_LABEL } from '@/lib/product-types'
import type { Product } from '@/lib/product-types'

type ProductCardProps = {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const isSold = product.status === 'SOLD'
  const isReserved = product.status === 'RESERVED'

  return (
    <Link href={`/marketplace/${product.id}`}>
      <article className="group cursor-pointer">
        {/* 이미지 - 1:1 정사각형 */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {product.thumbnailUrl ? (
            <Image
              src={product.thumbnailUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <Skeleton className="w-full h-full rounded-none" />
          )}

          {/* 예약중 뱃지 */}
          {isReserved && (
            <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-[#FFC107] text-white rounded">
              {STATUS_LABEL.RESERVED}
            </span>
          )}

          {/* 판매완료 오버레이 */}
          {isSold && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium">
                {STATUS_LABEL.SOLD}
              </span>
            </div>
          )}
        </div>

        {/* 정보 */}
        <div className="mt-2 px-0.5">
          <h3 className="text-[15px] font-normal text-foreground line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {(product.location || product.timeAgo) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {product.location}
              {product.location && product.timeAgo && ' · '}
              {product.timeAgo}
            </p>
          )}

          <p
            className={`mt-1 text-[15px] font-bold ${
              isSold ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            ${product.price.toLocaleString()}
          </p>
        </div>
      </article>
    </Link>
  )
}
