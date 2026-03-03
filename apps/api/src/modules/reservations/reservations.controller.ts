import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiCookieAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator'
import { ReservationsService } from './reservations.service'
import { CreateReservationDto } from './dto/create-reservation.dto'

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('access_token')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * 예약 생성
   * 판매자가 채팅 상대(구매자)와 예약을 생성합니다.
   * 상품 상태가 자동으로 RESERVED로 변경됩니다.
   */
  @Post()
  @ApiOperation({
    summary: '예약 생성',
    description: '판매자가 구매자와 예약을 생성합니다. 상품이 RESERVED 상태로 자동 변경됩니다.',
  })
  @ApiResponse({ status: 201, description: '예약 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (판매 중이 아닌 상품, 자기 자신과 거래 등)' })
  @ApiResponse({ status: 403, description: '본인의 상품만 예약 처리 가능' })
  @ApiResponse({ status: 404, description: '상품 또는 구매자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 진행 중인 예약 존재' })
  create(@Body() dto: CreateReservationDto, @CurrentUser() { userId }: JwtUser) {
    return this.reservationsService.create(dto, userId)
  }

  /**
   * 내 예약 목록 조회
   */
  @Get('my')
  @ApiOperation({ summary: '내 예약 목록', description: '내가 구매자 또는 판매자로 참여한 예약 목록을 조회합니다.' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['buyer', 'seller'],
    description: '구매자/판매자 필터 (미입력 시 전체)',
  })
  @ApiResponse({ status: 200, description: '예약 목록 반환' })
  findMy(@CurrentUser() { userId }: JwtUser, @Query('role') role?: 'buyer' | 'seller') {
    return this.reservationsService.findMy(userId, role)
  }

  /**
   * 상품별 활성 예약 조회 (채팅방에서 사용)
   */
  @Get('by-product/:productId')
  @ApiOperation({
    summary: '상품별 예약 조회',
    description: '특정 상품의 현재 활성 예약을 조회합니다. 채팅방에서 거래 확인 버튼 표시 여부 판단에 사용합니다.',
  })
  @ApiParam({ name: 'productId', description: '상품 ID' })
  @ApiResponse({ status: 200, description: '예약 정보 반환 (없으면 null)' })
  findByProduct(@Param('productId') productId: string, @CurrentUser() { userId }: JwtUser) {
    return this.reservationsService.findByProduct(productId, userId)
  }

  /**
   * 예약 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '예약 상세 조회' })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '예약 상세 반환' })
  @ApiResponse({ status: 403, description: '해당 예약의 참여자가 아님' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() { userId }: JwtUser) {
    return this.reservationsService.findOne(id, userId)
  }

  /**
   * 거래 완료 확인 (판매자 전용)
   * 판매자 확인 즉시 → COMPLETED + Product→CONFIRMED
   */
  @Patch(':id/confirm')
  @ApiOperation({
    summary: '거래 완료 확인 (판매자 전용)',
    description: '판매자가 거래 완료를 확인합니다. 즉시 예약이 COMPLETED 상태가 되고 상품이 CONFIRMED로 변경됩니다.',
  })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '확인 처리 성공' })
  @ApiResponse({ status: 400, description: '이미 확인했거나 완료/취소된 예약' })
  @ApiResponse({ status: 403, description: '판매자만 확인 가능' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  confirm(@Param('id') id: string, @CurrentUser() { userId }: JwtUser) {
    return this.reservationsService.confirm(id, userId)
  }

  /**
   * 예약 취소 (판매자 전용)
   * Product.status → SELLING 복원
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: '예약 취소',
    description: '판매자가 예약을 취소합니다. 상품이 다시 SELLING 상태로 변경됩니다.',
  })
  @ApiParam({ name: 'id', description: '예약 ID' })
  @ApiResponse({ status: 200, description: '취소 처리 성공' })
  @ApiResponse({ status: 400, description: '완료되었거나 이미 취소된 예약' })
  @ApiResponse({ status: 403, description: '판매자만 취소 가능' })
  @ApiResponse({ status: 404, description: '예약을 찾을 수 없음' })
  cancel(@Param('id') id: string, @CurrentUser() { userId }: JwtUser) {
    return this.reservationsService.cancel(id, userId)
  }
}
