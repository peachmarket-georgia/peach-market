"use client";

import { Home, Search, MessageCircle, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "홈", href: "/", active: true },
  { icon: Search, label: "검색", href: "/search" },
  { icon: Plus, label: "글쓰기", href: "/write", isCenter: true },
  { icon: MessageCircle, label: "채팅", href: "/chat" },
  { icon: User, label: "MY", href: "/profile" },
];

export const MobileBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => (
          <button
            key={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 h-full",
              item.isCenter
                ? "text-primary"
                : item.active
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            {item.isCenter ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground -mt-4 shadow-lg">
                <item.icon className="h-5 w-5" />
              </div>
            ) : (
              <>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
