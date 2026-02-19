import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const SELLER_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
  location: true,
  mannerScore: true,
} as const;

const PRODUCT_SELECT = {
  id: true,
  sellerId: true,
  title: true,
  description: true,
  price: true,
  category: true,
  status: true,
  images: true,
  location: true,
  paymentMethods: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  seller: { select: SELLER_SELECT },
  _count: { select: { favorites: true } },
} as const;

const VIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const recentViews = new Map<string, number>();

// 만료된 항목 주기적 정리 (5분마다)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamp] of recentViews) {
      if (now - timestamp > VIEW_COOLDOWN_MS) {
        recentViews.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

type ProductWithCount = {
  _count: { favorites: number };
  [key: string]: unknown;
};

function formatProduct(product: ProductWithCount, isFavorited = false) {
  const { _count, ...rest } = product;
  return {
    ...rest,
    favoriteCount: _count.favorites,
    isFavorited,
  };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; status?: string; sort?: string }, userId?: string) {
    const conditions: object[] = [];

    if (query.search) {
      conditions.push({
        OR: [{ title: { contains: query.search } }, { description: { contains: query.search } }],
      });
    }

    if (query.category) {
      conditions.push({ category: query.category });
    }

    if (query.status) {
      conditions.push({ status: query.status });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (query.sort === 'price_asc') orderBy = { price: 'asc' };
    if (query.sort === 'price_desc') orderBy = { price: 'desc' };

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      select: PRODUCT_SELECT,
    });

    let favoritedIds = new Set<string>();
    if (userId) {
      const favorites = await this.prisma.favorite.findMany({
        where: { userId },
        select: { productId: true },
      });
      favoritedIds = new Set(favorites.map((f) => f.productId));
    }

    return products.map((p) => formatProduct(p, favoritedIds.has((p as { id: string }).id)));
  }

  async findMy(sellerId: string, status?: ProductStatus) {
    const products = await this.prisma.product.findMany({
      where: {
        sellerId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      select: PRODUCT_SELECT,
    });

    return products.map((p) => formatProduct(p));
  }

  async findOne(id: string, ip?: string, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // 조회수 증가 (같은 IP의 중복 조회 무시)
    const viewKey = `${ip ?? 'unknown'}:${id}`;
    const lastViewed = recentViews.get(viewKey);
    const now = Date.now();

    if (!lastViewed || now - lastViewed > VIEW_COOLDOWN_MS) {
      recentViews.set(viewKey, now);
      await this.prisma.product.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      (product as { viewCount: number }).viewCount += 1;
    }

    let isFavorited = false;
    if (userId) {
      const favorite = await this.prisma.favorite.findUnique({
        where: { userId_productId: { userId, productId: id } },
      });
      isFavorited = !!favorite;
    }

    return formatProduct(product, isFavorited);
  }

  async create(dto: CreateProductDto, sellerId: string) {
    const product = await this.prisma.product.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        location: dto.location,
        images: dto.images,
        paymentMethods: dto.paymentMethods ?? [],
      },
      select: PRODUCT_SELECT,
    });

    return formatProduct(product);
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('본인의 상품만 수정할 수 있습니다');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: dto,
      select: PRODUCT_SELECT,
    });

    return formatProduct(updated);
  }

  async updateStatus(id: string, status: ProductStatus, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('본인의 상품만 상태를 변경할 수 있습니다');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status },
      select: PRODUCT_SELECT,
    });

    return formatProduct(updated);
  }

  async remove(id: string, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { sellerId: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('본인의 상품만 삭제할 수 있습니다');
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: '상품이 삭제되었습니다' };
  }

  async toggleFavorite(productId: string, userId: string): Promise<{ isFavorited: boolean }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
    }

    if (product.sellerId === userId) {
      throw new ForbiddenException('본인의 상품은 찜할 수 없습니다');
    }

    const existingFavorite = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return { isFavorited: false };
    } else {
      await this.prisma.favorite.create({
        data: {
          userId,
          productId,
        },
      });
      return { isFavorited: true };
    }
  }

  async getFavoritesByUser(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          select: PRODUCT_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => formatProduct(f.product, true));
  }
}
