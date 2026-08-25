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

/**
 * Public URL prefix for this app. Defaults to `/mealplan` so a reverse proxy
 * can keep that path and forward it unchanged to Next.js.
 *
 * Override at build time with NEXT_PUBLIC_BASE_PATH. Use an empty string to
 * serve from domain root (for example `NEXT_PUBLIC_BASE_PATH= npm run dev`).
 */
export const basePath = normalizeBasePath(
  process.env.NEXT_PUBLIC_BASE_PATH ?? "/mealplan",
);

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) return normalized;
  return `${basePath}${normalized}`;
}
