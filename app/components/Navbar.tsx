"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import logo from '../../public/logo.png'

type Role = "founder" | "seeker" | null

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [role, setRole] = useState<Role>(null)
  const [username, setUsername] = useState<string | null>(null)

  const isActive = (href: string) => pathname === href

  const loadUser = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      setIsAuthed(false)
      setRole(null)
      setUsername(null)
      setLoading(false)
      return
    }

    setIsAuthed(true)

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("id", user.id)
      .maybeSingle()

    setRole((profile?.role as Role) ?? null)
    setUsername(profile?.username ?? null)
    setLoading(false)
  }

  useEffect(() => {
    loadUser()

    const { data: sub } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          // Do NOT set loading here — just reset state
          setIsAuthed(false)
          setRole(null)
          setUsername(null)
          setLoading(false)
        } else {
          loadUser()
        }
      }
    )

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login") // 👈 IMPORTANT
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <a href="/"><img src="/logo.png" className="h-10 w-auto" alt="FoundIt" />
</a>


        {/* Links */}
        <nav className=" flex items-center gap-2 flex-wrap">
          <Link
            href="/"
            className={`text-sm px-3 py-1 rounded-md ${
              isActive("/") ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            Home
          </Link>

          
          <Link
            href="/items"
            className={`text-sm px-3 py-1 rounded-md ${
              isActive("/items") ? "bg-muted" : "hover:bg-muted"
            }`}
          >
            Items
          </Link>

          {isAuthed && role === "seeker" && (
            <Link
              href="/my-claims"
              className={`text-sm px-3 py-1 rounded-md ${
                isActive("/my-claims") ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              My Applications
            </Link>
          )}

          {isAuthed && role === "founder" && (
            <>
              <Link
                href="/post"
                className={`text-sm px-3 py-1 rounded-md ${
                  isActive("/post") ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                Post Item
              </Link>
              <Link
                href="/dashboard"
                className={`text-sm px-3 py-1 rounded-md ${
                  isActive("/dashboard") ? "bg-muted" : "hover:bg-muted"
                }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs text-muted-foreground">Loading...</span>
          ) : !isAuthed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
              >
                Login
              </Button>
              <Button size="sm" onClick={() => router.push("/signup")}>
                Sign up
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {username ? `${username} • ` : ""}
                {role}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
