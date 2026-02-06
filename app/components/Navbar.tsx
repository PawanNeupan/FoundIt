"use client"

import Link from "next/link"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { supabase } from "@/lib/supabaseClient"
import { useProfile } from "@/lib/useProfile"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  // ✅ profile comes from TanStack Query cache
  const { data: profile, isLoading } = useProfile()

  const isAuthed = !!profile
  const role = profile?.role ?? null
  const username = profile?.username ?? null
  const avatarUrl = profile?.avatar_url ?? null

  const isActive = (href: string) => pathname === href

  // ✅ Sync Supabase auth state -> TanStack Query cache
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        // refetch profile immediately
        queryClient.invalidateQueries({ queryKey: ["profile"] })
      }

      if (event === "SIGNED_OUT") {
        // clear profile immediately
        queryClient.removeQueries({ queryKey: ["profile"] })
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [queryClient])

  const logout = async () => {
    await supabase.auth.signOut()

    // ✅ Clear cached profile so navbar updates instantly
    queryClient.removeQueries({ queryKey: ["profile"] })

    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" className="h-10 w-auto" alt="FoundIt" />
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-2 flex-wrap">
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
          {isLoading ? (
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
              {/* Avatar -> Profile */}
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="h-9 w-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center hover:ring-2 hover:ring-ring transition"
                title="Profile"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={username ?? "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold uppercase">
                    {username?.[0] ?? role?.[0] ?? "U"}
                  </span>
                )}
              </button>

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
