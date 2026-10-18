/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/mempool', destination: 'https://pendingtracker-angular-test-d1ywzr4af-pending-tracker.vercel.app/mempool/' },
      { source: '/mempool/:path*', destination: 'https://pendingtracker-angular-test-d1ywzr4af-pending-tracker.vercel.app/mempool/:path*' },
    ];
  },
};
module.exports = nextConfig;
