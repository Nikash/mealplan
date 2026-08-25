import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meal Log",
    short_name: "Meal Log",
    description: "Simple family meal logging",
    id: withBasePath("/"),
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#2f6f5e",
    lang: "en",
    categories: ["food", "lifestyle", "utilities"],
    icons: [
      {
        src: withBasePath("/icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/icon-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/icon-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
