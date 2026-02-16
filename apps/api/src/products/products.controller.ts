import { Controller, Get, Post, Param, Query, Body, Req } from '@nestjs/common'
import type { Request } from 'express'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string
  ) {
    return this.productsService.findAll({ search, category, status, sort })
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    // 조회수 중복 방지
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown'
    return this.productsService.findOne(id, ip)
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }
}
