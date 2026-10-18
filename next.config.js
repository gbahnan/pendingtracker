/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/mempool', destination: 'https://pendingtracker-angular-test-kv5zu7qla-pending-tracker.vercel.app/mempool/' },
      { source: '/mempool/:path*', destination: 'https://pendingtracker-angular-test-kv5zu7qla-pending-tracker.vercel.app/mempool/:path*' },
    ];
  },
};
module.exports = nextConfig;
