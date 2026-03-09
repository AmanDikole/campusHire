import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Layers3,
  ShieldCheck,
} from "lucide-react"

const TRUSTED_CAMPUSES = ["MIT WPU", "COEP Tech", "IIT Bombay", "VIT Pune", "PICT", "NIT Trichy"]

const FEATURE_CARDS = [
  {
    title: "Tenant-Safe by Design",
    description:
      "Every college runs in isolated space with strict role checks, scoped data access, and clean audit history.",
    icon: ShieldCheck,
    tone: "from-cyan-50 to-sky-100 text-sky-700",
  },
  {
    title: "Placement Pipeline Control",
    description:
      "Create drives, define eligibility, and move applicants through shortlist, interview, and selection workflows.",
    icon: BriefcaseBusiness,
    tone: "from-amber-50 to-orange-100 text-orange-700",
  },
  {
    title: "Actionable Analytics",
    description:
      "Track job conversion, offer ratios, and participation trends with role-wise and branch-wise reporting.",
    icon: BarChart3,
    tone: "from-emerald-50 to-teal-100 text-teal-700",
  },
] as const

const PLAN_FEATURES = [
  "Unlimited HR job postings",
  "Applicant pipeline with status tracking",
  "Drive-wise dashboard insights",
  "Automated student notifications",
  "Secure tenant-level data isolation",
  "TPO and student access remains free",
]

export default function LandingPage() {
  return (
    <main className="min-h-screen text-slate-900 selection:bg-slate-900 selection:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(80rem_30rem_at_50%_-5%,rgba(16,185,129,0.16),transparent),radial-gradient(70rem_22rem_at_80%_10%,rgba(249,115,22,0.14),transparent)]" />

      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-content-center rounded-xl bg-slate-900 text-white">
              <Building2 size={18} />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-slate-900">CampusHire</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Trusted by 50+ colleges
          </p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Campus placements,
            <span className="block text-slate-500">without spreadsheet chaos.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Run a full placement lifecycle from one portal. Students apply faster, HR manages hiring stages cleanly, and
            TPO teams get live visibility.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start free trial
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Open live portal
            </Link>
          </div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-display text-2xl font-semibold text-slate-900">7 days</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">HR trial</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-display text-2xl font-semibold text-slate-900">INR 999</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">per month</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-display text-2xl font-semibold text-slate-900">100%</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">tenant scoped</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-amber-100/80 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Layers3 size={14} />
              Platform snapshot
            </p>
            <h2 className="mt-4 font-display text-2xl font-semibold text-slate-900">What teams use daily</h2>
            <div className="mt-6 space-y-3">
              {[
                "Student profile and resume verification",
                "Eligibility-based job matching",
                "HR applicant status updates",
                "TPO reporting and drive tracking",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                >
                  <CheckCircle2 size={16} className="mt-0.5 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/80 py-12">
        <div className="mx-auto w-full max-w-7xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Active across institutions
          </p>
          <div className="mt-7 grid grid-cols-2 gap-4 text-center sm:grid-cols-3 lg:grid-cols-6">
            {TRUSTED_CAMPUSES.map((campus) => (
              <div
                key={campus}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {campus}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Core capabilities</p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-slate-900">Built for campus workflows</h2>
          </div>
          <p className="max-w-md text-sm text-slate-600">
            The platform is role-aware by default, so students, HR recruiters, and TPO teams each get focused workflows.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURE_CARDS.map(({ title, description, icon: Icon, tone }) => (
            <article
              key={title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-br p-3 ${tone}`}>
                <Icon size={22} />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-300/60 md:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-200">
              <CreditCard size={14} />
              HR paid plan
            </p>
            <p className="mt-7 font-display text-5xl font-semibold tracking-tight">INR 999</p>
            <p className="mt-1 text-sm text-slate-300">Monthly subscription after 7-day trial.</p>
            <p className="mt-5 text-sm leading-relaxed text-slate-300">
              One transparent plan for recruiters to post jobs, track applicants, and run placement hiring in a single workflow.
            </p>
            <div className="mt-7 space-y-3">
              <Link
                href="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Start 7-day trial
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/hr/billing"
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open billing page
              </Link>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10">
            <h3 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Plan includes</h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PLAN_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="inline-flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <Check size={16} className="mt-0.5 text-emerald-600" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
              Trial starts automatically for HR users. Payment is required only after trial ends.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/70 md:p-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-44 w-[36rem] -translate-x-1/2 bg-gradient-to-b from-emerald-100/80 to-transparent blur-2xl" />
          <div className="relative">
            <h2 className="font-display text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Ready to modernize placements?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Launch your campus portal with secure role-based workflows for students, HR recruiters, and placement officers.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Start platform setup
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row">
          <p>(c) 2026 CampusHire Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-slate-900">
              Privacy
            </a>
            <a href="#" className="transition hover:text-slate-900">
              Terms
            </a>
            <a href="#" className="transition hover:text-slate-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
