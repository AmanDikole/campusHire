export function extractTenantSubdomain(host: string | null | undefined): string | null {
  if (!host) return null

  const hostname = host.split(":")[0].toLowerCase()
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return null

  // Development tunnel domains should not force tenant scoping.
  // Example: abc-xyz.ngrok-free.dev
  if (
    hostname.endsWith(".ngrok-free.dev") ||
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok.io") ||
    hostname.endsWith(".trycloudflare.com")
  ) {
    return null
  }

  const parts = hostname.split(".")
  if (parts.length < 2) return null

  // Local development support: mit.localhost
  if (parts.length === 2 && parts[1] === "localhost") {
    const localSubdomain = parts[0]
    if (!localSubdomain || localSubdomain === "www") return null
    return localSubdomain
  }

  if (parts.length < 3) return null

  const subdomain = parts[0]
  if (!subdomain || subdomain === "www") return null

  return subdomain
}
