import { auth } from "@/auth"
import { db } from "@/lib/db"
import { isTpoRole } from "@/lib/rbac"
import { ensureSaasPlans, getCollegePlanContext, getPlanByKey, getRazorpayCollegePlanId } from "@/lib/saas"
import { getRazorpayClient } from "@/lib/razorpay"
import { NextResponse } from "next/server"

type RequestBody = {
  planKey?: "basic" | "pro" | "enterprise"
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !isTpoRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as RequestBody
  const planKey = body.planKey

  if (!planKey || !["basic", "pro", "enterprise"].includes(planKey)) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 })
  }

  try {
    await ensureSaasPlans()

    const [plan, currentSubscription, user] = await Promise.all([
      getPlanByKey(planKey),
      getCollegePlanContext(session.user.collegeId),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      }),
    ])

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Selected plan is not available." }, { status: 404 })
    }

    if (currentSubscription.college.status !== "active") {
      return NextResponse.json({ error: "College is suspended. Contact platform admin." }, { status: 403 })
    }

    if (currentSubscription.plan.key === planKey && ["active", "trialing"].includes(currentSubscription.status)) {
      return NextResponse.json({ error: "This plan is already active for your college." }, { status: 400 })
    }

    const razorpayPlanId = getRazorpayCollegePlanId(planKey)
    if (!razorpayPlanId) {
      return NextResponse.json({ error: "Razorpay plan ID is missing for selected plan." }, { status: 500 })
    }

    const razorpayKey = process.env.RAZORPAY_KEY_ID
    if (!razorpayKey) {
      return NextResponse.json({ error: "Razorpay key is missing." }, { status: 500 })
    }

    const pendingRecord = await db.collegeSubscription.create({
      data: {
        collegeId: session.user.collegeId,
        planId: plan.id,
        status: "pending",
        paymentStatus: "pending",
        startDate: new Date(),
      },
    })

    const razorpay = getRazorpayClient()
    const created = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 120,
      quantity: 1,
      notes: {
        collegeId: session.user.collegeId,
        collegeSubscriptionId: pendingRecord.id,
        planKey,
      },
    })

    await db.collegeSubscription.update({
      where: { id: pendingRecord.id },
      data: {
        razorpaySubscriptionId: created.id,
      },
    })

    return NextResponse.json({
      keyId: razorpayKey,
      subscriptionId: created.id,
      planKey,
      planName: plan.name,
      amountInr: plan.monthlyPriceInr,
      email: user?.email || "",
    })
  } catch (error) {
    console.error("College subscription create error:", error)
    const message = error instanceof Error ? error.message : "Failed to start subscription checkout."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
