'use client'

import { registerAction } from "@/actions/register"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { AlertTriangle, Loader2, Lock, Mail, School } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type CollegeOption = { id: string; name: string }
type OAuthProviders = { google: boolean; github: boolean }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getPasswordValidationError(password: string) {
  if (password.length < 8) return "Password must be at least 8 characters."
  if (password.length > 72) return "Password must be 72 characters or fewer."
  if (!/[a-z]/.test(password)) return "Password must include at least one lowercase letter."
  if (!/[A-Z]/.test(password)) return "Password must include at least one uppercase letter."
  if (!/[0-9]/.test(password)) return "Password must include at least one number."
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character."
  return null
}

export function RegisterForm({
  colleges,
  tenantSubdomain,
  oauthProviders,
}: {
  colleges: CollegeOption[]
  tenantSubdomain?: string | null
  oauthProviders: OAuthProviders
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<null | "google" | "github">(null)
  const hasColleges = colleges.length > 0
  const defaultCollegeId = useMemo(() => (colleges.length === 1 ? colleges[0].id : ""), [colleges])
  const [selectedCollegeId, setSelectedCollegeId] = useState(defaultCollegeId)
  const hasOauthProviders = oauthProviders.google || oauthProviders.github
  const errorCode = searchParams.get("error")

  useEffect(() => {
    setSelectedCollegeId(defaultCollegeId)
  }, [defaultCollegeId])

  useEffect(() => {
    if (!errorCode) return
    if (errorCode === "oauth_college_required") toast.error("Select a college before continuing with OAuth.")
    if (errorCode === "oauth_tenant_mismatch") toast.error("Selected college does not match this tenant.")
    if (errorCode === "oauth_not_configured") toast.error("OAuth provider is not configured yet.")
    if (errorCode === "oauth_email_missing") toast.error("OAuth account did not return an email address.")
    if (errorCode === "oauth_college_invalid") toast.error("Selected college is invalid.")
    if (errorCode === "oauth_invalid_provider") toast.error("Invalid OAuth provider.")
  }, [errorCode])

  const startOAuth = (provider: "google" | "github") => {
    if (!selectedCollegeId) {
      toast.error("Please select a college first.")
      return
    }

    setOauthLoading(provider)
    const params = new URLSearchParams({ provider, collegeId: selectedCollegeId })
    window.location.href = `/api/auth/oauth/start?${params.toString()}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formEl = e.currentTarget
    const formData = new FormData(formEl)
    const collegeId = selectedCollegeId || (formData.get("collegeId") as string)?.trim()
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = (formData.get("password") as string) || ""
    const confirmPassword = (formData.get("confirmPassword") as string) || ""

    if (!hasColleges || !collegeId) {
      toast.error("No active college found for this tenant.")
      return
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address.")
      return
    }

    const passwordError = getPasswordValidationError(password)
    if (passwordError) {
      toast.error(passwordError)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    formData.set("collegeId", collegeId)
    formData.set("email", email)
    formData.set("role", "student")

    setLoading(true)
    const result = await registerAction(formData)

    if (result.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success("Registration successful. Please sign in.")
    router.push("/login")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Select College</label>
        <div className="relative">
          <School className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <select
            name="collegeId"
            required
            disabled={!hasColleges || loading || Boolean(oauthLoading) || (Boolean(tenantSubdomain) && colleges.length === 1)}
            value={selectedCollegeId}
            onChange={(event) => setSelectedCollegeId(event.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              {hasColleges ? "Choose your campus..." : "No campus available"}
            </option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>
                {college.name}
              </option>
            ))}
          </select>
        </div>
        {!hasColleges && (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertTriangle size={12} /> No active college found for this tenant.
          </p>
        )}
      </div>

      <input type="hidden" name="role" value="student" />

      <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Student self-registration only. HR and TPO users are created by college admins.
      </p>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
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
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
            placeholder="Minimum 8 characters"
          />
        </div>
        <p className="text-[11px] text-slate-500">Use 8-72 chars with uppercase, lowercase, number, and special character.</p>
      </div>

      <div className="space-y-1.5">
        <label className="ml-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-200/60"
            placeholder="Re-enter password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !hasColleges || Boolean(oauthLoading)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-300/60 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Creating Account..." : "Sign Up"}
      </button>

      {hasOauthProviders && (
        <>
          <div className="relative py-1">
            <div className="h-px bg-slate-200" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-slate-500">
              or continue with
            </span>
          </div>

          {oauthProviders.google && (
            <button
              type="button"
              onClick={() => startOAuth("google")}
              disabled={loading || !hasColleges || !selectedCollegeId || Boolean(oauthLoading)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {oauthLoading === "google" && <Loader2 size={16} className="animate-spin" />}
              Continue with Google
            </button>
          )}

          {oauthProviders.github && (
            <button
              type="button"
              onClick={() => startOAuth("github")}
              disabled={loading || !hasColleges || !selectedCollegeId || Boolean(oauthLoading)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {oauthLoading === "github" && <Loader2 size={16} className="animate-spin" />}
              Continue with GitHub
            </button>
          )}
        </>
      )}
    </form>
  )
}
