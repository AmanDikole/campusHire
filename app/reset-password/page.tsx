import { ResetPasswordForm } from "@/components/ResetPasswordForm"
import { KeyRound } from "lucide-react"
import Link from "next/link"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = await searchParams
  const token = params.token || ""

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-xl shadow-gray-200 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2">Set a new password for your account.</p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">Invalid reset token.</p>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          Back to <Link href="/login" className="font-bold text-black hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
