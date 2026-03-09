import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import { extractTenantSubdomain } from "@/lib/tenant"
import { isTpoRole } from "@/lib/rbac"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (req.headers.get("next-action")) {
    return NextResponse.next()
  }

  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role
  const isTpo = isTpoRole(userRole)
  const collegeStatus = req.auth?.user?.collegeStatus

  const pathname = req.nextUrl.pathname
  const isOnAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup")
  const isOnTpoArea = pathname.startsWith("/admin") || pathname.startsWith("/tpo")
  const isOnStudentArea = pathname.startsWith("/student")
  const isOnHrArea = pathname.startsWith("/hr")
  const isRootPage = pathname === "/"

  const tenantSubdomain = extractTenantSubdomain(req.headers.get("host"))
  const sessionSubdomain = req.auth?.user?.collegeSubdomain

  if (tenantSubdomain && isLoggedIn && sessionSubdomain && tenantSubdomain !== sessionSubdomain) {
    return NextResponse.redirect(new URL("/login?error=tenant_mismatch", req.nextUrl))
  }

  if (isLoggedIn && collegeStatus && collegeStatus !== "active" && !isOnAuthPage) {
    return NextResponse.redirect(new URL("/login?error=college_suspended", req.nextUrl))
  }

  if (isLoggedIn && collegeStatus === "active" && (isOnAuthPage || isRootPage)) {
    if (isTpo) {
      return NextResponse.redirect(new URL("/tpo/dashboard", req.nextUrl))
    }
    if (userRole === "hr") {
      return NextResponse.redirect(new URL("/hr/dashboard", req.nextUrl))
    }
    return NextResponse.redirect(new URL("/student/dashboard", req.nextUrl))
  }

  if (!isLoggedIn && (isOnTpoArea || isOnStudentArea || isOnHrArea)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isLoggedIn) {
    if (isOnTpoArea && !isTpo) {
      return NextResponse.redirect(new URL(userRole === "hr" ? "/hr/dashboard" : "/student/dashboard", req.nextUrl))
    }
    if (isOnHrArea && userRole !== "hr") {
      return NextResponse.redirect(new URL(isTpo ? "/tpo/dashboard" : "/student/dashboard", req.nextUrl))
    }
    if (isOnStudentArea && userRole !== "student") {
      return NextResponse.redirect(new URL(isTpo ? "/tpo/dashboard" : "/hr/dashboard", req.nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
