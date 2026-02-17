import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ProductResponseDto, ProductListResponseDto } from './dto';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductQueryDto, userId?: string): Promise<ProductListResponseDto> {
    const { cursor, limit = 20, search, category, status, sort = 'latest' } = query;

    // 정렬 조건
    const orderBy = this.getOrderBy(sort);

    // 필터 조건
    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category }),
      ...(status && { status }),
    };

    // 상품 조회
    const products = await this.prisma.product.findMany({
      where,
      take: limit + 1, // 다음 페이지 확인용으로 1개 더 조회
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            location: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
        ...(userId && {
          favorites: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    // 다음 페이지 여부 확인
    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, -1) : products;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // 응답 형식 변환
    const formattedProducts: ProductResponseDto[] = items.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      status: product.status,
      images: product.images,
      location: product.location,
      viewCount: product.viewCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      seller: product.seller,
      favoriteCount: product._count.favorites,
      isFavorited: userId ? (product as typeof product & { favorites: { id: string }[] }).favorites?.length > 0 : false,
    }));

    return {
      products: formattedProducts,
      nextCursor,
      hasMore,
    };
  }

  async findById(id: string, userId?: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            location: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
        ...(userId && {
          favorites: {
            where: { userId },
            select: { id: true },
          },
        }),
      },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      status: product.status,
      images: product.images,
      location: product.location,
      viewCount: product.viewCount,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      seller: product.seller,
      favoriteCount: product._count.favorites,
      isFavorited: userId ? (product as typeof product & { favorites: { id: string }[] }).favorites?.length > 0 : false,
    };
  }

  async create(createDto: CreateProductDto, sellerId: string) {
    return this.prisma.product.create({
      data: {
        ...createDto,
        sellerId,
      },
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateProductDto, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('본인의 상품만 수정할 수 있습니다');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateDto,
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
    });
  }

  async delete(id: string, sellerId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('본인의 상품만 삭제할 수 있습니다');
    }

    await this.prisma.product.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: ProductStatus, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('본인의 상품만 상태를 변경할 수 있습니다');
    }

    return this.prisma.product.update({
      where: { id },
      data: { status },
      include: {
        seller: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true,
            location: true,
          },
        },
      },
    });
  }

  async toggleFavorite(productId: string, userId: string): Promise<{ isFavorited: boolean }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다');
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

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  private getOrderBy(sort: string) {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' as const };
      case 'price_desc':
        return { price: 'desc' as const };
      case 'latest':
      default:
        return { createdAt: 'desc' as const };
    }
  }
}
