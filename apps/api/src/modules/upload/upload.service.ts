import { Injectable, BadRequestException } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { AppConfigService } from '../../core/config/config.service'
import { UploadedImageDto } from './dto/upload-response.dto'

// 허용된 MIME 타입
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
}

@Injectable()
export class UploadService {
  private supabase: SupabaseClient
  private readonly bucketName = 'product-images'

  constructor(private config: AppConfigService) {
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseServiceRoleKey)
  }

  /**
   * 파일의 실제 MIME 타입을 magic bytes로 검증
   */
  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    const magicBytes = MAGIC_BYTES[mimeType]
    if (!magicBytes) return false

    // WebP는 특별 처리 (RIFF...WEBP 형식)
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

  /**
   * 파일 유효성 검사
   */
  private validateFile(file: Express.Multer.File): void {
    // MIME 타입 검사
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`허용되지 않는 파일 형식입니다. JPG, PNG, WebP만 가능합니다.`)
    }

    // 파일 크기 검사 (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(`파일 크기는 5MB 이하여야 합니다.`)
    }

    // Magic bytes 검사
    if (!this.validateMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(`유효하지 않은 이미지 파일입니다.`)
    }
  }

  /**
   * 썸네일 생성 (300x300)
   */
  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer).resize(300, 300, { fit: 'cover', position: 'center' }).jpeg({ quality: 80 }).toBuffer()
  }

  /**
   * Supabase Storage에 파일 업로드
   */
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

  /**
   * 이미지 파일들 업로드
   */
  async uploadImages(files: Express.Multer.File[]): Promise<UploadedImageDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 파일이 없습니다.')
    }

    if (files.length > 5) {
      throw new BadRequestException('최대 5개의 이미지만 업로드할 수 있습니다.')
    }

    const results: UploadedImageDto[] = []

    for (const file of files) {
      // 파일 유효성 검사
      this.validateFile(file)

      // 고유 파일명 생성
      const fileId = uuidv4()
      const extension = file.mimetype === 'image/jpeg' ? 'jpg' : file.mimetype === 'image/png' ? 'png' : 'webp'
      const originalPath = `originals/${fileId}.${extension}`
      const thumbnailPath = `thumbnails/${fileId}.jpg`

      // 원본 이미지 업로드
      const originalUrl = await this.uploadToSupabase(file.buffer, originalPath, file.mimetype)

      // 썸네일 생성 및 업로드
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

  /**
   * 이미지 삭제 (URL에서 경로 추출하여 삭제)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // URL에서 파일 경로 추출
      const url = new URL(imageUrl)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/product-images\/(.+)/)

      if (!pathMatch) return

      const filePath = pathMatch[1]
      await this.supabase.storage.from(this.bucketName).remove([filePath])

      // 썸네일도 삭제 (originals -> thumbnails)
      if (filePath.startsWith('originals/')) {
        const thumbnailPath = filePath.replace('originals/', 'thumbnails/').replace(/\.(jpg|png|webp)$/, '.jpg')
        await this.supabase.storage.from(this.bucketName).remove([thumbnailPath])
      }
    } catch {
      // 삭제 실패는 무시 (이미 삭제되었거나 잘못된 URL)
    }
  }
}
