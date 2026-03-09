import { LoginForm } from "@/components/LoginForm"
import { db } from "@/lib/db"
import { extractTenantSubdomain } from "@/lib/tenant"
import { Building2, ShieldCheck, Sparkles, Workflow } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import type { ReactNode } from "react"

export default async function LoginPage() {
  const host = (await headers()).get("host") || ""
  const tenantSubdomain = extractTenantSubdomain(host)

  const colleges = await db.college.findMany({
    where: tenantSubdomain ? { subdomain: tenantSubdomain } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 p-4">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-200/60 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="hidden rounded-[2rem] border border-slate-200 bg-white/85 p-10 shadow-lg shadow-slate-200/60 backdrop-blur lg:block">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-content-center rounded-lg bg-slate-900 text-white">
              <Building2 size={18} />
            </span>
            <span className="font-display text-lg font-semibold text-slate-900">CampusHire</span>
          </Link>
          <h1 className="mt-7 font-display text-4xl font-semibold tracking-tight text-slate-900">
            Secure college sign in, built for placement teams.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Access student pipelines, recruiter workflows, and campus analytics from one role-aware portal.
          </p>

          <div className="mt-8 space-y-3">
            <FeatureRow
              icon={<ShieldCheck size={16} className="text-emerald-700" />}
              text="Tenant isolation on every request"
            />
            <FeatureRow
              icon={<Workflow size={16} className="text-orange-700" />}
              text="Application lifecycle tracking"
            />
            <FeatureRow icon={<Sparkles size={16} className="text-sky-700" />} text="Modern dashboard experience" />
          </div>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 md:p-10">
          <div className="mb-7 text-center">
            <div className="mx-auto grid h-12 w-12 place-content-center rounded-xl bg-slate-900 text-white">
              <Building2 size={22} />
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in to continue to your campus workspace.</p>
            {tenantSubdomain && (
              <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <ShieldCheck size={12} />
                Tenant: {tenantSubdomain}
              </p>
            )}
          </div>

          <LoginForm colleges={colleges} />

          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <span className="mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  )
}
