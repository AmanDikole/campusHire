"use client"

import { getUserSession } from "@/actions/get-user"
import { MobileNav } from "@/components/MobileNav"
import { Briefcase, Building2, ClipboardList, LayoutDashboard, Loader2, LogOut, UserCog } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

const menuItems = [
  { name: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
  { name: "Company Profile", href: "/hr/company-profile", icon: UserCog },
  { name: "Post Job", href: "/hr/post-job", icon: Briefcase },
  { name: "Applicants", href: "/hr/applicants", icon: ClipboardList },
]

export function HrSidebar() {
  const pathname = usePathname()
  const [email, setEmail] = useState("Loading...")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function getUser() {
      const user = await getUserSession()
      if (user?.email) setEmail(user.email)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <>
      <MobileNav menuItems={menuItems} role="hr" userEmail={email} />
      <aside className="hidden lg:flex w-72 bg-[#0b1324] text-white flex-col border-r border-[#1f2a44] sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2 mt-2">
            <div className="bg-cyan-600 p-2 rounded-xl shadow-lg shadow-cyan-900/20">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-none">Company Portal</span>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">HR Panel</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive ? "bg-white/10 text-white border border-white/10" : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-cyan-300" : "text-gray-400 group-hover:text-cyan-200"} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-[#1f2a44] bg-black/20">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">HR Account</p>
            <p className="text-xs text-gray-400 truncate" title={email}>
              {email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10"
          >
            {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  )
}

