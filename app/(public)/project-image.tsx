'use client'

import { useState, type ImgHTMLAttributes } from 'react'

export default function ProjectImage({ className = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = useState('loading')
  return <span className={`project-media ${className}`} data-status={status} aria-busy={status === 'loading'}>
    <img {...props} alt={alt} ref={image => { if (image?.complete) setStatus(image.naturalWidth ? 'loaded' : 'error') }} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
    {status === 'error' && <span className="project-media-error">Image unavailable</span>}
  </span>
}
