import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  productionBrowserSourceMaps: false,
  compress: true,
  allowedDevOrigins: ["http://192.168.0.231:3000", "192.168.0.231"],
};

export default nextConfig;
