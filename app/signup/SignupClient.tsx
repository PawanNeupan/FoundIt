"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FloatingItem } from "@/components/ui/floating-item"

import {
  Key,
  Wallet,
  Smartphone,
  Watch,
  Headphones,
  Briefcase,
  MapPin,
  EyeOff,
  Eye,
  UserPlus,
} from "lucide-react"
import { motion } from "framer-motion"

type Role = "founder" | "seeker"

export default function SignupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const roleFromUrl = (searchParams.get("role") as Role) || "seeker"

  const [role, setRole] = useState<Role>(roleFromUrl)
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const [agree, setAgree] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!displayName.trim()) return setMessage("❌ Please enter your name.")
    if (!email.trim()) return setMessage("❌ Please enter your email.")
    if (password.length < 6) return setMessage("❌ Password must be at least 6 characters.")
    if (password !== confirm) return setMessage("❌ Passwords do not match.")
    if (!agree) return setMessage("❌ Please accept the terms.")

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role },
        },
      })

      if (error) {
        setMessage(`❌ ${error.message}`)
        return
      }

      setMessage("✅ Signup successful! Check your email to confirm, then login.")
      setTimeout(() => router.push("/login"), 800)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/items` },
    })
    if (error) setMessage(`❌ ${error.message}`)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden items-center justify-center">
        <FloatingItem delay={0} className="absolute top-20 left-20">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Key className="w-10 h-10 text-white" />
          </div>
        </FloatingItem>

        <FloatingItem delay={0.5} duration={5} className="absolute top-32 right-24">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Wallet className="w-12 h-12 text-white" />
          </div>
        </FloatingItem>

        <FloatingItem delay={1} duration={4.5} className="absolute top-1/3 left-16">
          <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
        </FloatingItem>

        <FloatingItem delay={1.5} duration={5.5} className="absolute bottom-40 left-32">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Watch className="w-10 h-10 text-white" />
          </div>
        </FloatingItem>

        <FloatingItem delay={2} className="absolute bottom-32 right-20">
          <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl">
            <Headphones className="w-9 h-9 text-white" />
          </div>
        </FloatingItem>

        <FloatingItem delay={0.8} duration={6} className="absolute top-1/2 right-16">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Briefcase className="w-11 h-11 text-white" />
          </div>
        </FloatingItem>

        {/* Center Content */}
        <motion.div
          className="text-center z-10 px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <img src="/logo.png" className="h-20 w-auto" alt="FoundIt" />
          </div>
          <p className="text-white/90 text-xl font-medium max-w-md">
            Create an account to post found items or claim what you lost.
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/70">
            <div className="w-2 h-2 rounded-full bg-found animate-pulse" />
            <span className="text-sm">Join the community today</span>
          </div>
        </motion.div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-primary rounded-xl">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">FoundIt</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-6 h-6" /> Create account
            </h2>
            <p className="text-muted-foreground">Choose your role and start using FoundIt</p>
          </div>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button
              type="button"
              variant={role === "founder" ? "default" : "outline"}
              className="h-11"
              onClick={() => setRole("founder")}
            >
              I Found Something
            </Button>
            <Button
              type="button"
              variant={role === "seeker" ? "default" : "outline"}
              className="h-11"
              onClick={() => setRole("seeker")}
            >
              I Lost Something
            </Button>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="agree"
                checked={agree}
                onCheckedChange={(v: boolean) => setAgree(v === true)}
              />
              <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
                I agree to the terms & privacy policy
              </label>
            </div>

            {message && <div className="text-sm">{message}</div>}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Creating..." : "Create account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base font-medium"
              onClick={signInWithGoogle}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
