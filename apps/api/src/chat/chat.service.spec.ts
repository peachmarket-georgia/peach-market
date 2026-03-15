import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ChatService } from './chat.service'
import { PrismaService } from '../core/database/prisma.service'

describe('ChatService', () => {
  let service: ChatService
  let prisma: Record<string, any>

  const mockChatRoom = {
    id: 'room-1',
    productId: 'product-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    lastMessage: '안녕하세요',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockMessage = {
    id: 'msg-1',
    chatRoomId: 'room-1',
    senderId: 'buyer-1',
    content: '안녕하세요',
    isRead: false,
    createdAt: new Date(),
    sender: { id: 'buyer-1', nickname: '구매자' },
  }

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      chatRoom: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<ChatService>(ChatService)
  })

  describe('createChatRoom', () => {
    it('새 채팅방을 생성해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'seller-1' })
      prisma.chatRoom.findUnique.mockResolvedValue(null)
      prisma.chatRoom.create.mockResolvedValue({
        ...mockChatRoom,
        product: {},
        buyer: {},
        seller: {},
      })

      const result = await service.createChatRoom('product-1', 'buyer-1')

      expect(result).toBeDefined()
      expect(prisma.chatRoom.create).toHaveBeenCalled()
    })

    it('이미 존재하는 채팅방이면 기존 방을 반환해야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'seller-1' })
      prisma.chatRoom.findUnique
        .mockResolvedValueOnce(mockChatRoom) // findChatRoomByProductAndBuyer
        .mockResolvedValueOnce({ ...mockChatRoom, product: {}, buyer: {}, seller: {} }) // re-fetch with includes

      const result = await service.createChatRoom('product-1', 'buyer-1')

      expect(result).toBeDefined()
      expect(prisma.chatRoom.create).not.toHaveBeenCalled()
    })

    it('존재하지 않는 상품이면 NotFoundException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue(null)

      await expect(service.createChatRoom('nonexistent', 'buyer-1')).rejects.toThrow(NotFoundException)
    })

    it('본인 상품에 채팅을 시작하면 BadRequestException을 던져야 한다', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'product-1', sellerId: 'seller-1' })

      await expect(service.createChatRoom('product-1', 'seller-1')).rejects.toThrow(BadRequestException)
    })
  })

  describe('saveMessage', () => {
    it('메시지를 저장하고 lastMessage를 업데이트해야 한다', async () => {
      prisma.message.create.mockResolvedValue(mockMessage)
      prisma.chatRoom.update.mockResolvedValue(undefined)

      const result = await service.saveMessage('room-1', 'buyer-1', '안녕하세요')

      expect(result).toEqual(mockMessage)
      expect(prisma.chatRoom.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'room-1' },
          data: expect.objectContaining({ lastMessage: '안녕하세요' }),
        })
      )
    })
  })

  describe('markMessagesAsRead', () => {
    it('상대방 메시지를 읽음 처리해야 한다', async () => {
      prisma.message.updateMany.mockResolvedValue({ count: 5 })

      await service.markMessagesAsRead('room-1', 'buyer-1')

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          chatRoomId: 'room-1',
          senderId: { not: 'buyer-1' },
          isRead: false,
        },
        data: { isRead: true },
      })
    })
  })

  describe('countUnreadMessages', () => {
    it('안읽은 메시지 수를 반환해야 한다', async () => {
      prisma.message.count.mockResolvedValue(3)

      const result = await service.countUnreadMessages('room-1', 'buyer-1')

      expect(result).toBe(3)
    })
  })

  describe('getChatRoomsWithUnreadCount', () => {
    it('채팅방 목록에 안읽은 수를 포함해야 한다', async () => {
      prisma.chatRoom.findMany.mockResolvedValue([{ ...mockChatRoom, buyer: {}, seller: {}, product: {} }])
      prisma.message.count.mockResolvedValue(2)

      const result = await service.getChatRoomsWithUnreadCount('buyer-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('unreadCount', 2)
    })
  })

  describe('getTotalUnreadCount', () => {
    it('전체 안읽은 메시지 수를 반환해야 한다', async () => {
      prisma.chatRoom.findMany.mockResolvedValue([{ id: 'room-1' }, { id: 'room-2' }])
      prisma.message.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2)

      const result = await service.getTotalUnreadCount('user-1')

      expect(result).toBe(5)
    })
  })

  describe('findChatRoomsByUserId', () => {
    it('유저의 채팅방 목록을 반환해야 한다', async () => {
      prisma.chatRoom.findMany.mockResolvedValue([mockChatRoom])

      const result = await service.findChatRoomsByUserId('buyer-1')

      expect(result).toHaveLength(1)
      expect(prisma.chatRoom.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ buyerId: 'buyer-1' }, { sellerId: 'buyer-1' }] },
        })
      )
    })
  })
})
