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
    const isDev = process.env.NODE_ENV !== 'production'

    // The previous policy allowed 'unsafe-eval' and whitelisted cdnjs, jsDelivr,
    // unpkg and Google Fonts. Nothing in this app loads from any of them, so the
    // allowances only widened the attack surface. 'unsafe-inline' stays on
    // script-src because Next's bootstrap scripts are inline; removing it needs
    // per-request nonces from middleware, which is the next step here.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ')

    const headers = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // This app needs none of these; denying them stops an injected script asking.
      {
        key: 'Permissions-Policy',
        value:
          'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
      },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ]

    if (!isDev) {
      // Only meaningful over HTTPS, and pinning it in dev breaks local http.
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
    }

    return [{ source: '/:path*', headers }]
  },
}

module.exports = nextConfig
