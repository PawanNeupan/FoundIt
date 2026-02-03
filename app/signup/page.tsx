"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<"founder" | "seeker">("founder")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const onSignup = async () => {
    setLoading(true)
    setMsg(null)

    // ✅ Signup + store metadata for the DB trigger to use
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
          role: role, // "founder" or "seeker"
        },
      },
    })

    if (error) {
      setMsg(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is ON, session may be null → user must confirm then login.
    if (!data.session) {
      setMsg("Account created! Please check your email to confirm, then login.")
      setLoading(false)
      router.push("/login")
      return
    }

    // ✅ No manual profile upsert needed (trigger creates profiles row)
    setLoading(false)
    router.push("/post")
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {msg && <p className="text-sm text-red-600">{msg}</p>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., santosh"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., you@gmail.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">I want to</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="founder">Post found items</option>
              <option value="seeker">Claim items</option>
            </select>
          </div>

          <Button
            className="w-full"
            onClick={onSignup}
            disabled={loading || !email || !password || !username}
          >
            {loading ? "Creating..." : "Sign up"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Note: If email confirmation is enabled in Supabase, you must confirm your email before logging in.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
