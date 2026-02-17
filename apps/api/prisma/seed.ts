/* eslint-disable @typescript-eslint/no-require-imports */
import { PrismaClient, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// .env 파일 로드
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 기존 데이터 삭제 (순서 중요)
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // 비밀번호 해시
  const hashedPassword = await bcrypt.hash('test1234!', 10);

  // 테스트 유저 생성
  const user1 = await prisma.user.create({
    data: {
      email: 'test@test.com',
      password: hashedPassword,
      nickname: '테스트유저',
      location: 'Duluth, GA',
      isEmailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test1',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'seller@test.com',
      password: hashedPassword,
      nickname: '판매자Kim',
      location: 'Atlanta, GA',
      isEmailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seller',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'buyer@test.com',
      password: hashedPassword,
      nickname: '구매자Park',
      location: 'Johns Creek, GA',
      isEmailVerified: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=buyer',
    },
  });

  console.log('👤 Created test users');

  // 테스트 상품 생성
  const products = await Promise.all([
    // 디지털기기
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '아이폰 15 Pro 256GB',
        description: '거의 새 제품입니다. 케이스와 함께 판매합니다. 배터리 상태 98%',
        price: 89900, // $899.00
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/iphone1/400/400', 'https://picsum.photos/seed/iphone2/400/400'],
        location: 'Atlanta, GA',
        viewCount: 42,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '맥북 프로 14인치 M3 Pro',
        description: '2024년 구매. AppleCare+ 2026년까지. 실버 색상. 충전기 포함.',
        price: 179900, // $1,799.00
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/macbook1/400/400', 'https://picsum.photos/seed/macbook2/400/400'],
        location: 'Duluth, GA',
        viewCount: 87,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '에어팟 프로 2세대',
        description: 'USB-C 버전. 케이스 포함. 구매 영수증 있음.',
        price: 18000, // $180.00
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/airpods1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 34,
      },
    }),
    // 가구/인테리어
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '이케아 책상 BEKANT',
        description: '160x80cm 화이트 책상. 사용감 있으나 상태 좋습니다.',
        price: 15000, // $150.00
        category: '가구/인테리어',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/desk1/400/400', 'https://picsum.photos/seed/desk2/400/400'],
        location: 'Duluth, GA',
        viewCount: 28,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '퀸사이즈 매트리스 (템퍼)',
        description: '2년 사용. 매트리스 커버 포함. 직접 픽업만 가능.',
        price: 50000, // $500.00
        category: '가구/인테리어',
        status: ProductStatus.RESERVED,
        images: ['https://picsum.photos/seed/mattress1/400/400'],
        location: 'Duluth, GA',
        viewCount: 45,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '북유럽 스타일 소파 3인용',
        description: '그레이 패브릭. 1년 사용. 얼룩 없음. 분리 가능.',
        price: 35000, // $350.00
        category: '가구/인테리어',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/sofa1/400/400', 'https://picsum.photos/seed/sofa2/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 62,
      },
    }),
    // 게임/취미
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '닌텐도 스위치 OLED + 게임 3개',
        description: '풀박스. 젤다, 마리오카트, 동숲 포함. 네온 컬러.',
        price: 32000, // $320.00
        category: '게임/취미',
        status: ProductStatus.RESERVED,
        images: [
          'https://picsum.photos/seed/switch1/400/400',
          'https://picsum.photos/seed/switch2/400/400',
          'https://picsum.photos/seed/switch3/400/400',
        ],
        location: 'Johns Creek, GA',
        viewCount: 156,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: 'PS5 디스크 에디션 + 듀얼센스',
        description: '박스 있음. 컨트롤러 2개. 스파이더맨2 포함.',
        price: 42000, // $420.00
        category: '게임/취미',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/ps5_1/400/400', 'https://picsum.photos/seed/ps5_2/400/400'],
        location: 'Atlanta, GA',
        viewCount: 98,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '레고 스타워즈 밀레니엄 팔콘',
        description: '미개봉 새 제품. 선물용으로 구매했다가 판매.',
        price: 85000, // $850.00
        category: '게임/취미',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/lego1/400/400'],
        location: 'Alpharetta, GA',
        viewCount: 23,
      },
    }),
    // 스포츠/레저
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '캠핑 텐트 4인용',
        description: '2회 사용. 코베아 제품. 방수 완벽.',
        price: 18000, // $180.00
        category: '스포츠/레저',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/tent1/400/400'],
        location: 'Alpharetta, GA',
        viewCount: 15,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '테일러메이드 골프 클럽 세트',
        description: 'SIM2 드라이버, 아이언 세트, 퍼터 포함. 캐디백 포함.',
        price: 120000, // $1,200.00
        category: '스포츠/레저',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/golf1/400/400', 'https://picsum.photos/seed/golf2/400/400'],
        location: 'Duluth, GA',
        viewCount: 56,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '요가 매트 + 블록 세트',
        description: '룰루레몬 요가 매트. 거의 새것. 스트랩 포함.',
        price: 5000, // $50.00
        category: '스포츠/레저',
        status: ProductStatus.SOLD,
        images: ['https://picsum.photos/seed/yoga1/400/400'],
        location: 'Atlanta, GA',
        viewCount: 12,
      },
    }),
    // 생활가전
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '다이슨 V12 무선청소기',
        description: '작년 구매. 정품 충전기 포함.',
        price: 35000, // $350.00
        category: '생활가전',
        status: ProductStatus.SOLD,
        images: ['https://picsum.photos/seed/dyson1/400/400', 'https://picsum.photos/seed/dyson2/400/400'],
        location: 'Atlanta, GA',
        viewCount: 89,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '삼성 공기청정기 큐브',
        description: '2023년형. 필터 새것으로 교체함. 리모컨 포함.',
        price: 25000, // $250.00
        category: '생활가전',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/airpurifier1/400/400'],
        location: 'Duluth, GA',
        viewCount: 33,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: 'LG 스타일러',
        description: '의류관리기. 3년 사용. 정상 작동.',
        price: 45000, // $450.00
        category: '생활가전',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/styler1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 41,
      },
    }),
    // 유아동
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '유아용 카시트 (치코)',
        description: '0-4세용. 2년 사용. 세척 완료.',
        price: 8000, // $80.00
        category: '유아동',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/carseat1/400/400'],
        location: 'Duluth, GA',
        viewCount: 22,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '유모차 부가부 폭스3',
        description: '정품. 액세서리 다수 포함. 상태 A급.',
        price: 65000, // $650.00
        category: '유아동',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/stroller1/400/400', 'https://picsum.photos/seed/stroller2/400/400'],
        location: 'Atlanta, GA',
        viewCount: 78,
      },
    }),
    // 의류
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '노스페이스 눕시 패딩 M',
        description: '블랙. 작년 구매. 몇 번 안 입음.',
        price: 18000, // $180.00
        category: '의류',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/nuptse1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 67,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '나이키 덩크 로우 270mm',
        description: '팬다 컬러. 3회 착용. 박스 있음.',
        price: 12000, // $120.00
        category: '의류',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/dunk1/400/400', 'https://picsum.photos/seed/dunk2/400/400'],
        location: 'Duluth, GA',
        viewCount: 54,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '룰루레몬 레깅스 S',
        description: '검정색. 미착용 새 제품. 태그 있음.',
        price: 6500, // $65.00
        category: '의류',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/leggings1/400/400'],
        location: 'Atlanta, GA',
        viewCount: 29,
      },
    }),
    // 도서
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '해리포터 전집 (영문판)',
        description: '하드커버 7권 세트. 상태 좋음.',
        price: 4500, // $45.00
        category: '도서',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/harrypotter1/400/400'],
        location: 'Duluth, GA',
        viewCount: 18,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: 'TOEFL 교재 세트',
        description: 'ETS 공식 가이드 + 기출문제집 3권.',
        price: 3500, // $35.00
        category: '도서',
        status: ProductStatus.SOLD,
        images: ['https://picsum.photos/seed/toefl1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 9,
      },
    }),
    // 뷰티/미용
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '다이슨 에어랩 컴플리트',
        description: '풀세트. 1년 사용. 모든 어태치먼트 포함.',
        price: 42000, // $420.00
        category: '뷰티/미용',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/airwrap1/400/400', 'https://picsum.photos/seed/airwrap2/400/400'],
        location: 'Atlanta, GA',
        viewCount: 134,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: 'SK-II 피테라 에센스 230ml',
        description: '미개봉. 선물 받았는데 사용 안 해서 판매.',
        price: 18000, // $180.00
        category: '뷰티/미용',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/skii1/400/400'],
        location: 'Duluth, GA',
        viewCount: 47,
      },
    }),
    // 생활/주방
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '발뮤다 토스터기',
        description: '화이트. 6개월 사용. 박스 있음.',
        price: 15000, // $150.00
        category: '생활/주방',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/balmuda1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 38,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '쿠쿠 10인용 압력밥솥',
        description: '2024년 모델. 내솥 새것. 매뉴얼 있음.',
        price: 22000, // $220.00
        category: '생활/주방',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/cuckoo1/400/400'],
        location: 'Atlanta, GA',
        viewCount: 51,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '르크루제 냄비 세트',
        description: '체리 레드. 24cm, 20cm 2개 세트.',
        price: 35000, // $350.00
        category: '생활/주방',
        status: ProductStatus.RESERVED,
        images: ['https://picsum.photos/seed/lecreuset1/400/400', 'https://picsum.photos/seed/lecreuset2/400/400'],
        location: 'Duluth, GA',
        viewCount: 73,
      },
    }),
    // 반려동물용품
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '대형견 케이지',
        description: '접이식. 42인치. 청소 완료.',
        price: 8000, // $80.00
        category: '반려동물용품',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/dogcage1/400/400'],
        location: 'Atlanta, GA',
        viewCount: 16,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '고양이 캣타워 대형',
        description: '180cm. 6개월 사용. 직접 픽업만.',
        price: 7000, // $70.00
        category: '반려동물용품',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/cattower1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 24,
      },
    }),
    // 기타
    prisma.product.create({
      data: {
        sellerId: user1.id,
        title: '삼성 갤럭시 워치6 44mm',
        description: '실버. 정품 스트랩 2개 포함. 충전기 있음.',
        price: 22000, // $220.00
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/watch1/400/400', 'https://picsum.photos/seed/watch2/400/400'],
        location: 'Duluth, GA',
        viewCount: 39,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user2.id,
        title: '무선 키보드 마우스 세트',
        description: '로지텍 MX Keys + MX Master 3. 업무용 최고.',
        price: 15000, // $150.00
        category: '디지털기기',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/keyboard1/400/400'],
        location: 'Atlanta, GA',
        viewCount: 27,
      },
    }),
    prisma.product.create({
      data: {
        sellerId: user3.id,
        title: '크리스마스 트리 7ft',
        description: '인조 트리. LED 조명 포함. 장식품 별도.',
        price: 6000, // $60.00
        category: '기타',
        status: ProductStatus.SELLING,
        images: ['https://picsum.photos/seed/tree1/400/400'],
        location: 'Johns Creek, GA',
        viewCount: 8,
      },
    }),
  ]);

  console.log(`📦 Created ${products.length} test products`);

  // 찜 데이터 생성 (다양한 상품에 찜 추가)
  await prisma.favorite.createMany({
    data: [
      // user1 (테스트유저)의 찜 목록
      { userId: user1.id, productId: products[0]!.id }, // 아이폰 15 Pro
      { userId: user1.id, productId: products[7]!.id }, // PS5
      { userId: user1.id, productId: products[9]!.id }, // 캠핑 텐트
      { userId: user1.id, productId: products[23]!.id }, // 다이슨 에어랩
      // user2 (판매자Kim)의 찜 목록
      { userId: user2.id, productId: products[1]!.id }, // 맥북 프로
      { userId: user2.id, productId: products[4]!.id }, // 퀸사이즈 매트리스
      { userId: user2.id, productId: products[10]!.id }, // 골프 클럽
      { userId: user2.id, productId: products[17]!.id }, // 노스페이스 눕시
      // user3 (구매자Park)의 찜 목록
      { userId: user3.id, productId: products[0]!.id }, // 아이폰 15 Pro
      { userId: user3.id, productId: products[1]!.id }, // 맥북 프로
      { userId: user3.id, productId: products[6]!.id }, // 닌텐도 스위치
      { userId: user3.id, productId: products[15]!.id }, // 유모차
      { userId: user3.id, productId: products[26]!.id }, // 쿠쿠 압력밥솥
    ],
  });

  console.log('❤️  Created favorite data');

  // 채팅방 1: 아이폰 관련 (buyer -> seller)
  const chatRoom1 = await prisma.chatRoom.create({
    data: {
      productId: products[0]!.id, // 아이폰 15 Pro
      buyerId: user3.id,
      sellerId: user2.id,
      lastMessage: '직거래 가능하신가요? 애틀랜타 쪽에서 만나면 좋겠어요.',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatRoomId: chatRoom1.id,
        senderId: user3.id,
        content: '안녕하세요, 아이폰 아직 판매 중인가요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom1.id,
        senderId: user2.id,
        content: '네, 아직 판매 중입니다!',
        isRead: true,
      },
      {
        chatRoomId: chatRoom1.id,
        senderId: user3.id,
        content: '직거래 가능하신가요? 애틀랜타 쪽에서 만나면 좋겠어요.',
        isRead: false,
      },
    ],
  });

  // 채팅방 2: 맥북 관련 (buyer -> test)
  const chatRoom2 = await prisma.chatRoom.create({
    data: {
      productId: products[1]!.id, // 맥북 프로
      buyerId: user2.id,
      sellerId: user1.id,
      lastMessage: '네, 내일 오후 2시에 Duluth H-Mart 앞에서 만나요!',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatRoomId: chatRoom2.id,
        senderId: user2.id,
        content: '맥북 상태가 어떤가요? 스크래치 있나요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom2.id,
        senderId: user1.id,
        content: '스크래치 전혀 없습니다. 항상 케이스 끼워서 사용했어요.',
        isRead: true,
      },
      {
        chatRoomId: chatRoom2.id,
        senderId: user2.id,
        content: '좋습니다! 이번 주말에 직거래 가능하신가요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom2.id,
        senderId: user1.id,
        content: '네, 내일 오후 2시에 Duluth H-Mart 앞에서 만나요!',
        isRead: true,
      },
    ],
  });

  // 채팅방 3: PS5 관련 (test -> seller)
  const chatRoom3 = await prisma.chatRoom.create({
    data: {
      productId: products[7]!.id, // PS5
      buyerId: user1.id,
      sellerId: user2.id,
      lastMessage: '혹시 가격 네고 가능하신가요?',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatRoomId: chatRoom3.id,
        senderId: user1.id,
        content: '안녕하세요! PS5 아직 판매 중인가요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom3.id,
        senderId: user2.id,
        content: '네, 판매 중입니다.',
        isRead: true,
      },
      {
        chatRoomId: chatRoom3.id,
        senderId: user1.id,
        content: '혹시 가격 네고 가능하신가요?',
        isRead: false,
      },
    ],
  });

  // 채팅방 4: 골프 클럽 관련 (buyer -> test)
  const chatRoom4 = await prisma.chatRoom.create({
    data: {
      productId: products[10]!.id, // 골프 클럽
      buyerId: user3.id,
      sellerId: user1.id,
      lastMessage: '좋아요! 연락처 알려주시면 제가 연락드릴게요.',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        chatRoomId: chatRoom4.id,
        senderId: user3.id,
        content: '골프 클럽 아직 있나요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom4.id,
        senderId: user1.id,
        content: '네, 있습니다! 관심 감사해요.',
        isRead: true,
      },
      {
        chatRoomId: chatRoom4.id,
        senderId: user3.id,
        content: '혹시 시타해볼 수 있을까요?',
        isRead: true,
      },
      {
        chatRoomId: chatRoom4.id,
        senderId: user1.id,
        content: '좋아요! 연락처 알려주시면 제가 연락드릴게요.',
        isRead: false,
      },
    ],
  });

  console.log('💬 Created chat data (4 chat rooms)');

  console.log('✅ Seeding completed!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('  Email: test@test.com / Password: test1234!');
  console.log('  Email: seller@test.com / Password: test1234!');
  console.log('  Email: buyer@test.com / Password: test1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
