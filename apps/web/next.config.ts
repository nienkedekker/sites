import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Shared design system, published as TypeScript source
  transpilePackages: ["@nienke/ui"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevents embedding in iframes
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevents MIME sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Limits referrer info
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()", // Restricts browser APIs
          },
        ],
      },
    ];
  },
};

export default nextConfig;
