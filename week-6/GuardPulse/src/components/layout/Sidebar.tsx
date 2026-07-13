"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: "📊" },
  { href: "/dashboard/vitals", label: "생체 데이터", icon: "💓" },
  { href: "/dashboard/alerts", label: "알림 이력", icon: "🔔" },
  { href: "/dashboard/notifications", label: "발송 이력", icon: "📨" },
  { href: "/dashboard/family", label: "가족 관리", icon: "👨‍👩‍👧‍👦" },
  { href: "/dashboard/settings", label: "설정", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-gray-50 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                isActive
                  ? "bg-rose-100 text-rose-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
