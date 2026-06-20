import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allows you to test the app on your phone/other local devices
  allowedDevOrigins: ["192.168.1.10", "localhost"],
};

export default nextConfig;