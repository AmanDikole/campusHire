import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.collegeId = user.collegeId
        token.collegeSubdomain = (user as { collegeSubdomain?: string }).collegeSubdomain
        token.collegeStatus = (user as { collegeStatus?: string }).collegeStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.collegeId = token.collegeId as string
        session.user.collegeSubdomain = token.collegeSubdomain as string
        session.user.collegeStatus = token.collegeStatus as string
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

