import { auth } from "@/auth"
import { HrBillingCheckoutButton } from "@/components/HrBillingCheckoutButton"
import { HrSidebar } from "@/components/HrSidebar"
import { getHrAccessState, HR_MONTHLY_PLAN_INR } from "@/lib/hr-billing"
import { redirect } from "next/navigation"

function formatDate(date: Date | null) {
  if (!date) return "-"
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date)
}

export default async function HrBillingPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "hr") redirect("/login")

  const access = await getHrAccessState(session.user.id)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
      <HrSidebar />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
            <p className="mt-2 text-sm text-gray-600">Manage your HR subscription plan.</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Current status</p>
            <p className="mt-1 text-2xl font-bold capitalize text-gray-900">{access.planStatus}</p>
            {access.reason && (
              <p className="mt-2 text-sm text-red-600">
                {access.reason === "trial_ended" ? "Your trial has ended." : "Payment required to continue HR access."}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-gray-900">HR Monthly Plan</h2>
            <p className="mt-1 text-sm text-gray-600">Unlimited HR dashboard, job posting, and applicant management.</p>
            <p className="mt-4 text-3xl font-extrabold text-gray-900">Rs. {HR_MONTHLY_PLAN_INR}/month</p>
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600 md:grid-cols-2">
              <p>Trial ends: {formatDate(access.trialEndsAt)}</p>
              <p>Current period ends: {formatDate(access.currentPeriodEnd)}</p>
            </div>
            <div className="mt-6">
              <HrBillingCheckoutButton />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
