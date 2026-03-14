import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException } from '@nestjs/common'
import { UsersService } from './users.service'
import { PrismaService } from '../../core/database/prisma.service'

describe('UsersService', () => {
  let service: UsersService
  let prisma: Record<string, any>

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    password: '$2b$10$hashed',
    nickname: '테스터',
    location: 'Atlanta, GA',
    avatarUrl: null,
    isEmailVerified: true,
    isBlocked: false,
    role: 'USER',
    mannerScore: 4.5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile()

    service = module.get<UsersService>(UsersService)
  })

  describe('findByEmail', () => {
    it('이메일로 유저를 찾아야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByEmail('test@example.com')

      expect(result).toEqual(mockUser)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
    })

    it('없으면 null을 반환해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.findByEmail('unknown@example.com')

      expect(result).toBeNull()
    })
  })

  describe('findByNickname', () => {
    it('닉네임으로 유저를 찾아야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findByNickname('테스터')

      expect(result).toEqual(mockUser)
    })
  })

  describe('findById', () => {
    it('ID로 유저를 찾아야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.findById('user-1')

      expect(result).toEqual(mockUser)
    })
  })

  describe('checkEmailAvailability', () => {
    it('사용 가능한 이메일이면 true를 반환해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.checkEmailAvailability('new@example.com')

      expect(result).toBe(true)
    })

    it('이미 사용 중이면 false를 반환해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.checkEmailAvailability('test@example.com')

      expect(result).toBe(false)
    })
  })

  describe('checkNicknameAvailability', () => {
    it('사용 가능한 닉네임이면 true를 반환해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.checkNicknameAvailability('새닉네임')

      expect(result).toBe(true)
    })

    it('이미 사용 중이면 false를 반환해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await service.checkNicknameAvailability('테스터')

      expect(result).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('프로필을 수정해야 한다', async () => {
      const updated = { ...mockUser, nickname: '새닉네임' }
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.update.mockResolvedValue(updated)

      const result = await service.updateProfile('user-1', { nickname: '새닉네임' })

      expect(result.nickname).toBe('새닉네임')
      expect(result).not.toHaveProperty('password')
    })

    it('본인의 기존 닉네임으로 수정하면 허용해야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser) // 같은 유저
      prisma.user.update.mockResolvedValue(mockUser)

      const result = await service.updateProfile('user-1', { nickname: '테스터' })

      expect(result).toBeDefined()
    })

    it('타인의 닉네임으로 수정하면 ConflictException을 던져야 한다', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: 'other-user' })

      await expect(service.updateProfile('user-1', { nickname: '테스터' })).rejects.toThrow(ConflictException)
    })
  })
})
