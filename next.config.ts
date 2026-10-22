import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The old site was static files; keep its addresses working (the mobile
  // app links the privacy policy as /privacy.html).
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
    ]
  },
}

export default nextConfig
