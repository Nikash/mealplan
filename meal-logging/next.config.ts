import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/mealplan";

const nextConfig: NextConfig = {
  output: "standalone",
  // Must match the public URL prefix. A path-stripping proxy_pass (trailing
  // slash on the upstream URI) plus this setting causes a redirect loop.
  basePath: basePath || undefined,
  // Next.js 308s `/mealplan/` → `/mealplan` by default; nginx `location /mealplan/`
  // 301s the other way. That pair is the ERR_TOO_MANY_REDIRECTS loop.
  skipTrailingSlashRedirect: true,
  // Allow localtunnel / other preview hosts to load Next.js dev assets
  allowedDevOrigins: ["*.loca.lt", "localhost", "127.0.0.1"],
};

export default nextConfig;
