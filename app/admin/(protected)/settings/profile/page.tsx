import { owner } from '@/lib/data'
import PhotoEditor from './photo-editor'

export default async function Photo() {
  const supabase = await owner()
  const { data } = await supabase.from('site_profile').select('photo_path').eq('id', '00000000-0000-0000-0000-000000000001').maybeSingle()
  const src = data?.photo_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile/${data.photo_path}` : null
  return <><h1>Profile photo</h1><p>Upload a JPEG, PNG, or WebP image up to 5 MB. Adjust the crop before saving.</p><PhotoEditor current={src} /></>
}
