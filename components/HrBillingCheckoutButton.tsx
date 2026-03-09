"use client"

import { toUserFriendlyError } from "@/lib/user-feedback"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

declare global {
  type RazorpayCheckoutInstance = {
    on: (event: string, handler: () => void) => void
    open: () => void
  }

  type RazorpayCheckoutConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance

  interface Window {
    Razorpay?: RazorpayCheckoutConstructor
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

export function HrBillingCheckoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/billing/razorpay/create-subscription", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Unable to start checkout")
      }

      const loaded = await ensureRazorpayScriptLoaded()
      if (!loaded) throw new Error("Could not load Razorpay checkout")

      const RazorpayConstructor = window.Razorpay
      if (!RazorpayConstructor) throw new Error("Razorpay checkout is unavailable")

      const rzp = new RazorpayConstructor({
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "CampusHire",
        description: "HR Monthly Plan",
        handler: () => {
          toast.success("Payment initiated successfully. Final status will sync shortly.")
          router.refresh()
        },
        prefill: {
          email: data.email,
        },
        notes: {
          plan: `INR ${data.amountInr}/month`,
        },
        theme: {
          color: "#111827",
        },
      })

      rzp.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.")
      })

      rzp.open()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to open payment checkout"
      toast.error(toUserFriendlyError(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Starting Checkout..." : "Pay Now"}
    </button>
  )
}
