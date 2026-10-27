import type { NextConfig } from "next";
import { linkHeaders, markdownRewrites } from "./src/lib/agents/discovery";
import { aliasRedirects } from "./src/lib/demo-meta";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    // "/" opens the Introduction. Temporary, so the home page can change later
    // without browsers holding on to a cached permanent redirect.
    return [
      { source: "/", destination: "/introduction", permanent: false },
      ...aliasRedirects(),
    ];
  },
  async rewrites() {
    // Before the page routes, so `Accept: text/markdown` reaches the Markdown route.
    return { beforeFiles: markdownRewrites(), afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      ...linkHeaders(),
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
