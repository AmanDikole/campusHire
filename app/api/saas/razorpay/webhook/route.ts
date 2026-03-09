import { db } from "@/lib/db"
import crypto from "crypto"
import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"

type RazorpaySubscriptionEntity = {
  id?: string
  current_start?: number
  current_end?: number
  created_at?: number
  notes?: { collegeSubscriptionId?: string }
}

type RazorpayPaymentEntity = {
  id?: string
  subscription_id?: string
  created_at?: number
}

type RazorpayWebhookPayload = {
  subscription?: { entity?: RazorpaySubscriptionEntity }
  payment?: { entity?: RazorpayPaymentEntity }
}

function toDateFromUnix(value: unknown): Date | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return new Date(value * 1000)
}

function getProviderEventId(parsed: Record<string, unknown>, payload: RazorpayWebhookPayload) {
  const eventId = typeof parsed["event_id"] === "string" ? parsed["event_id"] : null
  if (eventId) return eventId

  const subscriptionId = payload?.subscription?.entity?.id || payload?.payment?.entity?.subscription_id
  const paymentId = payload?.payment?.entity?.id || "na"
  const createdAt = payload?.subscription?.entity?.created_at || payload?.payment?.entity?.created_at || Date.now()
  const eventType = typeof parsed["event"] === "string" ? parsed["event"] : "unknown"
  return `${eventType}:${subscriptionId || "na"}:${paymentId}:${createdAt}`
}

function mapEvent(
  eventType: string
): { status?: "active" | "past_due" | "expired" | "canceled"; paymentStatus?: "paid" | "pending" | "failed" } {
  if (eventType === "subscription.activated" || eventType === "subscription.charged" || eventType === "payment.captured") {
    return { status: "active", paymentStatus: "paid" }
  }
  if (eventType === "subscription.authenticated") {
    return { status: "active", paymentStatus: "pending" }
  }
  if (eventType === "payment.failed" || eventType === "subscription.pending") {
    return { status: "past_due", paymentStatus: "failed" }
  }
  if (eventType === "subscription.completed") {
    return { status: "expired", paymentStatus: "pending" }
  }
  if (eventType === "subscription.cancelled" || eventType === "subscription.halted") {
    return { status: "canceled", paymentStatus: "pending" }
  }
  return {}
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_SAAS_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  if (secret.startsWith("http://") || secret.startsWith("https://")) {
    return NextResponse.json(
      { error: "Webhook secret is misconfigured. Set the Razorpay secret value, not webhook URL." },
      { status: 500 }
    )
  }

  const signature = req.headers.get("x-razorpay-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const rawBody = await req.text()
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType = typeof parsed.event === "string" ? parsed.event : ""
  const payload = (parsed.payload || {}) as RazorpayWebhookPayload
  const providerEventId = getProviderEventId(parsed, payload)

  const subscriptionEntity = payload?.subscription?.entity
  const paymentEntity = payload?.payment?.entity
  const razorpaySubscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id || null
  const notesSubscriptionId = subscriptionEntity?.notes?.collegeSubscriptionId

  try {
    let subscription = null as
      | null
      | {
          id: string
          collegeId: string
          planId: string
        }

    if (razorpaySubscriptionId) {
      subscription = await db.collegeSubscription.findFirst({
        where: { razorpaySubscriptionId: String(razorpaySubscriptionId) },
        select: { id: true, collegeId: true, planId: true },
      })
    }

    if (!subscription && notesSubscriptionId) {
      subscription = await db.collegeSubscription.findUnique({
        where: { id: notesSubscriptionId },
        select: { id: true, collegeId: true, planId: true },
      })
    }

    if (!subscription) {
      return NextResponse.json({ received: true, ignored: true })
    }

    try {
      await db.collegePaymentEvent.create({
        data: {
          collegeSubscriptionId: subscription.id,
          provider: "razorpay",
          providerEventId,
          eventType,
          payload: parsed as Prisma.InputJsonObject,
        },
      })
    } catch (error: unknown) {
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
        return NextResponse.json({ received: true, duplicate: true })
      }
      throw error
    }

    const mapped = mapEvent(eventType)
    if (!mapped.status && !mapped.paymentStatus) {
      return NextResponse.json({ received: true })
    }

    const now = new Date()
    const currentStart = toDateFromUnix(subscriptionEntity?.current_start)
    const currentEnd = toDateFromUnix(subscriptionEntity?.current_end)

    await db.$transaction(async (tx) => {
      if (mapped.status === "active") {
        await tx.collegeSubscription.updateMany({
          where: {
            collegeId: subscription!.collegeId,
            id: { not: subscription!.id },
            status: { in: ["active", "trialing", "past_due", "pending"] },
          },
          data: {
            status: "expired",
            endDate: now,
          },
        })
      }

      await tx.collegeSubscription.update({
        where: { id: subscription.id },
        data: {
          status: mapped.status,
          paymentStatus: mapped.paymentStatus,
          startDate: currentStart || undefined,
          endDate: currentEnd || undefined,
          razorpaySubscriptionId: razorpaySubscriptionId ? String(razorpaySubscriptionId) : undefined,
        },
      })

      if (mapped.status === "active") {
        await tx.college.update({
          where: { id: subscription.collegeId },
          data: { status: "active" },
        })
      }
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("SaaS webhook processing failed:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
