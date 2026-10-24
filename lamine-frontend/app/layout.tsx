import type { Metadata } from "next";
import { Archivo, Geist_Mono, Inter, Playfair_Display } from "next/font/google";
import SiteFooter from "@/components/layout/site-footer";
import SmoothScroll from "@/components/layout/smooth-scroll";
import SiteNav from "@/components/layout/site-nav";
import VideoLightbox from "@/components/ui/video-lightbox";
import "./globals.css";

// The wide display cut needs the width axis. Every face ships the Vietnamese subset.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin", "vietnamese"], axes: ["wdth"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin", "vietnamese"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
});

// Runs before paint so the theme never flashes. Dark unless the visitor picked light.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("lamine-theme")||"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata: Metadata = {
  title: "Lamine Yamal — Từ Rocafonda tới đỉnh thế giới",
  description: "Danh hiệu, bàn thắng, highlight và tư liệu tuổi thơ của Lamine Yamal, số 10 của FC Barcelona.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      {/* Extensions (e.g. "vsc-initialized") add classes to body before hydration. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col font-body">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteNav />
        <SmoothScroll />
        {children}
        <SiteFooter />
        <VideoLightbox />
      </body>
    </html>
  );
}
