/* System Package */
import type { Metadata } from "next";
import { Inter } from "next/font/google";

/* Application Package */
import AuthProvider from "@/components/auth/authProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

/*
 * Base for every relative URL in page metadata (canonical, og:url). Link
 * previews need absolute URLs, so production must set NEXT_PUBLIC_URL to the
 * public site origin; without it Next falls back to localhost.
 */
function resolveSiteUrl(): URL | undefined {
  try {
    return process.env.NEXT_PUBLIC_URL ? new URL(process.env.NEXT_PUBLIC_URL) : undefined;
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
