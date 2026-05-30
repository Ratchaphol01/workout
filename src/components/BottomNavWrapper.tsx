"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const HIDDEN_PATHS = new Set(["/login", "/register", "/profile/setup"]);

export default function BottomNavWrapper() {
  const pathname = usePathname();
  if (HIDDEN_PATHS.has(pathname)) return null;
  return <BottomNav />;
}
