import { db } from "@/lib/db"

type PlanSeed = {
  key: "free" | "basic" | "pro" | "enterprise"
  name: string
  monthlyPriceInr: number
  studentLimit: number | null
  jobLimit: number | null
  analyticsAccess: boolean
}

const PLAN_SEEDS: PlanSeed[] = [
  { key: "free", name: "Free", monthlyPriceInr: 0, studentLimit: 100, jobLimit: 5, analyticsAccess: false },
  { key: "basic", name: "Basic", monthlyPriceInr: 1999, studentLimit: 500, jobLimit: 20, analyticsAccess: true },
  { key: "pro", name: "Pro", monthlyPriceInr: 4999, studentLimit: null, jobLimit: null, analyticsAccess: true },
  { key: "enterprise", name: "Enterprise", monthlyPriceInr: 9999, studentLimit: null, jobLimit: null, analyticsAccess: true },
]

export const FREE_TRIAL_DAYS = 14

function addDays(base: Date, days: number) {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

export async function ensureSaasPlans() {
  await Promise.all(
    PLAN_SEEDS.map((plan) =>
      db.plan.upsert({
        where: { key: plan.key },
        update: {
          name: plan.name,
          monthlyPriceInr: plan.monthlyPriceInr,
          studentLimit: plan.studentLimit,
          jobLimit: plan.jobLimit,
          analyticsAccess: plan.analyticsAccess,
          isActive: true,
        },
        create: {
          key: plan.key,
          name: plan.name,
          monthlyPriceInr: plan.monthlyPriceInr,
          studentLimit: plan.studentLimit,
          jobLimit: plan.jobLimit,
          analyticsAccess: plan.analyticsAccess,
          isActive: true,
        },
      })
    )
  )
}

export async function getPlanByKey(key: "free" | "basic" | "pro" | "enterprise") {
  await ensureSaasPlans()
  return db.plan.findUnique({ where: { key } })
}

export async function createFreeTrialForCollege(collegeId: string) {
  const freePlan = await getPlanByKey("free")
  if (!freePlan) throw new Error("Free plan missing")

  const now = new Date()
  const trialEndsAt = addDays(now, FREE_TRIAL_DAYS)

  return db.collegeSubscription.create({
    data: {
      collegeId,
      planId: freePlan.id,
      status: "trialing",
      paymentStatus: "none",
      startDate: now,
      endDate: trialEndsAt,
      trialEndsAt,
    },
    include: {
      plan: true,
    },
  })
}

export async function ensureCollegeSubscription(collegeId: string) {
  await ensureSaasPlans()

  const current = await db.collegeSubscription.findFirst({
    where: {
      collegeId,
      status: {
        in: ["active", "trialing", "past_due"],
      },
    },
    include: { plan: true, college: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  })

  if (current) return current

  const pending = await db.collegeSubscription.findFirst({
    where: {
      collegeId,
      status: "pending",
    },
    include: { plan: true, college: { select: { status: true } } },
    orderBy: { createdAt: "desc" },
  })

  if (pending) return pending

  const created = await createFreeTrialForCollege(collegeId)
  return {
    ...created,
    college: { status: "active" as const },
  }
}

export async function getCollegePlanContext(collegeId: string) {
  const subscription = await ensureCollegeSubscription(collegeId)
  const now = new Date()

  if (
    subscription.status === "trialing" &&
    subscription.trialEndsAt &&
    subscription.trialEndsAt.getTime() < now.getTime()
  ) {
    if (subscription.plan.key === "free") {
      const rolled = await db.collegeSubscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          paymentStatus: "none",
          trialEndsAt: null,
          endDate: null,
        },
        include: { plan: true, college: { select: { status: true } } },
      })
      return rolled
    }

    const expired = await db.collegeSubscription.update({
      where: { id: subscription.id },
      data: {
        status: "expired",
      },
      include: { plan: true, college: { select: { status: true } } },
    })
    return expired
  }

  return subscription
}

export async function getCollegeUsage(collegeId: string) {
  const [studentCount, jobCount] = await Promise.all([
    db.user.count({ where: { collegeId, role: "student" } }),
    db.job.count({ where: { collegeId } }),
  ])

  return { studentCount, jobCount }
}

export async function getCollegePlanUsage(collegeId: string) {
  const [subscription, usage] = await Promise.all([
    getCollegePlanContext(collegeId),
    getCollegeUsage(collegeId),
  ])

  return {
    subscription,
    usage,
    limits: {
      studentLimit: subscription.plan.studentLimit,
      jobLimit: subscription.plan.jobLimit,
      analyticsAccess: subscription.plan.analyticsAccess,
    },
  }
}

export async function ensureCollegeCanAddStudent(collegeId: string) {
  const { subscription, usage, limits } = await getCollegePlanUsage(collegeId)

  if (subscription.college.status !== "active") {
    return { allowed: false, error: "College account is suspended. Contact platform admin." }
  }

  const studentLimit = limits.studentLimit
  if (studentLimit !== null && usage.studentCount >= studentLimit) {
    return { allowed: false, error: `Student limit reached for ${subscription.plan.name} plan. Please upgrade.` }
  }

  return { allowed: true as const, subscription, usage }
}

export async function ensureCollegeCanPostJob(collegeId: string) {
  const { subscription, usage, limits } = await getCollegePlanUsage(collegeId)

  if (subscription.college.status !== "active") {
    return { allowed: false, error: "College account is suspended. Contact platform admin." }
  }

  const jobLimit = limits.jobLimit
  if (jobLimit !== null && usage.jobCount >= jobLimit) {
    return { allowed: false, error: `Job posting limit reached for ${subscription.plan.name} plan. Please upgrade.` }
  }

  return { allowed: true as const, subscription, usage }
}

export function getRazorpayCollegePlanId(planKey: string) {
  if (planKey === "basic") return process.env.RAZORPAY_COLLEGE_BASIC_PLAN_ID || null
  if (planKey === "pro") return process.env.RAZORPAY_COLLEGE_PRO_PLAN_ID || null
  if (planKey === "enterprise") return process.env.RAZORPAY_COLLEGE_ENTERPRISE_PLAN_ID || null
  return null
}
