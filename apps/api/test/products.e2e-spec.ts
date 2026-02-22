import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/core/database/prisma.service';
import { ResendService } from '../src/modules/auth/resend.service';
import { ErrorResponse } from './test-response.types';

type ProductResponse = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  images: string[];
  location: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    mannerScore: number;
  };
};

const TEST_PASSWORD = 'password123';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let testUserId: string;
  let cookies: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResendService)
      .useValue({
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    app.use(cookieParser());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.favorite.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.review.deleteMany();
    await prisma.product.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // 테스트용 판매자 생성 (이메일 인증 완료 상태)
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: 'seller@example.com',
        password: hashedPassword,
        nickname: 'seller',
        location: 'Duluth',
        isEmailVerified: true,
      },
    });
    testUserId = user.id;

    // 로그인하여 쿠키 획득
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'seller@example.com', password: TEST_PASSWORD });
    cookies = loginRes.headers['set-cookie'] as unknown as string[];
  });

  describe('POST /api/products', () => {
    it('상품 등록 성공', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          title: '아이폰 15 프로',
          description: '상태 좋습니다.',
          price: 500,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as ProductResponse;
          expect(body.id).toBeDefined();
          expect(body.title).toBe('아이폰 15 프로');
          expect(body.description).toBe('상태 좋습니다.');
          expect(body.price).toBe(500);
          expect(body.category).toBe('전자기기');
          expect(body.location).toBe('Duluth');
          expect(body.status).toBe('SELLING');
          expect(body.viewCount).toBe(0);
          expect(body.images).toEqual([]);
          expect(body.seller).toBeDefined();
          expect(body.seller.nickname).toBe('seller');
          expect(body.sellerId).toBe(testUserId);
        });
    });

    it('로그인 없이 등록 시 401 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({
          title: '아이폰 15 프로',
          description: '상태 좋습니다.',
          price: 500,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(401);
    });

    it('제목 없이 등록 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          description: '상태 좋습니다.',
          price: 500,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(400);
    });

    it('가격이 음수일 때 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          title: '아이폰 15 프로',
          description: '상태 좋습니다.',
          price: -100,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(400);
    });

    it('가격이 소수일 때 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          title: '아이폰 15 프로',
          description: '상태 좋습니다.',
          price: 99.99,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(400);
    });

    it('제목이 50자 초과 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          title: 'a'.repeat(51),
          description: '상태 좋습니다.',
          price: 500,
          category: '전자기기',
          location: 'Duluth',
        })
        .expect(400);
    });

    it('DTO에 없는 필드 포함 시 400 에러', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .set('Cookie', cookies)
        .send({
          title: '아이폰 15 프로',
          description: '상태 좋습니다.',
          price: 500,
          category: '전자기기',
          location: 'Duluth',
          unknownField: 'hack',
        })
        .expect(400);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await prisma.product.createMany({
        data: [
          {
            sellerId: testUserId,
            title: '맥북 프로 M3',
            description: '최신 모델',
            price: 2000,
            category: '전자기기',
            location: 'Atlanta',
            images: [],
          },
          {
            sellerId: testUserId,
            title: '소파 팝니다',
            description: '3인용 소파',
            price: 300,
            category: '가구',
            location: 'Duluth',
            images: [],
          },
          {
            sellerId: testUserId,
            title: '아이패드 에어',
            description: '애플 태블릿',
            price: 400,
            category: '전자기기',
            location: 'Duluth',
            images: [],
          },
        ],
      });
    });

    it('전체 상품 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(3);
          expect(body[0].seller).toBeDefined();
        });
    });

    it('검색어로 필터링', () => {
      return request(app.getHttpServer())
        .get('/api/products?search=맥북')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(1);
          expect(body[0].title).toBe('맥북 프로 M3');
        });
    });

    it('카테고리로 필터링', () => {
      return request(app.getHttpServer())
        .get('/api/products?category=전자기기')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(2);
          body.forEach((p) => expect(p.category).toBe('전자기기'));
        });
    });

    it('가격 오름차순 정렬', () => {
      return request(app.getHttpServer())
        .get('/api/products?sort=price_asc')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body[0].price).toBe(300);
          expect(body[1].price).toBe(400);
          expect(body[2].price).toBe(2000);
        });
    });

    it('가격 내림차순 정렬', () => {
      return request(app.getHttpServer())
        .get('/api/products?sort=price_desc')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body[0].price).toBe(2000);
          expect(body[1].price).toBe(400);
          expect(body[2].price).toBe(300);
        });
    });

    it('검색 + 카테고리 복합 필터', () => {
      return request(app.getHttpServer())
        .get('/api/products?search=아이패드&category=전자기기')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(1);
          expect(body[0].title).toBe('아이패드 에어');
        });
    });

    it('결과 없는 검색', () => {
      return request(app.getHttpServer())
        .get('/api/products?search=존재하지않는상품')
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(0);
        });
    });
  });

  describe('GET /api/products/my', () => {
    it('내 상품 목록 조회 성공', async () => {
      // 내 상품 2개 등록
      await prisma.product.createMany({
        data: [
          {
            sellerId: testUserId,
            title: '내 상품 1',
            description: '설명 1',
            price: 100,
            category: '기타',
            location: 'Duluth',
            images: [],
          },
          {
            sellerId: testUserId,
            title: '내 상품 2',
            description: '설명 2',
            price: 200,
            category: '전자기기',
            location: 'Atlanta',
            images: [],
          },
        ],
      });

      // 다른 사용자의 상품 1개 등록
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: 'hashedpassword',
          nickname: 'otheruser',
          location: 'Atlanta',
        },
      });
      await prisma.product.create({
        data: {
          sellerId: otherUser.id,
          title: '남의 상품',
          description: '남의 설명',
          price: 999,
          category: '기타',
          location: 'Atlanta',
          images: [],
        },
      });

      return request(app.getHttpServer())
        .get('/api/products/my')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(2);
          body.forEach((p) => expect(p.sellerId).toBe(testUserId));
        });
    });

    it('등록한 상품이 없을 때 빈 배열 반환', () => {
      return request(app.getHttpServer())
        .get('/api/products/my')
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse[];
          expect(body).toHaveLength(0);
        });
    });

    it('로그인 없이 조회 시 401 에러', () => {
      return request(app.getHttpServer()).get('/api/products/my').expect(401);
    });
  });

  describe('GET /api/products/:id', () => {
    it('상품 상세 조회 성공', async () => {
      const product = await prisma.product.create({
        data: {
          sellerId: testUserId,
          title: '테스트 상품',
          description: '테스트 설명',
          price: 100,
          category: '기타',
          location: 'Duluth',
          images: [],
        },
      });

      return request(app.getHttpServer())
        .get(`/api/products/${product.id}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ProductResponse;
          expect(body.id).toBe(product.id);
          expect(body.title).toBe('테스트 상품');
          expect(body.seller.nickname).toBe('seller');
        });
    });

    it('존재하지 않는 상품 조회 시 404 에러', () => {
      return request(app.getHttpServer())
        .get('/api/products/nonexistent-id')
        .expect(404)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('not found');
        });
    });

    it('조회수 증가 확인', async () => {
      const product = await prisma.product.create({
        data: {
          sellerId: testUserId,
          title: '조회수 테스트',
          description: '조회수 테스트',
          price: 100,
          category: '기타',
          location: 'Duluth',
          images: [],
        },
      });

      const res = await request(app.getHttpServer()).get(`/api/products/${product.id}`).expect(200);

      const body = res.body as ProductResponse;
      expect(body.viewCount).toBe(1);
    });

    it('같은 IP 중복 조회 시 조회수 미증가', async () => {
      const product = await prisma.product.create({
        data: {
          sellerId: testUserId,
          title: '중복 조회 테스트',
          description: '중복 조회 테스트',
          price: 100,
          category: '기타',
          location: 'Duluth',
          images: [],
        },
      });

      // 첫 번째 조회
      await request(app.getHttpServer()).get(`/api/products/${product.id}`).expect(200);

      // 두 번째 조회 (같은 IP)
      const res = await request(app.getHttpServer()).get(`/api/products/${product.id}`).expect(200);

      const body = res.body as ProductResponse;
      expect(body.viewCount).toBe(1);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('본인 상품 삭제 성공', async () => {
      const product = await prisma.product.create({
        data: {
          sellerId: testUserId,
          title: '삭제할 상품',
          description: '삭제 테스트',
          price: 100,
          category: '기타',
          location: 'Duluth',
          images: [],
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/products/${product.id}`)
        .set('Cookie', cookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toContain('삭제');
        });

      // 삭제 후 조회 시 404
      await request(app.getHttpServer()).get(`/api/products/${product.id}`).expect(404);
    });

    it('다른 사용자의 상품 삭제 시 403 에러', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other2@example.com',
          password: 'hashedpassword',
          nickname: 'otheruser2',
          location: 'Atlanta',
        },
      });

      const product = await prisma.product.create({
        data: {
          sellerId: otherUser.id,
          title: '남의 상품',
          description: '남의 설명',
          price: 500,
          category: '기타',
          location: 'Atlanta',
          images: [],
        },
      });

      await request(app.getHttpServer()).delete(`/api/products/${product.id}`).set('Cookie', cookies).expect(403);
    });

    it('존재하지 않는 상품 삭제 시 404 에러', () => {
      return request(app.getHttpServer()).delete('/api/products/nonexistent-id').set('Cookie', cookies).expect(404);
    });

    it('로그인 없이 삭제 시 401 에러', async () => {
      const product = await prisma.product.create({
        data: {
          sellerId: testUserId,
          title: '인증 테스트',
          description: '인증 테스트',
          price: 100,
          category: '기타',
          location: 'Duluth',
          images: [],
        },
      });

      await request(app.getHttpServer()).delete(`/api/products/${product.id}`).expect(401);
    });
  });
});
