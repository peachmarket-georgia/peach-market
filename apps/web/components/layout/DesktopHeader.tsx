'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Plus, MessageCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCreateModal } from '@/components/product/ProductCreateModal'

export const DesktopHeader = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  return (
    <>
      <header className="hidden md:block sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image
              src="/peach_logo_transparent.png"
              alt="피치마켓"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <span className="text-lg font-bold text-primary">피치마켓</span>
          </Link>

          {/* 검색바 */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="물품이나 동네를 검색해보세요"
                className="pl-11 h-11 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              글쓰기
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <ProductCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </>
  )
}
