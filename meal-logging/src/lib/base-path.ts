/**
 * Public URL prefix for this app. Defaults to `/mealplan` so a reverse proxy
 * can keep that path and forward it unchanged to Next.js.
 *
 * Override at build time with NEXT_PUBLIC_BASE_PATH. Use an empty string to
 * serve from domain root (for example `NEXT_PUBLIC_BASE_PATH= npm run dev`).
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/mealplan";

export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!basePath) return normalized;
  return `${basePath}${normalized}`;
}
