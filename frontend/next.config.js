/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crypto/shared'],
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig