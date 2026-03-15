import { Injectable, BadRequestException } from '@nestjs/common'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { AppConfigService } from '../config/config.service'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
}

export type UploadedImage = {
  url: string
  thumbnailUrl: string
  originalName: string
  size: number
}

@Injectable()
export class StorageService {
  private supabase: ReturnType<typeof createClient>
  private readonly bucketName = 'product-images'

  // 서버 사이드: 세션 관리 비활성화하여 service role key로 직접 인증 (RLS 우회)
  constructor(private config: AppConfigService) {
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const magicBytes = MAGIC_BYTES[mimeType]
    if (!magicBytes) return false

    if (mimeType === 'image/webp') {
      const riff = buffer.slice(0, 4).toString('ascii') === 'RIFF'
      const webp = buffer.slice(8, 12).toString('ascii') === 'WEBP'
      return riff && webp
    }

    for (let i = 0; i < magicBytes.length; i++) {
      if (buffer[i] !== magicBytes[i]) return false
    }
    return true
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`허용되지 않는 파일 형식입니다. JPG, PNG, WebP만 가능합니다.`)
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`파일 크기는 10MB 이하여야 합니다.`)
    }

    if (!this.validateMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(`유효하지 않은 이미지 파일입니다.`)
    }
  }

  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).resize(300, 300, { fit: 'cover', position: 'center' }).jpeg({ quality: 80 }).toBuffer()
  }

  private async uploadToSupabase(buffer: Buffer, path: string, contentType: string): Promise<string> {
    const { error } = await this.supabase.storage.from(this.bucketName).upload(path, buffer, {
      contentType,
      upsert: false,
    })

    if (error) {
      throw new BadRequestException(`파일 업로드에 실패했습니다: ${error.message}`)
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucketName).getPublicUrl(path)

    return publicUrl
  }

  async uploadImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 파일이 없습니다.')
    }

    if (files.length > 5) {
      throw new BadRequestException('최대 5개의 이미지만 업로드할 수 있습니다.')
    }

    const results: UploadedImage[] = []

    for (const file of files) {
      this.validateFile(file)

      const fileId = uuidv4()
      const extension = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : 'webp'
      const originalPath = `originals/${fileId}.${extension}`
      const thumbnailPath = `thumbnails/${fileId}.jpg`

      const originalUrl = await this.uploadToSupabase(file.buffer, originalPath, file.mimetype)

      const thumbnailBuffer = await this.createThumbnail(file.buffer)
      const thumbnailUrl = await this.uploadToSupabase(thumbnailBuffer, thumbnailPath, 'image/jpeg')

      results.push({
        url: originalUrl,
        thumbnailUrl,
        originalName: file.originalname,
        size: file.size,
      })
    }

    return results
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/)

      if (!pathMatch) return

      const filePath = pathMatch[1]
      await this.supabase.storage.from(this.bucketName).remove([filePath])

      if (filePath.startsWith('originals/')) {
        const thumbnailPath = filePath.replace('originals/', 'thumbnails/').replace(/\.(jpg|png|webp)$/, '.jpg')
        await this.supabase.storage.from(this.bucketName).remove([thumbnailPath])
      }
    } catch {
      // 삭제 실패는 무시 (이미 삭제되었거나 잘못된 URL)
    }
  }
}
