/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Enable custom server port from environment
  env: {
    CUSTOM_PORT: process.env.PORT || '3001',
  },

};

module.exports = nextConfig;
