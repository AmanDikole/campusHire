import Razorpay from "razorpay"

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing")
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

export function getRazorpayPlanId() {
  const planId = process.env.RAZORPAY_PLAN_ID
  if (!planId) throw new Error("RAZORPAY_PLAN_ID is missing")
  return planId
}
