import type { NextConfig } from "next";
import { aliasRedirects } from "./src/lib/demo-meta";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return aliasRedirects();
  },
  async headers() {
    return [
      {
        source: "/demos/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/((?!demos/).*)",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
