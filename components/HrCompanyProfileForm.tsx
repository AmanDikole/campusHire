"use client"

import { updateCompanyProfileAction } from "@/actions/update-company-profile"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function HrCompanyProfileForm({ initialCompanyName }: { initialCompanyName?: string | null }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await updateCompanyProfileAction(formData)
    if (result.success) {
      toast.success("Company profile updated.")
    } else {
      toast.error(toUserFriendlyError(result.error || "Update failed."))
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Company Name</label>
        <input
          name="companyName"
          defaultValue={initialCompanyName || ""}
          required
          minLength={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5"
          placeholder="Enter company name"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Saving..." : "Save Company Profile"}
      </button>
    </form>
  )
}
