import { RegisterForm } from "@/components/RegisterForm"
import { db } from "@/lib/db"
import { extractTenantSubdomain } from "@/lib/tenant"
import { Building2, CircleCheck, GraduationCap, UserCheck2 } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import type { ReactNode } from "react"

export default async function SignupPage() {
  const tenantSubdomain = extractTenantSubdomain((await headers()).get("host"))
  const oauthProviders = {
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
  }

  const colleges = await db.college.findMany({
    where: tenantSubdomain ? { subdomain: tenantSubdomain } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 p-4">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-200/60 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1fr_1fr]">
        <aside className="hidden rounded-[2rem] border border-slate-200 bg-white/85 p-10 shadow-lg shadow-slate-200/60 backdrop-blur lg:block">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-content-center rounded-lg bg-slate-900 text-white">
              <Building2 size={18} />
            </span>
            <span className="font-display text-lg font-semibold text-slate-900">CampusHire</span>
          </Link>
          <h1 className="mt-7 font-display text-4xl font-semibold tracking-tight text-slate-900">
            Student signup in minutes.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Register your student account and start applying to campus drives.
          </p>

          <div className="mt-8 space-y-3">
            <InfoRow
              icon={<GraduationCap size={16} className="text-sky-700" />}
              text="Students can start applications immediately"
            />
            <InfoRow icon={<UserCheck2 size={16} className="text-orange-700" />} text="HR and TPO accounts are admin-created" />
            <InfoRow icon={<CircleCheck size={16} className="text-emerald-700" />} text="Tenant-aware college selection" />
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 md:p-10">
          <div className="mb-7 text-center">
            <div className="mx-auto grid h-12 w-12 place-content-center rounded-xl bg-slate-900 text-white">
              <Building2 size={22} />
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900">Create account</h2>
            <p className="mt-2 text-sm text-slate-600">Register under your college and continue to sign in.</p>
            {tenantSubdomain && (
              <p className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Tenant: {tenantSubdomain}
              </p>
            )}
          </div>

          <RegisterForm colleges={colleges} tenantSubdomain={tenantSubdomain} oauthProviders={oauthProviders} />

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            New college onboarding?{" "}
            <Link href="/onboarding/college" className="font-semibold text-slate-700 underline-offset-4 hover:underline">
              Start here
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <span className="mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
