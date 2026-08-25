import type { NextConfig } from "next";

function normalizeBasePath(raw: string): string {
  let value = raw.trim().replace(/\\/g, "/");
  // Git Bash converts "/mealplan" to "C:/Program Files/Git/mealplan" when
  // calling Win32 tools like docker.exe.
  const msys = value.match(/^[A-Za-z]:\/(?:Program Files\/)?Git(\/.*)$/i);
  if (msys) value = msys[1];
  if (!value || value === "/") return "";
  if (!value.startsWith("/")) value = `/${value}`;
  if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1);
  return value;
}

const basePath = normalizeBasePath(
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/mealplan",
);

const nextConfig: NextConfig = {
  output: "standalone",
  // Must match the public URL prefix. A path-stripping proxy_pass (trailing
  // slash on the upstream URI) plus this setting causes a redirect loop.
  basePath: basePath || undefined,
  // Next.js 308s `/mealplan/` → `/mealplan` by default; nginx `location /mealplan/`
  // 301s the other way. That pair is the ERR_TOO_MANY_REDIRECTS loop.
  skipTrailingSlashRedirect: true,
  // Allow localtunnel / other preview hosts to load Next.js dev assets
  allowedDevOrigins: ["*.loca.lt", "localhost", "127.0.0.1", "192.168.1.207"],
};

export default nextConfig;
