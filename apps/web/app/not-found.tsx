import Link from 'next/link'

const NotFound = () => {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <p className="text-8xl font-extrabold text-transparent bg-linear-to-r from-peach to-peach-hover bg-clip-text mb-2">
          404
        </p>
        <h1 className="text-xl font-bold text-foreground mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground mb-8">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/marketplace"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl bg-linear-to-r from-peach to-peach-hover text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            마켓 둘러보기
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted/50 transition-all"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
