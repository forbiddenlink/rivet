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
    '@rivet/engine-flows',
  ],
  // Note: Temporarily disabled static export to support API routes for dashboard
  // output: 'export',
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https:",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
