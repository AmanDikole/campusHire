'use client'

import { onboardCollegeAction } from "@/actions/onboard-college"
import { toUserFriendlyError } from "@/lib/user-feedback"
import { Building2, Loader2, Mail, MapPin, Phone, ShieldUser } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function OnboardCollegeForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await onboardCollegeAction(formData)

    if (result?.error) {
      toast.error(toUserFriendlyError(result.error))
      setLoading(false)
      return
    }

    toast.success("Onboarding completed. Please sign in as TPO.")
    router.push("/login?onboard=success")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">College Name</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input name="collegeName" required className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5" placeholder="MIT World Peace University" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="ml-1 text-sm font-semibold text-gray-700">Subdomain</label>
          <input name="subdomain" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" placeholder="mit" />
        </div>
        <div className="space-y-1">
          <label className="ml-1 text-sm font-semibold text-gray-700">Phone</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input name="phone" required className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5" placeholder="+91 9876543210" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="ml-1 text-sm font-semibold text-gray-700">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input name="location" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5" placeholder="Pune, India" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="ml-1 text-sm font-semibold text-gray-700">Website</label>
          <input name="website" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" placeholder="https://college.edu" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">College Details</label>
        <textarea name="details" className="h-24 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" placeholder="Accreditations, departments, and placement highlights." />
      </div>

      <div className="border-t border-gray-100 pt-2" />

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">TPO Name</label>
        <div className="relative">
          <ShieldUser className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input name="tpoName" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5" placeholder="Training & Placement Officer" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">TPO Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input name="email" type="email" required className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-black/5" placeholder="tpo@college.edu" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="ml-1 text-sm font-semibold text-gray-700">Password</label>
        <input name="password" type="password" minLength={8} required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-black/5" placeholder="Minimum 8 characters" />
      </div>

      <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3.5 font-bold text-white shadow-lg shadow-gray-200 transition hover:bg-zinc-800 disabled:opacity-60">
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Creating Tenant..." : "Start Free Trial"}
      </button>
    </form>
  )
}
