/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const explorer = 'https://explorer.pendingtracker.com';
    return [
      // Explicit API rules prevent wildcard paths being forwarded with a literal '*'.
      { source: '/mempool/api/:path*', destination: explorer + '/mempool/api/:path*' },
      { source: '/mempool/resources/:path*', destination: explorer + '/mempool/resources/:path*' },
      { source: '/mempool', destination: explorer + '/mempool/' },
      { source: '/mempool/:path*', destination: explorer + '/mempool/:path*' },
    ];
  },
};
module.exports = nextConfig;
