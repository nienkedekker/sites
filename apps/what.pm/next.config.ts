import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nienke/ui"],
  // Share images read their fonts with readFile, which tracing misses for
  // opengraph-image routes
  outputFileTracingIncludes: {
    "/**/opengraph-image": ["./assets/fonts/*.ttf"],
  },
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
    ];
  },
};

export default nextConfig;
