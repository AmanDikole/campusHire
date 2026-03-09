'use client'

import { signIn } from "next-auth/react"
import { toUserFriendlyError } from "@/lib/user-feedback"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Lock, Mail, School } from "lucide-react"

type CollegeOption = { id: string; name: string }

export function LoginForm({ colleges }: { colleges: CollegeOption[] }) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const defaultCollegeId = useMemo(() => (colleges.length === 1 ? colleges[0].id : ""), [colleges])

  useEffect(() => {
    if (searchParams.get("error") === "tenant_mismatch") {
      toast.error("Please login from your college subdomain.")
    }
    if (searchParams.get("error") === "college_suspended") {
      toast.error("Your college account is suspended. Contact platform admin.")
    }
    if (searchParams.get("onboard") === "success") {
      toast.success("College onboarding completed. Please sign in as TPO.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const collegeId = formData.get("collegeId") as string

    const result = await signIn("credentials", {
      email,
      password,
      collegeId,
      redirect: false,
    })

    if (result?.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success("Welcome back!")
    window.location.href = "/"
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Select College</label>
        <div className="relative">
          <School className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <select
            name="collegeId"
            required
            disabled={loading || colleges.length === 0}
            defaultValue={defaultCollegeId || ""}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              {colleges.length > 0 ? "Choose your campus..." : "No campus available"}
            </option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        </div>
        {colleges.length === 0 && (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertTriangle size={12} /> College list unavailable on this tenant.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
            placeholder="student@college.edu"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
            placeholder="********"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || colleges.length === 0}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-300/60 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="pt-1 text-center text-sm text-slate-600">
        Forgot password?{" "}
        <Link href="/forgot-password" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
          Reset it
        </Link>
      </div>
    </form>
  )
}
