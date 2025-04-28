// app/sitemap.xml/route.ts

import dishApiRequest from '@/apiRequests/dish'
import envConfig, { locales } from '@/config'
import { generateSlugUrl } from '@/lib/utils'
import type { MetadataRoute } from 'next'

const staticRoutes = [
  {
    url: '',
    changeFrequency: 'daily',
    priority: 1
  },
  {
    url: '/login',
    changeFrequency: 'yearly',
    priority: 0.5
  }
]

export async function GET() {
  try {
    const result = await dishApiRequest.list()
    const dishList = result.payload.data

    const urls = locales.flatMap((locale) => {
      const staticUrls = staticRoutes.map((route) => `
        <url>
          <loc>${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}</loc>
          <changefreq>${route.changeFrequency}</changefreq>
          <priority>${route.priority}</priority>
          <lastmod>${new Date().toISOString()}</lastmod>
        </url>
      `)

      const dishUrls = dishList.map((dish) => `
        <url>
          <loc>${envConfig.NEXT_PUBLIC_URL}/${locale}/dishes/${generateSlugUrl({
            id: dish.id,
            name: dish.name
          })}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
          <lastmod>${new Date(dish.updatedAt).toISOString()}</lastmod>
        </url>
      `)

      return [...staticUrls, ...dishUrls]
    })

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join('')}
      </urlset>`

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml'
      }
    })
  } catch (error) {
    console.error('Failed to generate sitemap', error)
    return new Response('Failed to generate sitemap', { status: 500 })
  }
}
