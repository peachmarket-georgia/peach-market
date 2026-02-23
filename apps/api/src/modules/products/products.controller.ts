import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiCookieAuth, ApiParam, ApiConsumes } from '@nestjs/swagger'
import type { Request } from 'express'
import { ProductStatus } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '상품 목록 조회', description: '검색, 카테고리, 상태 필터 및 정렬 지원' })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (제목, 설명)' })
  @ApiQuery({ name: 'category', required: false, description: '카테고리 필터' })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터 (판매중, 예약중, 판매완료)' })
  @ApiQuery({ name: 'sort', required: false, description: '정렬', enum: ['price_asc', 'price_desc'] })
  @ApiResponse({ status: 200, description: '상품 목록 반환' })
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string
  ) {
    return this.productsService.findAll({ search, category, status, sort })
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '찜 목록 조회', description: '사용자가 찜한 상품 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '찜 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getFavorites(@Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.getFavoritesByUser(userId)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '내 상품 목록 조회', description: '로그인한 사용자가 등록한 상품 목록' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false, description: '상품 상태 필터' })
  @ApiResponse({ status: 200, description: '내 상품 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findMy(@Req() req: Request, @Query('status') status?: ProductStatus) {
    const { userId } = req.user as { userId: string }
    return this.productsService.findMy(userId, status)
  }

  @Get(':id')
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '상품 상세 정보 조회 및 조회수 증가 (IP 기반 24시간 중복 방지)',
  })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '상품 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown'
    return this.productsService.findOne(id, ip)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(file.mimetype)) {
          callback(new BadRequestException('JPG, PNG, WebP 형식만 업로드 가능합니다.'), false)
          return
        }
        callback(null, true)
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '상품 등록',
    description: '새 상품을 등록합니다. 이미지 파일을 files 필드로 함께 전송하세요 (로그인 필요)',
  })
  @ApiResponse({ status: 201, description: '상품 등록 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 입력' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@UploadedFiles() files: Express.Multer.File[], @Body() dto: CreateProductDto, @Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.create(dto, userId, files)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '상품 수정', description: '본인이 등록한 상품을 수정합니다 (로그인 필요)' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '상품 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 상품만 수정 가능' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.update(id, dto, userId)
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '상품 상태 변경', description: '상품 상태를 변경합니다 (판매중/예약중/판매완료)' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 상품만 변경 가능' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  updateStatus(@Param('id') id: string, @Body('status') status: ProductStatus, @Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.updateStatus(id, status, userId)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '상품 삭제', description: '본인이 등록한 상품을 삭제합니다 (로그인 필요)' })
  @ApiResponse({ status: 200, description: '상품 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 상품만 삭제 가능' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  remove(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.remove(id, userId)
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '찜 토글', description: '상품 찜하기/찜 해제' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '찜 상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  toggleFavorite(@Param('id') id: string, @Req() req: Request) {
    const { userId } = req.user as { userId: string }
    return this.productsService.toggleFavorite(id, userId)
  }
}
