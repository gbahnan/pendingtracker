/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/mempool', destination: 'https://explorer.pendingtracker.com/mempool/' },
      { source: '/mempool/:path*', destination: 'https://explorer.pendingtracker.com/mempool/:path*' },
    ];
  },
};
module.exports = nextConfig;
