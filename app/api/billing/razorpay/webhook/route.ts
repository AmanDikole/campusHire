import { db } from "@/lib/db"
import crypto from "crypto"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

type RazorpaySubscriptionEntity = {
  id?: string
  current_start?: number
  current_end?: number
  created_at?: number
  notes?: { userId?: string }
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
  const headerEventId = typeof parsed["event_id"] === "string" ? parsed["event_id"] : null
  if (headerEventId) return headerEventId

  const subscriptionId = payload?.subscription?.entity?.id || payload?.payment?.entity?.subscription_id
  const paymentId = payload?.payment?.entity?.id
  const createdAt = payload?.subscription?.entity?.created_at || payload?.payment?.entity?.created_at || Date.now()
  const eventType = typeof parsed["event"] === "string" ? parsed["event"] : "unknown"

  return `${eventType}:${subscriptionId || "na"}:${paymentId || "na"}:${createdAt}`
}

function mapEventToPlanStatus(eventType: string): "active" | "past_due" | "expired" | "canceled" | null {
  if (
    eventType === "subscription.activated" ||
    eventType === "subscription.authenticated" ||
    eventType === "subscription.charged" ||
    eventType === "payment.captured"
  ) {
    return "active"
  }
  if (eventType === "subscription.pending" || eventType === "payment.failed") return "past_due"
  if (eventType === "subscription.completed") return "expired"
  if (eventType === "subscription.cancelled" || eventType === "subscription.halted") return "canceled"
  return null
}

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_HR_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  if (webhookSecret.startsWith("http://") || webhookSecret.startsWith("https://")) {
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
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex")

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const eventType = typeof parsed.event === "string" ? parsed.event : ""
  const payload = ((parsed.payload || {}) as RazorpayWebhookPayload)
  const providerEventId = getProviderEventId(parsed, payload)
  const subscriptionEntity = payload?.subscription?.entity
  const paymentEntity = payload?.payment?.entity
  const subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id || null
  const notesUserId = subscriptionEntity?.notes?.userId || null

  try {
    let user = null as null | { id: string }

    if (subscriptionId) {
      user = await db.user.findFirst({
        where: { razorpaySubscriptionId: String(subscriptionId) },
        select: { id: true },
      })
    }

    if (!user && notesUserId) {
      user = await db.user.findUnique({
        where: { id: String(notesUserId) },
        select: { id: true },
      })
    }

    if (!user) {
      return NextResponse.json({ received: true, ignored: true })
    }

    try {
      await db.paymentEvent.create({
        data: {
          userId: user.id,
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

    const mapped = mapEventToPlanStatus(eventType)
    if (!mapped) {
      return NextResponse.json({ received: true })
    }

    const currentPeriodStart = toDateFromUnix(subscriptionEntity?.current_start)
    const currentPeriodEnd = toDateFromUnix(subscriptionEntity?.current_end)

    await db.user.update({
      where: { id: user.id },
      data: {
        planStatus: mapped,
        planStartedAt: mapped === "active" ? new Date() : undefined,
        currentPeriodStart: currentPeriodStart || undefined,
        currentPeriodEnd: currentPeriodEnd || undefined,
        razorpaySubscriptionId: subscriptionId ? String(subscriptionId) : undefined,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Razorpay webhook processing failed:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
