import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  /*
   * Render every HTML request blocking instead of streaming. With streaming,
   * Next moves page metadata into <body> for any user agent missing from its
   * built-in crawler list — Zalo's link-preview crawler is one — and preview
   * crawlers only read <head>, so /song/[id] links would show no card there.
   * Blocking also makes a missing song a real 404 rather than a 200 that has
   * already been flushed. The cost is small: the first byte waits for one
   * indexed DB read the page needs anyway; client navigations still stream.
   */
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  }
};

export default nextConfig;
