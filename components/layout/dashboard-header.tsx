'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { ColorThemeSelector } from '@/components/color-theme-selector';
import { UserNavMenu } from '@/components/layout/user-nav-menu';
import { GlobalSearch } from '@/components/global-search';

export function DashboardHeader() {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === 'collapsed' && !isMobile;

  return (
    <header className="flex h-14 shrink-0 items-center border-b bg-background px-3 md:px-4 gap-2">
      {/* Left - Logo (when collapsed) + Sidebar Toggle */}
      <div className="flex items-center gap-2 md:gap-3">
        {isCollapsed && (
          <>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 md:h-7 md:w-7 text-primary" />
              <span className="font-semibold text-sm text-primary hidden sm:inline">
                AsyaKitap
              </span>
            </Link>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
          </>
        )}

        <SidebarTrigger className="-ml-1" />

        {!isCollapsed && (
          <Separator orientation="vertical" className="h-4 hidden sm:block" />
        )}
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 flex justify-center px-2 md:px-4">
        <GlobalSearch />
      </div>

      {/* Right - Theme Controls & User */}
      <div className="flex items-center gap-1 md:gap-2">
        <ColorThemeSelector />
        <ThemeToggle />
        <UserNavMenu />
      </div>
    </header>
  );
}
