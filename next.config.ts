import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "5wt23w8lat.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
