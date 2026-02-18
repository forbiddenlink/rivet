/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rivet/core',
    '@rivet/parsers',
    '@rivet/engine-smells',
    '@rivet/engine-security',
    '@rivet/engine-bugs',
    '@rivet/engine-performance',
    '@rivet/engine-architecture',
    '@rivet/engine-practices',
    '@rivet/engine-dependencies',
  ],
  // Note: Temporarily disabled static export to support API routes for dashboard
  // output: 'export',
}

module.exports = nextConfig
