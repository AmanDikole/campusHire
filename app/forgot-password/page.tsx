import { ForgotPasswordForm } from "@/components/ForgotPasswordForm"
import { db } from "@/lib/db"
import { extractTenantSubdomain } from "@/lib/tenant"
import { KeyRound } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"

export default async function ForgotPasswordPage() {
  const tenantSubdomain = extractTenantSubdomain((await headers()).get("host"))

  const colleges = await db.college.findMany({
    where: tenantSubdomain ? { subdomain: tenantSubdomain } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl shadow-gray-200 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-2">We&apos;ll send a secure reset link to your email.</p>
        </div>

        <ForgotPasswordForm colleges={colleges} />

        <div className="mt-6 text-center text-sm text-gray-500">
          Back to <Link href="/login" className="font-bold text-black hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
