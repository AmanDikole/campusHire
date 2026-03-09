import type { HrAccessState } from "@/lib/hr-billing"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export function HrTrialBanner({ access }: { access: HrAccessState }) {
  if (!(access.planStatus === "trialing" && access.isTrialEndingSoon)) {
    return null
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle size={16} />
          Trial ends in {access.daysLeftInTrial} day(s). Upgrade to keep HR features active.
        </p>
        <Link href="/hr/billing" className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">
          Upgrade Now
        </Link>
      </div>
    </div>
  )
}
