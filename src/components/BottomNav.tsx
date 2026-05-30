"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  TrendingUp,
  BookOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",          label: "Home",     icon: LayoutDashboard },
  { href: "/workout",   label: "Workout",  icon: Dumbbell },
  { href: "/history",   label: "History",  icon: History },
  { href: "/progress",  label: "Progress", icon: TrendingUp },
  { href: "/exercises", label: "Exercises",icon: BookOpen },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-100" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-xl mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                active
                  ? "text-sky-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
