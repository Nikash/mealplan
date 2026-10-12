"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function FamilyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DishesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M4 10h16M6.5 10a5.5 5.5 0 0 0 11 0M8 18.5h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const onDishes = pathname === "/dishes" || pathname.startsWith("/dishes/");

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <Link
        href="/"
        className="mobile-nav-link"
        aria-current={onDishes ? undefined : "page"}
      >
        <FamilyIcon />
        Family
      </Link>
      <Link
        href="/dishes"
        className="mobile-nav-link"
        aria-current={onDishes ? "page" : undefined}
      >
        <DishesIcon />
        Dishes
      </Link>
    </nav>
  );
}
