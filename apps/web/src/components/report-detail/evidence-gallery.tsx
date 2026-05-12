'use client'

import { EvidenceLightbox } from './evidence-lightbox'

import type { EvidenceItem } from '@/lib/api'

const YT_HOSTS = ['youtube.com', 'www.youtube.com', 'youtu.be']

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!YT_HOSTS.includes(u.hostname)) return null
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

function isImage(m: string) {
  return m.startsWith('image/')
}
function isVideo(m: string) {
  return m.startsWith('video/')
}
function isAudio(m: string) {
  return m.startsWith('audio/')
}

function ImageItem({ item }: { item: EvidenceItem }) {
  return <EvidenceLightbox src={item.url} alt={item.fileKey} />
}

function VideoItem({ item }: { item: EvidenceItem }) {
  return (
    <video controls className="w-full max-w-md rounded">
      <source src={item.url} type={item.mimeType} />
    </video>
  )
}

function AudioItem({ item }: { item: EvidenceItem }) {
  return <audio controls src={item.url} className="w-full max-w-md" />
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
  return (
    <iframe
      src={src}
      title="YouTube video"
      allow="accelerometer; encrypted-media; gyroscope"
      allowFullScreen
      className="aspect-video w-full max-w-md rounded"
      sandbox="allow-scripts allow-same-origin"
    />
  )
}

function LinkRow({ item }: { item: EvidenceItem }) {
  return (
    <a
      href={item.fileKey}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-primary underline"
    >
      🔗 {item.fileKey}
    </a>
  )
}

function FileRow({ item }: { item: EvidenceItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-primary underline"
    >
      📎 {item.fileKey.split('/').pop()}
    </a>
  )
}

export function EvidenceGallery({ items }: { items: EvidenceItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <GalleryItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function GalleryItem({ item }: { item: EvidenceItem }) {
  if (item.type === 'external_link') {
    const ytId = extractYouTubeId(item.fileKey)
    if (ytId) return <YouTubeEmbed videoId={ytId} />
    return <LinkRow item={item} />
  }
  if (isImage(item.mimeType)) return <ImageItem item={item} />
  if (isVideo(item.mimeType)) return <VideoItem item={item} />
  if (isAudio(item.mimeType)) return <AudioItem item={item} />
  return <FileRow item={item} />
}
