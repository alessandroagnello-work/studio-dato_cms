/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/en/articles',
        destination: '/en/articoli',
      },
      {
        source: '/en/contacts',
        destination: '/en/contatti',
      },
    ];
  },
};

export default nextConfig;