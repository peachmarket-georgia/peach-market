import { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공하여 jest.config에 로드할 위치를 지정합니다
  dir: './',
})

// Jest에 전달할 사용자 정의 구성
const customJestConfig: Config = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // alias 설정 지원
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// nextJest가 모든 Next.js 구성을 비동기로 로드할 수 있도록 export default
export default createJestConfig(customJestConfig)
