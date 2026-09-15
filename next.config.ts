import type { NextConfig } from "next";
import path from "node:path";
const internalBuild = false;
const javaAdapter = internalBuild
  ? "./src/lib/java-arena.ts"
  : "./src/lib/java-arena.public.ts";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
if (basePath && !/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(basePath)) {
  throw new Error(
    "NEXT_PUBLIC_BASE_PATH must be empty or a path such as /odd-lab (no trailing slash).",
  );
}
const config: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    ODD_INTERNAL_BUILD: internalBuild ? "1" : "0",
  },
  ...(process.env.ODD_STANDALONE === "1"
    ? { output: "standalone" as const }
    : {}),
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: process.cwd(),
    resolveAlias: { "@/lib/java-arena": javaAdapter },
  },
  webpack(config) {
    config.resolve.alias["@/lib/java-arena$"] = path.resolve(javaAdapter);
    return config;
  },
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  outputFileTracingIncludes: {
    "/api/media": ["./data/media/**/*"],
    "/*": ["./data/catalog.json"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
