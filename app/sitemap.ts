import type { MetadataRoute } from 'next'
import { publicContent } from '@/lib/data'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; const { items } = await publicContent(); return [{ url: base }, ...items.filter(item => item.kind === 'projects').map(item => ({ url: `${base}/projects/${item.data.slug}` }))] }
