import { IconBan } from '@tabler/icons-react'

export const metadata = {
  title: '계정 정지',
}

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <IconBan className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">계정이 정지되었습니다</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            커뮤니티 가이드라인 위반으로 인해 계정이 정지되었습니다. 이의가 있으시면 아래 이메일로 문의해주세요.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">문의 이메일</p>
          <a href="mailto:support@peachmarket.com" className="text-sm font-medium text-primary hover:underline">
            support@peachmarket.com
          </a>
        </div>
      </div>
    </div>
  )
}
