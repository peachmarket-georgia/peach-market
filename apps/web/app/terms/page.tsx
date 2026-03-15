import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '이용약관 | 피치마켓',
  description: '피치마켓 서비스 이용약관입니다.',
}

const TermsPage = () => {
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
          <h1 className="text-2xl font-bold text-foreground mb-2">이용약관</h1>
          <p className="text-sm text-muted-foreground mb-8">시행일: 2026년 3월 15일</p>

          <section className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제1조 (목적)</h2>
              <p>
                이 약관은 피치마켓(이하 &quot;회사&quot;)이 제공하는 중고거래 플랫폼 서비스(이하 &quot;서비스&quot;)의
                이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제2조 (정의)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>&quot;서비스&quot;란 회사가 제공하는 중고물품 거래 중개 플랫폼을 의미합니다.</li>
                <li>&quot;이용자&quot;란 이 약관에 따라 서비스를 이용하는 회원을 의미합니다.</li>
                <li>&quot;회원&quot;이란 서비스에 가입하여 이용자 계정을 부여받은 자를 의미합니다.</li>
                <li>&quot;게시물&quot;이란 회원이 서비스에 등록한 판매 글, 이미지, 채팅 메시지 등을 의미합니다.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                <li>
                  회사는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 최소 7일 전에
                  공지합니다.
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제4조 (회원가입 및 계정)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>회원가입은 이용자가 약관에 동의하고 회원정보를 기입한 후 회사가 이를 승인함으로써 완료됩니다.</li>
                <li>회원은 이메일 또는 Google 계정을 통해 가입할 수 있습니다.</li>
                <li>회원은 정확한 정보를 제공해야 하며, 허위 정보 입력 시 서비스 이용이 제한될 수 있습니다.</li>
                <li>회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제5조 (서비스의 제공)</h2>
              <p>회사는 다음과 같은 서비스를 제공합니다:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>중고물품 판매 게시물 등록 및 검색</li>
                <li>이용자 간 1:1 채팅</li>
                <li>관심 상품 즐겨찾기</li>
                <li>거래 상태 관리 (판매중, 예약중, 판매완료)</li>
                <li>신고 및 차단 기능</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제6조 (이용자의 의무)</h2>
              <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>허위 정보를 등록하거나 타인의 정보를 도용하는 행위</li>
                <li>서비스를 이용하여 불법 물품을 거래하는 행위</li>
                <li>다른 이용자에게 불쾌감을 주거나 위협하는 행위</li>
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>회사의 사전 동의 없이 상업적 목적으로 서비스를 이용하는 행위</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제7조 (게시물 관리)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>게시물의 저작권은 해당 게시물을 작성한 회원에게 있습니다.</li>
                <li>
                  회사는 관련 법령 위반, 약관 위반, 다른 이용자의 신고 등의 사유가 있을 경우 게시물을 삭제하거나 비공개
                  처리할 수 있습니다.
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제8조 (거래 관련 면책)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>회사는 이용자 간 거래의 중개 플랫폼을 제공할 뿐, 거래 당사자가 아닙니다.</li>
                <li>거래로 인해 발생하는 분쟁에 대해 회사는 책임을 지지 않으며, 이용자 간 직접 해결해야 합니다.</li>
                <li>회사는 안전한 거래를 위한 가이드와 신고 기능을 제공하지만, 거래의 안전을 보장하지 않습니다.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제9조 (서비스 중단)</h2>
              <p>
                회사는 시스템 점검, 설비 장애, 천재지변 등 불가피한 사유로 서비스 제공을 일시적으로 중단할 수 있으며, 이
                경우 사전에 공지합니다.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제10조 (회원 탈퇴 및 이용 제한)</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>회원은 언제든지 서비스 내에서 탈퇴를 요청할 수 있습니다.</li>
                <li>
                  회사는 약관을 위반하거나 서비스 운영을 방해하는 회원에 대해 서비스 이용을 제한하거나 계정을 정지할 수
                  있습니다.
                </li>
              </ol>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-3">제11조 (준거법 및 관할)</h2>
              <p>
                이 약관은 미국 조지아주 법률에 따라 해석되며, 서비스 이용과 관련된 분쟁은 조지아주 관할 법원에서
                해결합니다.
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

export default TermsPage
