"use client";

import Link from "next/link";

interface MobileNavProps {
  onClose: () => void;
}

export function MobileNav({ onClose }: MobileNavProps) {
  const links = [
    { href: "/dashboard", label: "대시보드" },
    { href: "/dashboard/vitals", label: "생체 데이터" },
    { href: "/dashboard/alerts", label: "알림" },
    { href: "/dashboard/family", label: "가족 관리" },
    { href: "/dashboard/settings", label: "설정" },
  ];

  return (
    <div className="md:hidden border-t bg-white">
      <nav className="flex flex-col py-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="px-6 py-4 text-xl font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
