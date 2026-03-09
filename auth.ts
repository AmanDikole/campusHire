import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { compare, hash } from "bcryptjs"
import { randomBytes } from "crypto"
import { cookies, headers } from "next/headers"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"
import { extractTenantSubdomain } from "@/lib/tenant"

const providers: NextAuthConfig["providers"] = [
  Credentials({
    authorize: async (credentials, request) => {
      const email = credentials.email as string
      const password = credentials.password as string
      const collegeId = credentials.collegeId as string

      if (!email || !password || !collegeId) return null

      const tenantSubdomain = extractTenantSubdomain(request?.headers?.get("host"))

      const user = await db.user.findFirst({
        where: {
          email,
          collegeId,
          ...(tenantSubdomain
            ? {
                college: {
                  subdomain: tenantSubdomain,
                },
              }
            : {}),
        },
        include: {
          college: {
            select: {
              subdomain: true,
              status: true,
            },
          },
        },
      })

      if (!user || !user.password) return null
      if (user.college.status !== "active") return null

      const passwordsMatch = await compare(password, user.password)
      if (!passwordsMatch) return null

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        collegeId: user.collegeId,
        collegeSubdomain: user.college.subdomain,
        collegeStatus: user.college.status,
      }
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  )
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  )
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true

      const email = user.email?.trim().toLowerCase()
      if (!email) return "/signup?error=oauth_email_missing"

      const host = (await headers()).get("host")
      const tenantSubdomain = extractTenantSubdomain(host)
      const cookieStore = await cookies()
      const preferredCollegeId = cookieStore.get("oauth_college_id")?.value || null

      let college = null as null | { id: string; subdomain: string; status: string }

      if (preferredCollegeId) {
        college = await db.college.findUnique({
          where: { id: preferredCollegeId },
          select: { id: true, subdomain: true, status: true },
        })
      }

      if (!college && tenantSubdomain) {
        college = await db.college.findUnique({
          where: { subdomain: tenantSubdomain },
          select: { id: true, subdomain: true, status: true },
        })
      }

      if (!college) {
        const candidates = await db.college.findMany({
          select: { id: true, subdomain: true, status: true },
          orderBy: { createdAt: "asc" },
          take: 2,
        })
        if (candidates.length === 1) {
          college = candidates[0]
        }
      }

      if (!college) return "/signup?error=oauth_college_required"
      if (tenantSubdomain && college.subdomain !== tenantSubdomain) return "/signup?error=oauth_tenant_mismatch"
      if (college.status !== "active") return "/login?error=college_suspended"

      let appUser = await db.user.findFirst({
        where: {
          email,
          collegeId: college.id,
        },
        include: {
          college: {
            select: {
              subdomain: true,
              status: true,
            },
          },
        },
      })

      if (!appUser) {
        const generatedPassword = randomBytes(24).toString("hex")
        const hashedPassword = await hash(generatedPassword, 12)
        const fallbackName = (user.name || email.split("@")[0] || "Student").slice(0, 80)

        appUser = await db.user.create({
          data: {
            email,
            password: hashedPassword,
            role: "student",
            collegeId: college.id,
            profile: {
              create: {
                fullName: fallbackName,
              },
            },
          },
          include: {
            college: {
              select: {
                subdomain: true,
                status: true,
              },
            },
          },
        })
      }

      ;(user as { id?: string }).id = appUser.id
      ;(user as { role?: string }).role = appUser.role
      ;(user as { collegeId?: string }).collegeId = appUser.collegeId
      ;(user as { collegeSubdomain?: string }).collegeSubdomain = appUser.college.subdomain
      ;(user as { collegeStatus?: string }).collegeStatus = appUser.college.status

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.collegeId = user.collegeId
        token.collegeSubdomain = (user as { collegeSubdomain?: string }).collegeSubdomain
        token.collegeStatus = (user as { collegeStatus?: string }).collegeStatus
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.collegeId = token.collegeId as string
        session.user.collegeSubdomain = token.collegeSubdomain as string
        session.user.collegeStatus = token.collegeStatus as string
      }
      return session
    },
  },
})
