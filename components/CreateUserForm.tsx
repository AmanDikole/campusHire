"use client"

import { registerAction } from "@/actions/register"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2, Lock, Mail, School, UserCircle2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type RoleOption = "student" | "hr" | "tpo"

export function CreateUserForm({
  collegeId,
  collegeName,
}: {
  collegeId: string
  collegeName: string
}) {
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<RoleOption>("hr")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formEl = e.currentTarget

    const formData = new FormData(formEl)
    const result = await registerAction(formData)

    if (result.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success("User account created successfully.")
    formEl.reset()
    setRole("hr")
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="collegeId" value={collegeId} />

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">College</label>
        <div className="relative">
          <School className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            value={collegeName}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-100 py-3 pl-10 pr-4 text-gray-700"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">Role</label>
        <div className="relative">
          <UserCircle2 className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <select
            name="role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as RoleOption)}
            disabled={loading}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-60"
          >
            <option value="student">Student</option>
            <option value="hr">HR (Company Recruiter)</option>
            <option value="tpo">TPO</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5"
            placeholder="user@college.edu"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5"
            placeholder="Minimum 8 characters"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 font-bold text-white shadow-lg shadow-gray-200 transition-all hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Creating..." : "Create User"}
      </button>
    </form>
  )
}
