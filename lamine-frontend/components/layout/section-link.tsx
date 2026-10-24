"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// A link to a home-page section that works from any page: a plain #hash on the
// home page (Lenis glides to it), a client-side route to /#hash elsewhere.
export default function SectionLink({
  id,
  className,
  label,
  children,
}: {
  id: string;
  className?: string;
  label?: string;
  children: React.ReactNode;
}) {
  const home = usePathname() === "/";
  return home ? (
    <a href={`#${id}`} aria-label={label} className={className}>
      {children}
    </a>
  ) : (
    <Link href={`/#${id}`} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
