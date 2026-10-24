import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lamine Yamal — 19",
  description:
    "The record book of Lamine Yamal: La Masia to the World Cup final, every youngest-player record, every trophy. A scroll-driven match report.",
};

export const viewport: Viewport = {
  themeColor: "#05070c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("grain", "h-full", "antialiased", archivo.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
