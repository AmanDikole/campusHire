export function isTpoRole(role?: string | null) {
  return role === "admin" || role === "tpo"
}

export function isHrRole(role?: string | null) {
  return role === "hr"
}

export function isStudentRole(role?: string | null) {
  return role === "student"
}
