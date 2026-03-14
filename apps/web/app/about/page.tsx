import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: '피치마켓 소개 | 조지아 한인 중고거래',
  description: '피치마켓은 조지아주 한인 커뮤니티를 위한 안전한 중고거래 플랫폼입니다.',
}

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/peach_logo_transparent.png" alt="피치마켓" width={32} height={32} className="w-8 h-8" />
            <span className="text-lg font-bold text-primary">피치마켓</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                매물 보기
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm">시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-primary font-medium mb-4">조지아 한인 커뮤니티</p>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            흩어진 거래, 사라지는 기록.
            <br />
            이제 끝.
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8">
            검증되지 않은 판매자, 추적 불가능한 대화 기록, 영어로만 검색되는 마켓플레이스. 피치마켓은 조지아 한인을 위해
            만들어졌습니다.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/signup">
              <Button size="lg">무료 회원가입</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                매물 보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 문제점 */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-12">기존 방식의 한계</h2>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">기존 마켓플레이스</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>· 검증되지 않은 판매자로 인한 사기 위험</li>
                <li>· 영어 중심 서비스로 한국어 검색 불편</li>
                <li>· 한인 판매자를 특정하기 어려움</li>
                <li>· 커뮤니티 신뢰 기반 부재</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">메신저 기반 거래</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>· 대화방 삭제 시 거래 기록 전부 소실</li>
                <li>· 분쟁 발생 시 증거 확보 불가</li>
                <li>· 원하는 물건을 찾으려면 여러 그룹 탐색 필요</li>
                <li>· 체계적인 검색 기능 부재</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 솔루션 */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-4">피치마켓이 다른 점</h2>
          <p className="text-muted-foreground mb-12">조지아 한인 커뮤니티에 맞게 설계했습니다.</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">커뮤니티 기반 신뢰</h3>
              <p className="text-sm text-muted-foreground">
                한인회, 교회, 학교 등 커뮤니티 연결을 통한 신원 확인. 거래 후기와 평점으로 신뢰도를 쌓아갑니다.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">거래 기록 영구 보관</h3>
              <p className="text-sm text-muted-foreground">
                모든 대화와 거래 내역이 안전하게 저장됩니다. 문제 발생 시 증거로 활용할 수 있습니다.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">한국어 우선 검색</h3>
              <p className="text-sm text-muted-foreground">
                한국어로 검색하고, 한인 판매자의 매물만 모아봅니다. 둘루스, 스와니, 존스크릭 등 지역 기반 탐색.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">안전 거래 지원</h3>
              <p className="text-sm text-muted-foreground">
                사기 예방 가이드, 안전한 거래 장소 추천, 신고 및 차단 기능으로 건전한 거래 환경을 만듭니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">조지아 한인 중고거래의 새로운 기준</h2>
          <p className="text-muted-foreground mb-8">지금 피치마켓에서 시작하세요.</p>

          <div className="flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">무료 회원가입</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                매물보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primary">피치마켓</span>
            <span className="text-sm text-muted-foreground">조지아 한인 중고거래</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground">
              이용약관
            </a>
            <a href="#" className="hover:text-foreground">
              개인정보처리방침
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2024 PeachMarket</p>
      </footer>
    </div>
  )
}

export default AboutPage
