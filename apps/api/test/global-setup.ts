import { execSync } from 'child_process';

export default () => {
  console.log('\n🔧 Setting up E2E test environment...\n');

  // 테스트 DB URL 하드코딩
  const testDbUrl = 'postgresql://peachmarket:peachmarket123@localhost:5433/peachmarket_test';

  console.log(`📦 Test Database: ${testDbUrl}`);

  try {
    // Prisma db push를 사용해서 테스트 DB 생성 + 스키마 적용
    console.log('🔨 Creating test database and applying schema...');

    execSync('pnpm prisma db push --accept-data-loss', {
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: testDbUrl,
      },
    });

    console.log('✅ Test database ready!\n');
  } catch {
    console.error('❌ Failed to setup test database');
  }
};
