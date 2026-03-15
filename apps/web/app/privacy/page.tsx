import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '개인정보처리방침 | 피치마켓',
  description: '피치마켓 개인정보처리방침입니다.',
}

const PrivacyPage = () => {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/peach_logo_transparent.png" alt="피치마켓" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold text-primary">피치마켓</span>
          </Link>
          <Link href="/about">
            <Button variant="ghost" size="sm">
              서비스 소개
            </Button>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto prose prose-neutral">
          <h1 className="text-2xl font-bold text-foreground mb-2">개인정보처리방침</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2026년 3월 15일</p>

          <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">1. 수집하는 개인정보 항목</h2>
              <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  <strong className="text-foreground">필수 항목:</strong> 이메일 주소, 비밀번호(암호화 저장), 닉네임,
                  거주 지역
                </li>
                <li>
                  <strong className="text-foreground">선택 항목:</strong> 프로필 사진
                </li>
                <li>
                  <strong className="text-foreground">자동 수집:</strong> 접속 IP, 접속 시간, 기기 정보, 위치 정보(동의
                  시)
                </li>
                <li>
                  <strong className="text-foreground">Google OAuth 이용 시:</strong> Google 계정 이메일, 프로필 이름
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 가입 및 본인 확인</li>
                <li>중고거래 서비스 제공 (게시물 등록, 검색, 채팅)</li>
                <li>부정 이용 방지 및 신고/차단 기능 운영</li>
                <li>서비스 개선 및 통계 분석</li>
                <li>공지사항 및 서비스 관련 알림 전달</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">3. 개인정보의 보유 및 이용 기간</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.</li>
                <li>단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.</li>
                <li>부정 이용 방지를 위해 탈퇴 후 30일간 이메일 주소를 보관할 수 있습니다.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">4. 개인정보의 제3자 제공</h2>
              <p>
                회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법률에 의거하여 수사 목적으로 법적 절차에 따라 요청이 있는 경우</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">5. 개인정보의 안전성 확보 조치</h2>
              <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취합니다:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>비밀번호 암호화 (bcrypt)</li>
                <li>SSL/TLS를 통한 데이터 전송 암호화</li>
                <li>JWT 토큰 기반 인증 및 httpOnly 쿠키 사용</li>
                <li>접근 권한 관리 및 접근 기록 보관</li>
                <li>정기적인 보안 점검</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">6. 이용자의 권리와 행사 방법</h2>
              <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>개인정보 열람, 수정, 삭제 요청</li>
                <li>회원 탈퇴를 통한 개인정보 처리 정지</li>
                <li>위치 정보 수집 동의 철회</li>
                <li>푸시 알림 수신 동의 철회</li>
              </ul>
              <p className="mt-2">마이페이지에서 직접 처리하거나, 고객 지원을 통해 요청할 수 있습니다.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">7. 쿠키 및 분석 도구 사용</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>서비스 이용 편의를 위해 쿠키를 사용합니다.</li>
                <li>서비스 개선을 위해 익명화된 이용 통계를 수집합니다.</li>
                <li>브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">8. 개인정보 보호 책임자</h2>
              <p>개인정보 처리에 관한 문의는 아래 연락처로 문의해 주세요.</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>담당: 피치마켓 개인정보 보호팀</li>
                <li>이메일: peachmarket215@gmail.com</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">9. 방침 변경에 관한 사항</h2>
              <p>
                이 개인정보처리방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지를 통해
                안내합니다.
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-8 px-6 border-t border-border">
        <p className="text-center text-xs text-muted-foreground">© 2026 PeachMarket</p>
      </footer>
    </div>
  )
}

export default PrivacyPage
