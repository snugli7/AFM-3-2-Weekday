"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💓</span>
          <span className="text-xl font-bold text-rose-600">GuardPulse</span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-medium text-gray-700 hover:text-rose-600 transition-colors"
          >
            대시보드
          </Link>
          <Link
            href="/dashboard/vitals"
            className="text-lg font-medium text-gray-700 hover:text-rose-600 transition-colors"
          >
            생체 데이터
          </Link>
          <Link
            href="/dashboard/alerts"
            className="text-lg font-medium text-gray-700 hover:text-rose-600 transition-colors"
          >
            알림
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-lg font-medium text-gray-700 hover:text-rose-600 transition-colors"
          >
            설정
          </Link>
        </nav>

        {/* 모바일 메뉴 버튼 */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴 열기"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </header>
  );
}
