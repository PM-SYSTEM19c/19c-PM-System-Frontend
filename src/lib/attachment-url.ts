/** Recognize API-owned attachments before routing them through the session proxy. */
export function isInternalAttachmentUrl(
  fileUrl: string,
  apiBaseUrl: string,
  siteOrigin: string,
): boolean {
  try {
    const api = new URL(apiBaseUrl, siteOrigin);
    const target = new URL(fileUrl, siteOrigin);
    const site = new URL(siteOrigin);
    if (!apiBaseUrl || !["http:", "https:"].includes(target.protocol))
      return false;
    if (target.username || target.password) return false;
    const uploadPath = `${api.pathname.replace(/\/+$/, "")}/uploads/`;
    return (
      (target.origin === api.origin || target.origin === site.origin) &&
      target.pathname.startsWith(uploadPath) &&
      target.pathname.length > uploadPath.length
    );
  } catch {
    return false;
  }
}

/** Keep browser credentials same-origin, including attachments with stored backend URLs. */
export function getAttachmentProxyUrl(
  fileUrl: string,
  apiBaseUrl: string,
  siteOrigin: string,
): string | null {
  if (!isInternalAttachmentUrl(fileUrl, apiBaseUrl, siteOrigin)) return null;
  const target = new URL(fileUrl, siteOrigin);
  const api = new URL(apiBaseUrl, siteOrigin);
  const uploadPath = `${api.pathname.replace(/\/+$/, "")}/uploads/`;
  return `/api/v1/uploads/${target.pathname.slice(uploadPath.length)}${target.search}`;
}
