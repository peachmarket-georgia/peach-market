import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { ProductStatus } from '@prisma/client'
import { ProductsService } from './products.service'
import { PrismaService } from '../../core/database/prisma.service'

describe('ProductsService', () => {
  let service: ProductsService
  let prisma: Record<string, any>

  const mockSeller = {
    id: 'seller-1',
    nickname: '판매자',
    avatarUrl: null,
    location: 'Duluth, GA',
    mannerScore: 4.5,
  }

  const mockProduct = {
    id: 'product-1',
    sellerId: 'seller-1',
    title: '아이패드 프로',
    description: '깨끗한 아이패드입니다',
    price: 650,
    category: '전자기기',
    status: ProductStatus.SELLING,
    images: ['https://example.com/img1.jpg'],
    location: 'Duluth, GA',
    lat: 34.0,
    lng: -84.1,
    paymentMethods: [],
    viewCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    seller: mockSeller,
    _count: { favorites: 3 },
  }

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      favorite: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
  })

  describe('findAll', () => {
    it('모든 상품을 반환해야 한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.favorite.findMany.mockResolvedValue([])

      const result = await service.findAll({})

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('favoriteCount', 3)
    })

    it('검색어로 필터링해야 한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct])

      await service.findAll({ search: '아이패드' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([{ title: { contains: '아이패드' } }]),
              }),
            ]),
          }),
        })
      )
    })

    it('카테고리로 필터링해야 한다', async () => {
      prisma.product.findMany.mockResolvedValue([])

      await service.findAll({ category: '전자기기' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ category: '전자기기' }]),
          }),
        })
      )
    })

    it('로그인 유저의 찜 상태를 포함해야 한다', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct])
      prisma.favorite.findMany.mockResolvedValue([{ productId: 'product-1' }])

      const result = await service.findAll({}, 'user-1')

      expect(result[0]).toHaveProperty('isFavorited', true)
    })

    it('가격 오름차순 정렬이 가능해야 한다', async () => {
      prisma.product.findMany.mockResolvedValue([])

      await service.findAll({ sort: 'price_asc' })

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { price: 'asc' } }))
    })

    it('반경 필터로 범위 내 상품만 반환해야 한다', async () => {
      const nearProduct = { ...mockProduct, id: 'near', lat: 34.001, lng: -84.101 }
      const farProduct = { ...mockProduct, id: 'far', lat: 40.0, lng: -80.0 }
      prisma.product.findMany.mockResolvedValue([nearProduct, farProduct])

      const result = await service.findAll({ lat: 34.0, lng: -84.1, radius: 5 })

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('id', 'near')
    })
  })

  describe('findOne', () => {
    it('상품을 반환해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct)
      prisma.product.update.mockResolvedValue(undefined)

      const result = await service.findOne('product-1', '127.0.0.1')

      expect(result).toHaveProperty('title', '아이패드 프로')
      expect(result).toHaveProperty('favoriteCount', 3)
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('create', () => {
    const createDto = {
      title: '새 상품',
      description: '설명',
      price: 100,
      category: '기타',
      location: 'Atlanta, GA',
    }

    it('상품을 생성해야 한다', async () => {
      prisma.product.create.mockResolvedValue({
        ...mockProduct,
        title: createDto.title,
        _count: { favorites: 0 },
      })

      const result = await service.create(createDto, 'seller-1', ['img1.jpg'])

      expect(result).toHaveProperty('title', createDto.title)
      expect(prisma.product.create).toHaveBeenCalled()
    })

    it('이미지가 없으면 BadRequestException을 던져야 한다', async () => {
      await expect(service.create(createDto, 'seller-1', [])).rejects.toThrow(BadRequestException)
    })
  })

  describe('update', () => {
    it('본인 상품을 수정해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })
      prisma.product.update.mockResolvedValue({ ...mockProduct, title: '수정됨' })

      const result = await service.update('product-1', { title: '수정됨' }, 'seller-1')

      expect(result).toHaveProperty('title', '수정됨')
    })

    it('타인의 상품이면 ForbiddenException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })

      await expect(service.update('product-1', { title: '수정' }, 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.update('nonexistent', { title: '수정' }, 'seller-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateStatus', () => {
    it('본인 상품의 상태를 변경해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })
      prisma.product.update.mockResolvedValue({ ...mockProduct, status: ProductStatus.ENDED })

      const result = await service.updateStatus('product-1', ProductStatus.ENDED, 'seller-1')

      expect(result).toHaveProperty('status', ProductStatus.ENDED)
    })

    it('타인의 상품이면 ForbiddenException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })

      await expect(service.updateStatus('product-1', ProductStatus.ENDED, 'other-user')).rejects.toThrow(
        ForbiddenException
      )
    })
  })

  describe('remove', () => {
    it('본인 상품을 삭제해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })
      prisma.product.delete.mockResolvedValue(undefined)

      const result = await service.remove('product-1', 'seller-1')

      expect(result.message).toContain('삭제')
    })

    it('타인의 상품이면 ForbiddenException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ sellerId: 'seller-1' })

      await expect(service.remove('product-1', 'other-user')).rejects.toThrow(ForbiddenException)
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.remove('nonexistent', 'seller-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('toggleFavorite', () => {
    it('찜이 없으면 추가해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, sellerId: 'seller-1' })
      prisma.favorite.findUnique.mockResolvedValue(null)
      prisma.favorite.create.mockResolvedValue(undefined)

      const result = await service.toggleFavorite('product-1', 'user-2')

      expect(result).toEqual({ isFavorited: true })
    })

    it('찜이 있으면 해제해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, sellerId: 'seller-1' })
      prisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' })
      prisma.favorite.delete.mockResolvedValue(undefined)

      const result = await service.toggleFavorite('product-1', 'user-2')

      expect(result).toEqual({ isFavorited: false })
    })

    it('본인 상품은 찜할 수 없어야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...mockProduct, sellerId: 'seller-1' })

      await expect(service.toggleFavorite('product-1', 'seller-1')).rejects.toThrow(ForbiddenException)
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.toggleFavorite('nonexistent', 'user-2')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getFavoritesByUser', () => {
    it('유저의 찜 목록을 반환해야 한다', async () => {
      prisma.favorite.findMany.mockResolvedValue([{ product: mockProduct, createdAt: new Date() }])

      const result = await service.getFavoritesByUser('user-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('isFavorited', true)
    })
  })
})
