import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/dashboards',
        destination: '/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/apps/ecommerce/customers/list',
        destination: '/dashboard/user',
        permanent: true,
        locale: false
      },
      {
        source: '/apps/ecommerce/orders/list',
        destination: '/dashboard/live',
        permanent: true,
        locale: false
      },
      {
        source: '/en/apps/ecommerce/customers/list',
        destination: '/dashboard/user',
        permanent: true,
        locale: false
      },
      {
        source: '/en/apps/ecommerce/orders/list',
        destination: '/dashboard/live',
        permanent: true,
        locale: false
      },
      {
        source: '/en/dashboards/:section(crm|analytics|ecommerce|academy|logistics)',
        destination: '/dashboard',
        permanent: true,
        locale: false
      },
      {
        source: '/dashboards/:section(crm|analytics|ecommerce|academy|logistics)',
        destination: '/dashboard',
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
        source: '/en/:path*',
        destination: '/:path*',
        permanent: true,
        locale: false
      }
    ]
  },
  rewrites: async () => {
    return [
      {
        source: '/dashboard',
        destination: '/en/dashboard'
      },
      {
        source: '/dashboard/user',
        destination: '/en/dashboard/user'
      },
      {
        source: '/dashboard/live',
        destination: '/en/dashboard/live'
      },
      {
        source: '/:path((?!en|fr|ar|front-pages|images|api|_next|favicon.ico).*)',
        destination: '/en/:path'
      }
    ]
  }
}

export default nextConfig
