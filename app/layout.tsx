import type { Metadata } from "next";
import { GOOGLE_FONTS_URL } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thumbmaker — YouTubeサムネイルエディタ",
  description: "YouTubeサムネイルを手動でもAIでも作れるブラウザエディタ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
