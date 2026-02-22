'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { IconFilter, IconSortDescending, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  '디지털기기',
  '생활가전',
  '가구/인테리어',
  '생활/주방',
  '유아동',
  '의류',
  '스포츠/레저',
  '도서',
  '게임/취미',
  '뷰티/미용',
  '반려동물용품',
  '기타',
];

const STATUS_OPTIONS = [
  { value: 'SELLING', label: '판매중' },
  { value: 'RESERVED', label: '예약중' },
  { value: 'SOLD', label: '판매완료' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || '';
  const currentSort = searchParams.get('sort') || 'latest';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // cursor 초기화 (필터 변경 시 처음부터 로드)
    params.delete('cursor');
    router.push(`/marketplace?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push('/marketplace');
  };

  const hasActiveFilters = currentCategory || currentStatus;

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* 필터 버튼들 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* 카테고리 필터 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={currentCategory ? 'default' : 'outline'} size="sm" className="shrink-0">
              <IconFilter className="w-4 h-4 mr-1" />
              {currentCategory || '카테고리'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            <DropdownMenuItem onClick={() => updateParams('category', '')}>전체</DropdownMenuItem>
            <DropdownMenuSeparator />
            {CATEGORIES.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => updateParams('category', category)}
                className={currentCategory === category ? 'bg-accent' : ''}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 상태 필터 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={currentStatus ? 'default' : 'outline'} size="sm" className="shrink-0">
              {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label || '상태'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => updateParams('status', '')}>전체</DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateParams('status', option.value)}
                className={currentStatus === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 정렬 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 ml-auto">
              <IconSortDescending className="w-4 h-4 mr-1" />
              {SORT_OPTIONS.find((s) => s.value === currentSort)?.label || '최신순'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => updateParams('sort', option.value)}
                className={currentSort === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 활성 필터 뱃지 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {currentCategory && (
            <Badge variant="secondary" className="gap-1">
              {currentCategory}
              <button onClick={() => updateParams('category', '')}>
                <IconX className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {currentStatus && (
            <Badge variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find((s) => s.value === currentStatus)?.label}
              <button onClick={() => updateParams('status', '')}>
                <IconX className="w-3 h-3" />
              </button>
            </Badge>
          )}
          <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
