import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

const SELLER_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
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
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  seller: { select: SELLER_SELECT },
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

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { search?: string; category?: string; status?: string; sort?: string }) {
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

    return await this.prisma.product.findMany({
      where,
      orderBy,
      select: PRODUCT_SELECT,
    });
  }

  async findMy(sellerId: string) {
    return this.prisma.product.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      select: PRODUCT_SELECT,
    });
  }

  async findOne(id: string, ip?: string) {
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
      product.viewCount += 1;
    }

    return product;
  }

  async create(dto: CreateProductDto, sellerId: string) {
    return this.prisma.product.create({
      data: {
        sellerId,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        location: dto.location,
        images: [],
      },
      select: PRODUCT_SELECT,
    });
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
}
