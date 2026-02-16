#!/bin/bash
set -e

# ========================================
# Swagger/OpenAPI to TypeScript Type Generator
# ========================================
#
# 사용법:
#   pnpm swagger-to-type --url "<swagger_url>" [-o <output_path>]
#
# 예시:
#   pnpm swagger-to-type --url "http://localhost:3003/api/docs-json" -o ./apps/web/src/types/api.ts
#   pnpm swagger-to-type --url "https://api.peachmarket.com/api/docs-json" -o ./apps/web/src/types/api.ts
#
# 옵션:
#   --url       : Swagger JSON URL (필수)
#   --output, -o: 출력 파일 경로 (기본값: ./src/models/backend/index.ts)
#
# 주의사항:
#   - 백엔드 API 서버가 실행 중이어야 합니다
#   - 인증이 필요한 경우 스크립트 내부의 Basic Auth 설정을 확인하세요
# ========================================

# 옵션 파싱: --url 또는 --url=<value> 형태를 지원
url=""
output="./src/models/backend/index.ts"

while [[ "$#" -gt 0 ]]; do
    case "$1" in
        --url)
            url="$2"
            shift 2
            ;;
        --url=*)
            url="${1#*=}"
            shift
            ;;
        --output|-o)
            output="$2"
            shift 2
            ;;
        --output=*)
            output="${1#*=}"
            shift
            ;;
        -o=*)
            output="${1#*=}"
            shift
            ;;
        *)
            echo "알 수 없는 옵션: $1"
            exit 1
            ;;
    esac
done

if [ -z "$url" ]; then
    echo "Usage: $0 --url <swagger_url> [--output <output_path>]"
    echo "  --url     : Swagger JSON URL (required)"
    echo "  --output  : Output file path (default: ./src/models/backend/index.ts)"
    exit 1
fi

# 디렉토리 생성 (존재해도 OK)
mkdir -p ./.swagger/temp

# swagger.json 다운로드
echo "👉 swagger.json 다운로드 중: $url"
if ! curl -s \
  "$url" \
  -o ./.swagger/temp/swagger.json; then
    echo "❌ URL에서 swagger.json 다운로드 실패"
    exit 1
fi

# TypeScript 타입 생성
npx swagger-typescript-api@13.1.3 generate \
    -p ./.swagger/temp/swagger.json \
    -o ./.swagger/temp \
    -n index.type.ts \
    --generate-union-enums \
    --no-client

# 첫 2줄 제거(macOS/Linux 호환)
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '1,2d' ./.swagger/temp/index.type.ts
else
    sed -i '1,2d' ./.swagger/temp/index.type.ts
fi

# 코멘트 제거 스크립트 실행
TARGET="./.swagger/temp/index.type.ts"

if [ ! -f "$TARGET" ]; then
  echo "❌ 파일을 찾을 수 없음: $TARGET"
  exit 1
fi

# 맨 위 한 줄 제거
sed '1d' "$TARGET" > "${TARGET}.clean"

mv "${TARGET}.clean" "$TARGET"

echo "✨ 맨 위 한 줄 제거 완료"

# 출력 디렉토리 생성
output_dir=$(dirname "$output")
mkdir -p "$output_dir"

# 최종 파일 복사
cp ./.swagger/temp/index.type.ts "$output"

# temp 삭제
rm -rf ./.swagger/temp

echo "✅ Swagger 타입 생성 완료 → $output"
