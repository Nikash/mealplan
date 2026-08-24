import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow localtunnel / other preview hosts to load Next.js dev assets
  allowedDevOrigins: ["*.loca.lt", "localhost", "127.0.0.1"],
};

export default nextConfig;
