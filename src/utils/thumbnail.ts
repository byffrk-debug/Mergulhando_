import type { Video } from '../types';

export function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function getThumbnail(video: Video): string {
  if (video.thumbnail_url) return video.thumbnail_url;
  const id = getYouTubeId(video.url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
