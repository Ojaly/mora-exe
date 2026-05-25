import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MORA.exe — Suno Prompt Engineer",
  description: "日本語歌詞のモーラ分析とSuno AIプロンプト生成ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-white text-gray-900">{children}</body>
    </html>
  );
}
