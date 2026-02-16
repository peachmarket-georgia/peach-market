import { Controller, Delete, Get, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiCookieAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

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
    return this.productsService.findAll({ search, category, status, sort });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '내 상품 목록 조회', description: '로그인한 사용자가 등록한 상품 목록' })
  @ApiResponse({ status: 200, description: '내 상품 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findMy(@Req() req: Request) {
    const { userId } = req.user as { userId: string };
    return this.productsService.findMy(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '상품 상세 정보 조회 및 조회수 증가 (IP 기반 24시간 중복 방지)',
  })
  @ApiResponse({ status: 200, description: '상품 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    return this.productsService.findOne(id, ip);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: '상품 등록', description: '새 상품을 등록합니다 (로그인 필요)' })
  @ApiResponse({ status: 201, description: '상품 등록 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 입력' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@Body() dto: CreateProductDto, @Req() req: Request) {
    const { userId } = req.user as { userId: string };
    return this.productsService.create(dto, userId);
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
    const { userId } = req.user as { userId: string };
    return this.productsService.remove(id, userId);
  }
}
