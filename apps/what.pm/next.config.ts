import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nienke/ui"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Pages can also answer in Markdown (see middleware.ts). `next start`
        // overwrites Vary on rendered pages; Vercel applies this at the edge.
        source: "/:path((?!_next|api|auth|markdown).*)",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ];
  },
};

export default nextConfig;
