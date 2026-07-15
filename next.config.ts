import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable the `use cache` directive (Cache Components) introduced in Next.js 16.
  // This opt-in flag is required; without it `'use cache'` is a no-op.
  cacheComponents: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "thumbnails.roblox.com" },
      // Roblox rotates thumbnail CDN subdomains (tr, t0â€“t7, fts, ...);
      // wildcard covers them all instead of chasing each new host.
      { protocol: "https", hostname: "*.rbxcdn.com" },
    ],
  },

  // Security headers applied to every response.
  // These mitigate clickjacking (X-Frame-Options), MIME sniffing
  // (X-Content-Type-Options), referrer leakage, and unnecessary browser
  // feature access â€” all standard hardening for a public-facing web app.
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
