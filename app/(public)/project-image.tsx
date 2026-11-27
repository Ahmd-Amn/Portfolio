'use client'

import { useRef, useState, type ImgHTMLAttributes } from 'react'

export default function ProjectImage({ className = '', alt = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = useState('loading')
  const dialog = useRef<HTMLDialogElement>(null)
  return <span className={`project-media ${className}`} data-status={status} aria-busy={status === 'loading'}>
    <button className="project-image-trigger" type="button" aria-label={`Enlarge ${alt || 'project image'}`} disabled={status !== 'loaded'} onClick={() => dialog.current?.showModal()}>
      <img {...props} alt={alt} ref={image => { if (image?.complete) setStatus(image.naturalWidth ? 'loaded' : 'error') }} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />
    </button>
    {status === 'error' && <span className="project-media-error">Image unavailable</span>}
    <dialog ref={dialog} className="image-viewer" aria-label={alt || 'Project image'} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      <button className="image-viewer-close" type="button" autoFocus onClick={() => dialog.current?.close()}>Close</button>
      <img src={props.src} alt={alt} width={props.width} height={props.height} />
    </dialog>
  </span>
}
