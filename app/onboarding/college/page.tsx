import { OnboardCollegeForm } from "@/components/OnboardCollegeForm"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default function CollegeOnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4">
      <div className="mx-auto max-w-3xl py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white shadow-lg shadow-gray-300">
            <Building2 size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">College SaaS Onboarding</h1>
          <p className="mt-2 text-sm text-gray-500">Register your college tenant and start with a free trial plan.</p>
        </div>

        <OnboardCollegeForm />

        <p className="mt-6 text-center text-sm text-gray-500">
          Already onboarded?{" "}
          <Link href="/login" className="font-bold text-black hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
