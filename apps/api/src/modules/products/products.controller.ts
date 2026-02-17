import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
  ProductListResponseDto,
  UpdateStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
  };
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '상품 목록 조회',
    description: '상품 목록을 조회합니다. 검색, 필터, 정렬, 페이지네이션을 지원합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: ProductListResponseDto })
  async findAll(@Query() query: ProductQueryDto, @Request() req: RequestWithUser): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query, req.user?.userId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '찜 목록 조회', description: '사용자가 찜한 상품 목록을 조회합니다.' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 200, description: '조회 성공', type: [ProductResponseDto] })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getFavorites(@Request() req: RequestWithUser): Promise<ProductResponseDto[]> {
    return this.productsService.getFavoritesByUser(req.user!.userId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 상품 목록 조회', description: '사용자가 등록한 상품 목록을 조회합니다.' })
  @ApiCookieAuth('access_token')
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false, description: '상품 상태 필터' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [ProductResponseDto] })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMyProducts(
    @Request() req: RequestWithUser,
    @Query('status') status?: ProductStatus
  ): Promise<ProductResponseDto[]> {
    return this.productsService.getProductsByUser(req.user!.userId, status);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '상품 상세 조회', description: '상품 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser): Promise<ProductResponseDto> {
    // 조회수 증가
    await this.productsService.incrementViewCount(id);
    return this.productsService.findById(id, req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '상품 등록', description: '새 상품을 등록합니다.' })
  @ApiCookieAuth('access_token')
  @ApiResponse({ status: 201, description: '등록 성공', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async create(@Body() createDto: CreateProductDto, @Request() req: RequestWithUser) {
    const product = await this.productsService.create(createDto, req.user!.userId);
    return {
      ...product,
      favoriteCount: 0,
      isFavorited: false,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '상품 수정', description: '상품 정보를 수정합니다. 본인의 상품만 수정 가능합니다.' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto, @Request() req: RequestWithUser) {
    return this.productsService.update(id, updateDto, req.user!.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '상품 삭제', description: '상품을 삭제합니다. 본인의 상품만 삭제 가능합니다.' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async delete(@Param('id') id: string, @Request() req: RequestWithUser): Promise<void> {
    await this.productsService.delete(id, req.user!.userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '상품 상태 변경', description: '상품 상태를 변경합니다. 본인의 상품만 변경 가능합니다.' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '변경 성공', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto, @Request() req: RequestWithUser) {
    return this.productsService.updateStatus(id, body.status, req.user!.userId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '찜 토글', description: '상품을 찜하거나 찜을 해제합니다.' })
  @ApiCookieAuth('access_token')
  @ApiParam({ name: 'id', description: '상품 ID' })
  @ApiResponse({
    status: 201,
    description: '찜 상태 변경 성공',
    schema: { properties: { isFavorited: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '상품을 찾을 수 없음' })
  async toggleFavorite(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.productsService.toggleFavorite(id, req.user!.userId);
  }
}
