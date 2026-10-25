"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/provider";

// A link to a home-page section that works from any page: a plain #hash on the
// home page (Lenis glides to it), a client-side route to /<lang>#hash elsewhere.
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
  const home = localePath(useLocale());
  const onHome = usePathname() === home;
  return onHome ? (
    <a href={`#${id}`} aria-label={label} className={className}>
      {children}
    </a>
  ) : (
    <Link href={`${home}#${id}`} aria-label={label} className={className}>
      {children}
    </Link>
  );
}
