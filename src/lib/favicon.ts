/** Hostnames of external links, for looking up and matching favicons. */
const HOST = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

/** A valid hostname (no scheme, port or path), or null. */
export function parseHost(value: string | null | undefined): string | null {
  if (!value) return null;
  const host = value.trim().toLowerCase();
  return host.length <= 253 && HOST.test(host) ? host : null;
}

/** The host of an absolute URL, or null when the URL is not absolute. */
export function hostOf(href: string): string | null {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:"
      ? parseHost(url.hostname)
      : null;
  } catch {
    return null;
  }
}
