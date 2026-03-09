'use client'

import { requestPasswordResetAction } from "@/actions/request-password-reset"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2, Mail, School } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function ForgotPasswordForm({ colleges }: { colleges: { id: string; name: string }[] }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("origin", window.location.origin)

    const result = await requestPasswordResetAction(formData)
    if (result.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success(result.success)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold text-gray-700 ml-1">College</label>
        <div className="relative mt-1">
          <School className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <select
            name="collegeId"
            required
            defaultValue=""
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-black/5"
          >
            <option value="" disabled>Choose your campus...</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-black/5"
            placeholder="student@college.edu"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black py-3.5 font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </form>
  )
}
