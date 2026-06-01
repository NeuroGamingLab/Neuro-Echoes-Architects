/** API base URL: localhost when developing, same host when served from Azure/public IP. */
export function serviceUrl(port) {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `${window.location.protocol}//${host}:${port}`;
    }
  }
  return `http://127.0.0.1:${port}`;
}
