import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage (uploaded images)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // External images imported from recipe sites
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
