import dishApiRequest from '@/apiRequests/dish'
import envConfig, { locales } from '@/config'
import { generateSlugUrl } from '@/lib/utils'
import { type MetadataRoute } from 'next'

const staticRoutes: MetadataRoute.Sitemap = [
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

// ❌ Không dùng export default sitemap nữa
// ✅ Đổi thành export async function GET()

export async function GET(): Promise<Response> {
  const result = await dishApiRequest.list()

  const dishList = result.payload.data

  const localizeStaticSiteMap = locales.reduce((acc, locale) => {
    return [
      ...acc,
      ...staticRoutes.map((route) => ({
        ...route,
        url: `${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}`,
        lastModified: new Date()
      }))
    ]
  }, [] as MetadataRoute.Sitemap)

  const localizeDishSiteMap = locales.reduce((acc, locale) => {
    const dishListSiteMap: MetadataRoute.Sitemap = dishList.map((dish) => ({
      url: `${envConfig.NEXT_PUBLIC_URL}/${locale}/dishes/${generateSlugUrl({
        id: dish.id,
        name: dish.name
      })}`,
      lastModified: dish.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.9
    }))
    return [...acc, ...dishListSiteMap]
  }, [] as MetadataRoute.Sitemap)

  const fullSitemap = [...localizeStaticSiteMap, ...localizeDishSiteMap]

  return new Response(
    generateSitemapXml(fullSitemap),
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  )
}

// ✅ Thêm hàm tự generate XML string
function generateSitemapXml(routes: MetadataRoute.Sitemap): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `
  <url>
    <loc>${route.url}</loc>
    ${route.lastModified ? `<lastmod>${new Date(route.lastModified).toISOString()}</lastmod>` : ''}
    ${route.changeFrequency ? `<changefreq>${route.changeFrequency}</changefreq>` : ''}
    ${route.priority ? `<priority>${route.priority}</priority>` : ''}
  </url>
`).join('')}
</urlset>`
}
