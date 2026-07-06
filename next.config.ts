import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable the `use cache` directive (Cache Components) introduced in Next.js 16.
  // This opt-in flag is required; without it `'use cache'` is a no-op.
  cacheComponents: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "thumbnails.roblox.com" },
      { protocol: "https", hostname: "tr.rbxcdn.com" },
      { protocol: "https", hostname: "t2.rbxcdn.com" },
      { protocol: "https", hostname: "t3.rbxcdn.com" },
      { protocol: "https", hostname: "t4.rbxcdn.com" },
      { protocol: "https", hostname: "t5.rbxcdn.com" },
      { protocol: "https", hostname: "t6.rbxcdn.com" },
      { protocol: "https", hostname: "t7.rbxcdn.com" },
    ],
  },

  // Security headers applied to every response.
  // These mitigate clickjacking (X-Frame-Options), MIME sniffing
  // (X-Content-Type-Options), referrer leakage, and unnecessary browser
  // feature access — all standard hardening for a public-facing web app.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
