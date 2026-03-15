'use client'

import Link from 'next/link'
import { IconRefresh } from '@tabler/icons-react'

const Error = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">😥</p>
        <h1 className="text-xl font-bold text-foreground mb-2">문제가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground mb-8">
          일시적인 오류가 발생했습니다. 다시 시도하거나 잠시 후 이용해주세요.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-peach to-peach-hover text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <IconRefresh className="h-4 w-4" />
            다시 시도
          </button>
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

export default Error
