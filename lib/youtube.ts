export function getYouTubeThumbnailUrl(
  url: string | null | undefined
): string | null {
  if (!url) {
    return null;
  }

  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;

  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}
