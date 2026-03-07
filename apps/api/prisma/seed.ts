import { PrismaClient, ProductStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

const TEST_PASSWORD = 'peach1234!'

if (process.env.NODE_ENV === 'production') {
  console.error('🚫 Seed는 개발 환경에서만 실행할 수 있습니다.')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // 기존 데이터 정리 (외래 키 순서 준수)
  await prisma.message.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.chatRoom.deleteMany()
  await prisma.review.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.product.deleteMany()
  await prisma.emailVerification.deleteMany()
  await prisma.passwordReset.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10)

  // 테스트 유저 생성
  const user1 = await prisma.user.create({
    data: {
      email: 'test1@peachmarket.com',
      password: hashedPassword,
      nickname: '판매자',
      location: 'Duluth, GA',
      mannerScore: 4.5,
      isEmailVerified: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'test2@peachmarket.com',
      password: hashedPassword,
      nickname: '구매자',
      location: 'Suwanee, GA',
      mannerScore: 4.8,
      isEmailVerified: true,
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'test3@peachmarket.com',
      password: hashedPassword,
      nickname: '이메일테스트',
      location: 'Suwanee, GA',
      mannerScore: 4.8,
      isEmailVerified: false,
    },
  })

  // 테스트 상품 생성
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '아이패드 프로 11인치 (M2)',
        description: '작년에 구매한 아이패드 프로입니다. 스크래치 없이 깨끗하게 사용했습니다. 애플펜슬 2세대 포함.',
        price: 650,
        category: '전자기기',
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
        category: '생활용품',
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
        category: '전자기기',
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
        category: '기타',
        status: ProductStatus.ENDED,
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
        category: '생활용품',
        status: ProductStatus.CONFIRMED,
        images: [
          'https://placehold.co/600x400?text=Kimchi+Fridge+1',
          'https://placehold.co/600x400?text=Kimchi+Fridge+2',
        ],
        location: 'Duluth, GA',
        viewCount: 55,
      },
    }),
  ])

  // 채팅방 생성 (구매자 → 판매자)
  const chatRoom1 = await prisma.chatRoom.create({
    data: {
      productId: products[0].id, // 아이패드 프로
      buyerId: user2.id,
      sellerId: user1.id,
      lastMessage: '직거래 가능한가요?',
    },
  })

  const chatRoom2 = await prisma.chatRoom.create({
    data: {
      productId: products[1].id, // 다이슨 청소기
      buyerId: user2.id,
      sellerId: user1.id,
      lastMessage: '네, 괜찮습니다!',
    },
  })

  // 채팅방 1 메시지
  const now = new Date()
  const messages1 = [
    { senderId: user2.id, content: '안녕하세요! 아이패드 아직 판매 중인가요?', minutesAgo: 60 },
    { senderId: user1.id, content: '네, 판매 중입니다 😊', minutesAgo: 58 },
    { senderId: user2.id, content: '상태가 어떤가요? 스크래치는 없나요?', minutesAgo: 55 },
    {
      senderId: user1.id,
      content: '스크래치 전혀 없고 케이스 끼고 사용해서 깨끗합니다. 애플펜슬도 포함이에요.',
      minutesAgo: 53,
    },
    { senderId: user2.id, content: '가격 조금 네고 가능할까요? $600에 해주시면 바로 살게요!', minutesAgo: 50 },
    { senderId: user1.id, content: '$630까지는 가능합니다. 박스도 있고 상태 진짜 좋아요.', minutesAgo: 48 },
    { senderId: user2.id, content: '음... $620에 해주시면 오늘 바로 픽업 갈게요!', minutesAgo: 45 },
    { senderId: user1.id, content: '좋아요, $620에 드릴게요. 어디서 픽업하시겠어요?', minutesAgo: 43 },
    { senderId: user2.id, content: 'Duluth H마트 근처에서 만날 수 있을까요?', minutesAgo: 40 },
    { senderId: user1.id, content: '네 거기서 만나요. 언제가 편하세요?', minutesAgo: 38 },
    { senderId: user2.id, content: '내일 오후 2시 어떠세요?', minutesAgo: 35 },
    { senderId: user1.id, content: '내일 2시 좋습니다! 그때 봬요 😄', minutesAgo: 33 },
    { senderId: user2.id, content: '직거래 가능한가요?', minutesAgo: 5 },
  ]

  await Promise.all(
    messages1.map(({ senderId, content, minutesAgo }) =>
      prisma.message.create({
        data: {
          chatRoomId: chatRoom1.id,
          senderId,
          content,
          isRead: minutesAgo > 10,
          createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
        },
      })
    )
  )

  // 채팅방 2 메시지
  const messages2 = [
    { senderId: user2.id, content: '다이슨 청소기 관심 있어요! 흡입력 아직 좋나요?', minutesAgo: 120 },
    { senderId: user1.id, content: '네! 필터 청소 주기적으로 했고 흡입력 완전 좋아요.', minutesAgo: 115 },
    { senderId: user2.id, content: '배터리는 몇 분 정도 가나요?', minutesAgo: 110 },
    { senderId: user1.id, content: '최대 파워 기준 20분, 일반 모드는 40분 이상 갑니다.', minutesAgo: 108 },
    { senderId: user2.id, content: '$300에 가능할까요?', minutesAgo: 100 },
    { senderId: user1.id, content: '$330이 최선입니다. 부속품 다 있고 정말 깨끗해요.', minutesAgo: 95 },
    { senderId: user2.id, content: '네 $330에 살게요. 픽업은 어디서 하면 될까요?', minutesAgo: 90 },
    { senderId: user1.id, content: 'Duluth 쪽으로 오시면 됩니다. 주소 DM으로 드릴게요.', minutesAgo: 85 },
    { senderId: user2.id, content: '감사합니다! 이번 주 토요일 가능할까요?', minutesAgo: 30 },
    { senderId: user1.id, content: '네, 괜찮습니다!', minutesAgo: 2 },
  ]

  await Promise.all(
    messages2.map(({ senderId, content, minutesAgo }) =>
      prisma.message.create({
        data: {
          chatRoomId: chatRoom2.id,
          senderId,
          content,
          isRead: true,
          createdAt: new Date(now.getTime() - minutesAgo * 60 * 1000),
        },
      })
    )
  )

  console.log(`Seeded ${products.length} products`)
  console.log(`Seeded 2 chat rooms with ${messages1.length + messages2.length} messages`)
  console.log(`Users: ${user1.nickname}, ${user2.nickname}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
