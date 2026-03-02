import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboards',
        permanent: true,
        locale: false
      },
      {
        source: '/en',
        destination: '/',
        permanent: true,
        locale: false
      },
      {
        source: '/en/dashboards/:section(crm|analytics|ecommerce|academy|logistics)',
        destination: '/dashboards',
        permanent: true,
        locale: false
      },
      {
        source: '/en/:path*',
        destination: '/:path*',
        permanent: true,
        locale: false
      },
      {
        source: '/dashboards/:section(crm|analytics|ecommerce|academy|logistics)',
        destination: '/dashboards',
        permanent: true,
        locale: false
      }
    ]
  },
  rewrites: async () => {
    return [
      {
        source: '/dashboards',
        destination: '/en/dashboards/ecommerce'
      },
      {
        source: '/:path((?!en|fr|ar|front-pages|images|api|_next|favicon.ico).*)',
        destination: '/en/:path'
      }
    ]
  }
}

export default nextConfig
