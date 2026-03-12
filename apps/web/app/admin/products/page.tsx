'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconLoader2, IconSearch, IconTrash, IconExternalLink } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { adminApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { CATEGORIES, STATUS_LABEL } from '@/lib/product-types'
import type { AdminProductDto, ProductStatus } from '@/types/api'
import { toast } from 'sonner'

const STATUS_TABS: { value: ProductStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'SELLING', label: '판매중' },
  { value: 'RESERVED', label: '예약중' },
  { value: 'CONFIRMED', label: '판매확정' },
  { value: 'ENDED', label: '판매종료' },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AdminProductDto | null>(null)

  const fetchProducts = () => {
    setLoading(true)
    const params: { search?: string; status?: string; category?: string } = {}
    if (search) params.search = search
    if (statusFilter !== 'ALL') params.status = statusFilter
    if (categoryFilter) params.category = categoryFilter

    adminApi.getProducts(params).then(({ data }) => {
      setProducts(data ?? [])
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchProducts()
  }, [search, statusFilter, categoryFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const { error } = await adminApi.deleteProduct(deleteTarget.id)
    if (error) {
      toast.error(error)
    } else {
      toast.success('상품이 삭제되었습니다')
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const handleStatusChange = async (productId: string, status: string) => {
    const { error } = await adminApi.updateProductStatus(productId, status)
    if (error) {
      toast.error(error)
    } else {
      toast.success('상품 상태가 변경되었습니다')
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, status: status as ProductStatus } : p)))
    }
  }

  return (
    <div>
      {/* 필터 */}
      <div className="flex flex-col gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="제목 또는 판매자 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">
            검색
          </Button>
        </form>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
                  statusFilter === tab.value
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 상품 수 */}
      {!loading && (
        <p className="text-xs text-muted-foreground mb-3">총 {products.length}개 상품</p>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">상품이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="border rounded-xl p-3 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex gap-3">
                {/* 썸네일 */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      없음
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={cn(
                        'text-xs',
                        product.status === 'SELLING' && 'bg-success/20 text-success',
                        product.status === 'RESERVED' && 'bg-warning/20 text-warning',
                        product.status === 'CONFIRMED' && 'bg-purple-100 text-purple-700',
                        product.status === 'ENDED' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      {STATUS_LABEL[product.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.reportCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        신고 {product.reportCount}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium truncate">{product.title}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground">${product.price.toLocaleString()}</span>
                    <span>판매자: {product.seller.nickname}</span>
                    <span>조회 {product.viewCount}</span>
                    <span>{new Date(product.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                {/* 액션 */}
                <div className="flex flex-col gap-1 shrink-0">
                  <Link href={`/marketplace/${product.id}`} target="_blank">
                    <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                      <IconExternalLink className="h-3 w-3 mr-1" />
                      보기
                    </Button>
                  </Link>

                  <Select
                    value={product.status}
                    onValueChange={(value) => handleStatusChange(product.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SELLING">판매중</SelectItem>
                      <SelectItem value="RESERVED">예약중</SelectItem>
                      <SelectItem value="CONFIRMED">판매확정</SelectItem>
                      <SelectItem value="ENDED">판매종료</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(product)}
                  >
                    <IconTrash className="h-3 w-3 mr-1" />
                    삭제
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
