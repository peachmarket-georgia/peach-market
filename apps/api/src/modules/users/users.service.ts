import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !user; // true면 사용 가능
  }

  async checkNicknameAvailability(nickname: string): Promise<boolean> {
    const user = await this.findByNickname(nickname);
    return !user; // true면 사용 가능
  }
}
