import { Injectable, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma.service'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async findByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const user = await this.findByEmail(email)
    return !user // true면 사용 가능
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const user = await this.findByNickname(nickname)
    return !user // true면 사용 가능
  }

  async completeProfile(userId: string, dto: { nickname: string; location: string }) {
    const existingUser = await this.findByNickname(dto.nickname)
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('이미 사용 중인 닉네임입니다')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        location: dto.location,
        isProfileComplete: true,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = updatedUser
    return result
  }

  async updateProfile(userId: string, updateDto: UpdateUserDto) {
    // 닉네임 변경 시 중복 체크
    if (updateDto.nickname) {
      const existingUser = await this.findByNickname(updateDto.nickname)
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('이미 사용 중인 닉네임입니다')
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
    })

    // 비밀번호 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = updatedUser
    return result
  }
}
