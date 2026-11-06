/** @type {import('next').NextConfig} */
const nextConfig = {
  // The monster library moved from /templates to /monsters (Nov 2026); keep
  // old bookmarks working. The API stays at /api/templates.
  async redirects() {
    return [
      { source: '/templates', destination: '/monsters', permanent: true },
      { source: '/templates/:id', destination: '/monsters/:id', permanent: true },
    ];
  },
};

export default nextConfig;
