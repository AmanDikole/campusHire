"use client"

import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

declare global {
  type SaasRazorpayCheckoutInstance = {
    on: (event: string, handler: () => void) => void
    open: () => void
  }

  type SaasRazorpayCheckoutConstructor = new (options: Record<string, unknown>) => SaasRazorpayCheckoutInstance

  interface Window {
    Razorpay?: SaasRazorpayCheckoutConstructor
  }
}

async function ensureRazorpayScriptLoaded() {
  if (window.Razorpay) return true

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function TpoPlanCheckoutButton({ planKey, disabled }: { planKey: "basic" | "pro" | "enterprise"; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/saas/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Unable to start checkout")
      }

      const loaded = await ensureRazorpayScriptLoaded()
      if (!loaded) throw new Error("Failed to load Razorpay checkout script")

      const RazorpayConstructor = window.Razorpay
      if (!RazorpayConstructor) throw new Error("Razorpay checkout unavailable")

      const razorpay = new RazorpayConstructor({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "CampusHire SaaS",
        description: `${data.planName} Plan`,
        prefill: {
          email: data.email || "",
        },
        notes: {
          plan: data.planKey,
          amount: data.amountInr,
        },
        handler: () => {
          toast.success("Payment initialized. Subscription status will sync shortly.")
          router.refresh()
        },
        theme: {
          color: "#111827",
        },
      })

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.")
      })

      razorpay.open()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start checkout"
      toast.error(toUserFriendlyError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onCheckout}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Starting..." : "Upgrade"}
    </button>
  )
}
