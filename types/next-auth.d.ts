import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      collegeId: string
      collegeSubdomain?: string
      collegeStatus?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    collegeId: string
    collegeSubdomain?: string
    collegeStatus?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    collegeId: string
    collegeSubdomain?: string
    collegeStatus?: string
  }
}
