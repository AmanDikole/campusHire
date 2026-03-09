import { db } from "@/lib/db"

export const HR_MONTHLY_PLAN_INR = 999
export const HR_TRIAL_DAYS = 7
const TRIAL_ENDING_SOON_DAYS = 2

export type HrAccessState = {
  allowed: boolean
  reason?: "trial_ended" | "payment_required"
  planStatus: "trialing" | "active" | "past_due" | "expired" | "canceled" | "none"
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  daysLeftInTrial: number | null
  isTrialEndingSoon: boolean
}

function addDays(base: Date, days: number) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

function ceilDaysRemaining(target: Date, now: Date) {
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export async function ensureHrTrialInitialized(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      planStatus: true,
      trialEndsAt: true,
      planStartedAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  })

  if (!user || user.role !== "hr" || user.planStatus) {
    return user
  }

  const now = new Date()
  const trialEndsAt = addDays(now, HR_TRIAL_DAYS)

  return db.user.update({
    where: { id: user.id },
    data: {
      planStatus: "trialing",
      planStartedAt: now,
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: trialEndsAt,
    },
    select: {
      id: true,
      role: true,
      planStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  })
}

export async function getHrAccessState(userId: string): Promise<HrAccessState> {
  const initialized = await ensureHrTrialInitialized(userId)

  if (!initialized) {
    return {
      allowed: false,
      reason: "payment_required",
      planStatus: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      daysLeftInTrial: null,
      isTrialEndingSoon: false,
    }
  }

  if (initialized.role !== "hr") {
    return {
      allowed: true,
      planStatus: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      daysLeftInTrial: null,
      isTrialEndingSoon: false,
    }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      planStatus: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  })

  if (!user || !user.planStatus) {
    return {
      allowed: false,
      reason: "payment_required",
      planStatus: "none",
      trialEndsAt: null,
      currentPeriodEnd: null,
      daysLeftInTrial: null,
      isTrialEndingSoon: false,
    }
  }

  const now = new Date()
  const status = user.planStatus
  const trialEndsAt = user.trialEndsAt
  const currentPeriodEnd = user.currentPeriodEnd

  if (status === "active") {
    const allowed = !currentPeriodEnd || currentPeriodEnd.getTime() >= now.getTime()
    return {
      allowed,
      reason: allowed ? undefined : "payment_required",
      planStatus: status,
      trialEndsAt,
      currentPeriodEnd,
      daysLeftInTrial: null,
      isTrialEndingSoon: false,
    }
  }

  if (status === "trialing") {
    if (!trialEndsAt) {
      return {
        allowed: false,
        reason: "payment_required",
        planStatus: status,
        trialEndsAt: null,
        currentPeriodEnd,
        daysLeftInTrial: null,
        isTrialEndingSoon: false,
      }
    }

    const daysLeft = ceilDaysRemaining(trialEndsAt, now)
    const allowed = daysLeft >= 0

    if (!allowed) {
      await db.user.update({
        where: { id: userId },
        data: { planStatus: "expired" },
      })
    }

    return {
      allowed,
      reason: allowed ? undefined : "trial_ended",
      planStatus: allowed ? status : "expired",
      trialEndsAt,
      currentPeriodEnd,
      daysLeftInTrial: allowed ? daysLeft : 0,
      isTrialEndingSoon: allowed && daysLeft <= TRIAL_ENDING_SOON_DAYS,
    }
  }

  return {
    allowed: false,
    reason: "payment_required",
    planStatus: status,
    trialEndsAt,
    currentPeriodEnd,
    daysLeftInTrial: null,
    isTrialEndingSoon: false,
  }
}
