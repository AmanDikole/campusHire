const MESSAGE_MAP: Array<{ pattern: RegExp; message: string }> = [
  {
    pattern: /(unauthorized|access denied|tenant_mismatch)/i,
    message: "Your session has expired or access is restricted. Please sign in again.",
  },
  {
    pattern: /(invalid login credentials|credentialssignin)/i,
    message: "Email, password, or selected college is incorrect.",
  },
  {
    pattern: /(user already exists|already exists in this college)/i,
    message: "An account with this email already exists for the selected college.",
  },
  {
    pattern: /(invalid or expired reset link|token and password are required)/i,
    message: "This reset link is invalid or expired. Please request a new reset email.",
  },
  {
    pattern: /(college account is suspended|college_suspended)/i,
    message: "This college account is currently suspended. Please contact support.",
  },
  {
    pattern: /(no active college found|college list unavailable|no campus available)/i,
    message: "No college is available right now. Please contact your admin.",
  },
  {
    pattern: /(razorpay|plan id is missing|webhook secret|failed to start checkout|failed to open payment checkout)/i,
    message: "Payment is temporarily unavailable. Please try again or contact support.",
  },
  {
    pattern: /(network|fetch failed|failed to fetch)/i,
    message: "Network issue detected. Please check your connection and try again.",
  },
  {
    pattern: /(something went wrong|failed to|registration failed|action failed|update failed)/i,
    message: "We couldn't complete that action right now. Please try again.",
  },
]

export function toUserFriendlyError(error: unknown, fallback = "Something went wrong. Please try again.") {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof error === "object" && error && "error" in error && typeof (error as { error?: unknown }).error === "string"
      ? ((error as { error: string }).error || "")
      : ""

  const message = raw.trim()
  if (!message) return fallback

  for (const entry of MESSAGE_MAP) {
    if (entry.pattern.test(message)) return entry.message
  }

  return message
}
