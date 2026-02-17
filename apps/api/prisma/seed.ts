import { PrismaClient, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (process.env.NODE_ENV === 'production') {
  console.error('🚫 Seed는 개발 환경에서만 실행할 수 있습니다.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 기존 데이터 정리 (외래 키 순서 준수)
  await prisma.message.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 테스트 유저 생성
  const user1 = await prisma.user.create({
    data: {
      email: 'test1@peachmarket.com',
      password: '$2b$10$dummyhashedpassword1234567890abc',
      nickname: '복숭아맘',
      location: 'Duluth, GA',
      mannerScore: 4.5,
      isEmailVerified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'test2@peachmarket.com',
      password: '$2b$10$dummyhashedpassword1234567890xyz',
      nickname: '조지아피치',
      location: 'Suwanee, GA',
      mannerScore: 4.8,
      isEmailVerified: true,
    },
  });

  // 테스트 상품 생성
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '아이패드 프로 11인치 (M2)',
        description: '작년에 구매한 아이패드 프로입니다. 스크래치 없이 깨끗하게 사용했습니다. 애플펜슬 2세대 포함.',
        price: 650,
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://placehold.co/600x400?text=iPad+Pro+1', 'https://placehold.co/600x400?text=iPad+Pro+2'],
        location: 'Duluth, GA',
        viewCount: 42,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '다이슨 V15 무선청소기',
        description: '6개월 사용. 흡입력 좋고 배터리 상태 양호합니다. 박스, 부속품 전부 있습니다.',
        price: 350,
        category: '생활가전',
        status: ProductStatus.SELLING,
        images: ['https://placehold.co/600x400?text=Dyson+V15'],
        location: 'Duluth, GA',
        viewCount: 15,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '삼성 오디세이 G7 32인치 모니터',
        description: '게이밍 모니터 판매합니다. 240Hz, 1ms 응답속도. 데드픽셀 없습니다.',
        price: 280,
        category: '디지털기기',
        status: ProductStatus.RESERVED,
        images: [
          'https://placehold.co/600x400?text=Samsung+G7+1',
          'https://placehold.co/600x400?text=Samsung+G7+2',
          'https://placehold.co/600x400?text=Samsung+G7+3',
        ],
        location: 'Suwanee, GA',
        viewCount: 78,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '한국 교과서 세트 (초등 3학년)',
        description: '한국 교과서 풀세트입니다. 깨끗하게 사용했고 연필 자국 조금 있습니다.',
        price: 50,
        category: '도서',
        status: ProductStatus.SOLD,
        images: ['https://placehold.co/600x400?text=Korean+Textbooks'],
        location: 'Johns Creek, GA',
        viewCount: 120,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '코스트코 김치냉장고 (딤채)',
        description: '이사로 인해 급처합니다. 2년 사용, 상태 아주 좋습니다. 직접 픽업만 가능.',
        price: 400,
        category: '생활가전',
        status: ProductStatus.SELLING,
        images: [
          'https://placehold.co/600x400?text=Kimchi+Fridge+1',
          'https://placehold.co/600x400?text=Kimchi+Fridge+2',
        ],
        location: 'Duluth, GA',
        viewCount: 55,
      },
    }),
  ]);

  console.log(`Seeded ${products.length} products`);
  console.log(`Users: ${user1.nickname}, ${user2.nickname}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
