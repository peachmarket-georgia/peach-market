import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { StorageService } from './storage.service'
import { AppConfigService } from '../config/config.service'

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }))

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/img.jpg' } })),
      })),
    },
  })),
}))

jest.mock('sharp', () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
  }))
)

const makeJpegBuffer = (size = 100) => {
  const buf = Buffer.alloc(size)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  return buf
}

const makePngBuffer = (size = 100) => {
  const buf = Buffer.alloc(size)
  buf[0] = 0x89
  buf[1] = 0x50 // P
  buf[2] = 0x4e // N
  buf[3] = 0x47 // G
  return buf
}

const makeWebpBuffer = (size = 100) => {
  const buf = Buffer.alloc(size)
  buf.write('RIFF', 0, 'ascii')
  buf.write('WEBP', 8, 'ascii')
  return buf
}

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
  fieldname: 'files',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1 * 1024 * 1024, // 1MB
  buffer: makeJpegBuffer(1 * 1024 * 1024),
  stream: null as unknown as Express.Multer.File['stream'],
  destination: '',
  filename: '',
  path: '',
  ...overrides,
})

describe('StorageService', () => {
  let service: StorageService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: AppConfigService,
          useValue: {
            supabaseUrl: 'https://fake.supabase.co',
            supabaseServiceRoleKey: 'fake-key',
          },
        },
      ],
    }).compile()

    service = module.get<StorageService>(StorageService)
  })

  describe('uploadImages - 파일 검증', () => {
    it('10MB 초과 파일이면 BadRequestException을 던져야 한다', async () => {
      const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024)
      oversizedBuffer[0] = 0xff
      oversizedBuffer[1] = 0xd8
      oversizedBuffer[2] = 0xff

      const file = makeFile({
        size: 11 * 1024 * 1024,
        buffer: oversizedBuffer,
      })

      await expect(service.uploadImages([file])).rejects.toThrow(BadRequestException)
      await expect(service.uploadImages([file])).rejects.toThrow('10MB')
    })

    it('10MB 이하 파일은 검증을 통과해야 한다', async () => {
      const file = makeFile({ size: 10 * 1024 * 1024, buffer: makeJpegBuffer(10 * 1024 * 1024) })

      await expect(service.uploadImages([file])).resolves.toBeDefined()
    })

    it('허용되지 않은 MIME 타입이면 BadRequestException을 던져야 한다', async () => {
      const file = makeFile({ mimetype: 'image/gif' })

      await expect(service.uploadImages([file])).rejects.toThrow(BadRequestException)
      await expect(service.uploadImages([file])).rejects.toThrow('파일 형식')
    })

    it('유효하지 않은 magic bytes면 BadRequestException을 던져야 한다', async () => {
      const fakeBuffer = Buffer.alloc(100) // 모두 0x00
      const file = makeFile({ buffer: fakeBuffer })

      await expect(service.uploadImages([file])).rejects.toThrow(BadRequestException)
      await expect(service.uploadImages([file])).rejects.toThrow('유효하지 않은')
    })

    it('PNG 파일을 정상 업로드해야 한다', async () => {
      const file = makeFile({ mimetype: 'image/png', originalname: 'test.png', buffer: makePngBuffer() })

      await expect(service.uploadImages([file])).resolves.toHaveLength(1)
    })

    it('WebP 파일을 정상 업로드해야 한다', async () => {
      const file = makeFile({ mimetype: 'image/webp', originalname: 'test.webp', buffer: makeWebpBuffer() })

      await expect(service.uploadImages([file])).resolves.toHaveLength(1)
    })

    it('파일이 없으면 BadRequestException을 던져야 한다', async () => {
      await expect(service.uploadImages([])).rejects.toThrow(BadRequestException)
    })

    it('6개 이상 파일이면 BadRequestException을 던져야 한다', async () => {
      const files = Array.from({ length: 6 }, () => makeFile())

      await expect(service.uploadImages(files)).rejects.toThrow(BadRequestException)
      await expect(service.uploadImages(files)).rejects.toThrow('5개')
    })

    it('업로드 결과에 url과 thumbnailUrl이 포함되어야 한다', async () => {
      const file = makeFile()

      const result = await service.uploadImages([file])

      expect(result[0]).toHaveProperty('url')
      expect(result[0]).toHaveProperty('thumbnailUrl')
      expect(result[0]).toHaveProperty('originalName', 'test.jpg')
    })
  })
})
