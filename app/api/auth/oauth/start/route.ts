import { db } from "@/lib/db"
import { extractTenantSubdomain } from "@/lib/tenant"
import { NextResponse } from "next/server"

const ALLOWED_PROVIDERS = new Set(["google", "github"])

function isProviderConfigured(provider: string) {
  if (provider === "google") {
    return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)
  }
  if (provider === "github") {
    return Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)
  }
  return false
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const provider = (url.searchParams.get("provider") || "").trim().toLowerCase()
  const collegeId = (url.searchParams.get("collegeId") || "").trim()

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.redirect(new URL("/signup?error=oauth_invalid_provider", url))
  }

  if (!isProviderConfigured(provider)) {
    return NextResponse.redirect(new URL("/signup?error=oauth_not_configured", url))
  }

  if (!collegeId) {
    return NextResponse.redirect(new URL("/signup?error=oauth_college_required", url))
  }

  const tenantSubdomain = extractTenantSubdomain(req.headers.get("host"))
  const college = await db.college.findUnique({
    where: { id: collegeId },
    select: { id: true, subdomain: true, status: true },
  })

  if (!college) {
    return NextResponse.redirect(new URL("/signup?error=oauth_college_invalid", url))
  }

  if (tenantSubdomain && college.subdomain !== tenantSubdomain) {
    return NextResponse.redirect(new URL("/signup?error=oauth_tenant_mismatch", url))
  }

  if (college.status !== "active") {
    return NextResponse.redirect(new URL("/signup?error=college_suspended", url))
  }

  const response = NextResponse.redirect(new URL(`/api/auth/signin/${provider}?callbackUrl=/student/dashboard`, url))
  response.cookies.set("oauth_college_id", college.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  })

  return response
}
