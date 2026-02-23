// E2E 테스트 환경 설정
process.env.NODE_ENV = 'test'

// 테스트용 환경변수 하드코딩
process.env.DATABASE_URL = 'postgresql://peachmarket:peachmarket123@localhost:5433/peachmarket_test'
process.env.JWT_SECRET = 'test-jwt-secret-for-e2e'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3003/api/auth/google/callback'
process.env.RESEND_API_KEY = '' // 빈 문자열이면 ResendService가 로그만 출력
process.env.FRONTEND_URL = 'http://localhost:3000'

console.log('✅ E2E Test environment configured')
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`)
console.log(`   NODE_ENV: ${process.env.NODE_ENV}\n`)
