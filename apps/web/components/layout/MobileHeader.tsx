"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const MobileHeader = () => {
  return (
    <header className="md:hidden sticky top-0 z-40 bg-background">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/peach_logo_transparent.png"
            alt="피치마켓"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-bold text-primary">피치마켓</span>
        </Link>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* 검색바 */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색"
            className="pl-10 h-10 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>
    </header>
  );
};
