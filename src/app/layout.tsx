/* System Package */
import type { Metadata } from "next";
import { Inter } from "next/font/google";

/* Application Package */
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Analyrics - Hiểu sâu từng lời nhạc",
  description: "Phân tích lời bài hát chuyên sâu bằng AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
