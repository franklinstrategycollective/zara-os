import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: false,
  // HIPAA: never log PHI in server logs
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Strict CSP for clinical app
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },
};

export default config;
