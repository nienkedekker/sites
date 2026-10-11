import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nienke/ui"],
  cacheComponents: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      new URL("https://assets.hardcover.app/**"),
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
  // Share images read their fonts with readFile, which tracing misses for
  // opengraph-image routes
  outputFileTracingIncludes: {
    "/**/opengraph-image": ["./assets/fonts/*.ttf"],
  },
  async redirects() {
    return [
      { source: "/recs", destination: "/discover/for-you", permanent: true },
      { source: "/recent", destination: "/discover", permanent: true },
      { source: "/discover/new", destination: "/discover", permanent: true },
      {
        source: "/up-next",
        destination: "/discover/for-you#up-next",
        permanent: false,
      },
    ];
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
