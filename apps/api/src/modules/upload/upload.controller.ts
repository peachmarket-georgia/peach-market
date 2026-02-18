import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          callback(new BadRequestException('JPG, PNG, WebP 형식만 업로드 가능합니다.'), false);
          return;
        }
        callback(null, true);
      },
    })
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '이미지 업로드',
    description: '상품 이미지를 업로드합니다. 최대 5개, 각 5MB 이하, JPG/PNG/WebP 형식만 가능합니다.',
  })
  @ApiCookieAuth('access_token')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: '업로드할 이미지 파일들 (최대 5개)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '업로드 성공',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (파일 형식, 크기 등)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]): Promise<UploadResponseDto> {
    const images = await this.uploadService.uploadImages(files);
    return { images };
  }
}
