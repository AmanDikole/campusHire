'use client'

import { resetPasswordAction } from "@/actions/reset-password"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const pass = formData.get("password") as string
    const confirm = formData.get("confirmPassword") as string

    if (pass !== confirm) {
      toast.error("Passwords do not match.")
      setLoading(false)
      return
    }

    const result = await resetPasswordAction(formData)
    if (result.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success(result.success)
    router.push("/login")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-black/5"
            placeholder="Minimum 8 characters"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-black/5"
            placeholder="Repeat password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black py-3.5 font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  )
}
