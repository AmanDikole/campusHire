import { auth } from "@/auth"
import { AdminSidebar } from "@/components/AdminSidebar"
import { TpoPlanCheckoutButton } from "@/components/TpoPlanCheckoutButton"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { ensureSaasPlans, getCollegePlanUsage } from "@/lib/saas"
import { redirect } from "next/navigation"

function limitLabel(limit: number | null) {
  return limit === null ? "Unlimited" : String(limit)
}

function dateLabel(value: Date | null | undefined) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(value)
}

export default async function TpoBillingPage() {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) redirect("/login")

  await ensureSaasPlans()

  const [usageContext, plans] = await Promise.all([
    getCollegePlanUsage(session.user.collegeId),
    db.plan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceInr: "asc" },
    }),
  ])

  const current = usageContext.subscription
  const usage = usageContext.usage

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
            <p className="mt-2 text-gray-500">Manage plan upgrades, limits, and subscription lifecycle for your college tenant.</p>
          </div>

          <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                <p className="mt-1 text-2xl font-bold capitalize text-gray-900">{current.plan.name}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Status: <span className="font-semibold capitalize">{current.status}</span> | Payment:{" "}
                  <span className="font-semibold capitalize">{current.paymentStatus}</span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Student Usage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {usage.studentCount}/{limitLabel(current.plan.studentLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Job Posting Usage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {usage.jobCount}/{limitLabel(current.plan.jobLimit)}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Subscription window: {dateLabel(current.startDate)} to {dateLabel(current.endDate)}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === current.planId && ["active", "trialing", "past_due", "pending"].includes(current.status)
              const isFree = plan.key === "free"
              return (
                <div key={plan.id} className={`rounded-2xl border p-5 ${isCurrent ? "border-black bg-white shadow-lg shadow-gray-200" : "border-gray-200 bg-white"}`}>
                  <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">{plan.name}</p>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900">
                    {plan.monthlyPriceInr === 0 ? "Rs. 0" : `Rs. ${plan.monthlyPriceInr}`}
                  </p>
                  <p className="text-xs text-gray-500">per month</p>

                  <ul className="mt-4 space-y-1 text-sm text-gray-600">
                    <li>Students: {limitLabel(plan.studentLimit)}</li>
                    <li>Jobs: {limitLabel(plan.jobLimit)}</li>
                    <li>Analytics: {plan.analyticsAccess ? "Yes" : "No"}</li>
                  </ul>

                  <div className="mt-5">
                    {isCurrent ? (
                      <span className="inline-flex rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white">Current Plan</span>
                    ) : isFree ? (
                      <span className="inline-flex rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600">Default Plan</span>
                    ) : (
                      <TpoPlanCheckoutButton planKey={plan.key as "basic" | "pro" | "enterprise"} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
