/** @type {import('next').NextConfig} */
const explorer = 'https://explorer.pendingtracker.com';
const nextConfig = {
  reactStrictMode: true,
  // UI uses Angular's own host because its base URL and static assets are rooted
  // at /. Do not proxy its HTML under /mempool on the Next.js host.
  async redirects() {
    return [
      { source: '/mempool', destination: explorer + '/bitcoin', permanent: false },
      { source: '/mempool/tx/:txid', destination: explorer + '/tx/:txid', permanent: false },
      { source: '/mempool/address/:address', destination: explorer + '/address/:address', permanent: false },
      { source: '/mempool/blocks', destination: explorer + '/blocks', permanent: false },
      { source: '/mempool/block/:block', destination: explorer + '/block/:block', permanent: false },
    ];
  },
  // Keep existing public /mempool/api/* compatibility without redirecting
  // API clients or breaking first-party Bitcoin requests.
  async rewrites() {
    return [
      { source: '/mempool/api/:path*', destination: explorer + '/mempool/api/:path*' },
      { source: '/mempool/resources/:path*', destination: explorer + '/mempool/resources/:path*' },
    ];
  },
};
module.exports = nextConfig;
