import { auth } from "@/auth"
import { db } from "@/lib/db"
import { getHrAccessState, HR_MONTHLY_PLAN_INR } from "@/lib/hr-billing"
import { getRazorpayClient, getRazorpayPlanId } from "@/lib/razorpay"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()

  if (!session?.user || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await getHrAccessState(session.user.id)

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        collegeId: true,
        razorpaySubscriptionId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    if (!keyId) {
      return NextResponse.json({ error: "Razorpay key is missing" }, { status: 500 })
    }

    const razorpay = getRazorpayClient()
    const planId = getRazorpayPlanId()
    let subscriptionId = user.razorpaySubscriptionId?.trim() || null

    if (subscriptionId) {
      try {
        const existing = await razorpay.subscriptions.fetch(subscriptionId)
        const existingStatus = String(existing.status || "").toLowerCase()

        if (existingStatus === "active") {
          return NextResponse.json(
            { error: "An active subscription already exists for this account." },
            { status: 400 }
          )
        }

        if (!["created", "authenticated"].includes(existingStatus)) {
          subscriptionId = null
          await db.user.update({
            where: { id: session.user.id },
            data: { razorpaySubscriptionId: null },
          })
        }
      } catch {
        subscriptionId = null
        await db.user.update({
          where: { id: session.user.id },
          data: { razorpaySubscriptionId: null },
        })
      }
    }

    if (!subscriptionId) {
      const created = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 120,
        quantity: 1,
        notes: {
          userId: session.user.id,
          collegeId: user.collegeId,
        },
      })

      subscriptionId = created.id

      await db.user.update({
        where: { id: session.user.id },
        data: {
          razorpaySubscriptionId: subscriptionId,
        },
      })
    }

    return NextResponse.json({
      keyId,
      subscriptionId,
      amountInr: HR_MONTHLY_PLAN_INR,
      email: user.email,
    })
  } catch (error) {
    console.error("Create Razorpay subscription error:", error)
    const message = error instanceof Error ? error.message : "Failed to create subscription"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
