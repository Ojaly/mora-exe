import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MORA.exe — Suno Prompt Engineer",
  description: "日本語歌詞のモーラ分析・崩壊予測・Suno Style Prompt生成",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
