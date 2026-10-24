import type { Metadata } from "next";
import { Archivo, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import SiteFooter from "@/components/site-footer";
import SmoothScroll from "@/components/smooth-scroll";
import Ruler from "@/components/ruler";
import SiteNav from "@/components/site-nav";
import "./globals.css";

// The wide display cut needs the width axis.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Runs before paint so the theme never flashes.
const themeScript = `try{var t=localStorage.getItem("aircraft-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

export const metadata: Metadata = {
  title: "Aircraft — Direct your AI images and video",
  description:
    "Aircraft is a free, open studio for staging AI images and video by hand: block the scene, light it, then render.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${inter.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      {/* Extensions (e.g. "vsc-initialized") add classes to body before hydration. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col font-body">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteNav />
        <SmoothScroll />
        <Ruler />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
