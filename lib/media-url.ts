/**
 * Local export files go through the dev-only media route.
 * Remote http(s) urls are returned unchanged so a later host can keep this helper.
 * A relative path wins over a remote url when both exist.
 */
export function mediaUrl(
  asset: { path: string | null; url: string | null },
  projectId: string,
): string | null {
  if (asset.path) {
    const params = new URLSearchParams({
      projectId,
      path: asset.path,
    });
    return `/api/media?${params.toString()}`;
  }
  if (asset.url && /^https?:\/\//i.test(asset.url)) return asset.url;
  return null;
}
