import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: false,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // HIPAA: never log PHI in server logs
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default config;
