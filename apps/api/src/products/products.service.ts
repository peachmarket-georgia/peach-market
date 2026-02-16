import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'

const SELLER_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
  mannerScore: true,
} as const

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    search?: string
    category?: string
    status?: string
    sort?: string
  }) {
    const conditions: object[] = []

    if (query.search) {
      conditions.push({
        OR: [
          { title: { contains: query.search } },
          { description: { contains: query.search } },
        ],
      })
    }

    if (query.category) {
      conditions.push({ category: query.category })
    }

    if (query.status) {
      conditions.push({ status: query.status })
    }

    const where = conditions.length > 0 ? { AND: conditions } : {}

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    if (query.sort === 'price_asc') orderBy = { price: 'asc' }
    if (query.sort === 'price_desc') orderBy = { price: 'desc' }

    return await this.prisma.product.findMany({
      where,
      orderBy,
      select: {
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
      },
    })
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
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
      },
    })

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`)
    }

    // 조회수 증가
    await this.prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return product
  }

  async create(dto: CreateProductDto) {
    // 로그인 미구현 → 첫번째 유저를 판매자로 사용
    const seller = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!seller) {
      throw new NotFoundException(
        'No seed user found. Run prisma db seed first.'
      )
    }

    return this.prisma.product.create({
      data: {
        sellerId: seller.id,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        category: dto.category,
        location: dto.location,
        images: [],
      },
      select: {
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
      },
    })
  }
}
