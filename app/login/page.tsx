"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FloatingItem } from "@/components/ui/floating-item"

import {
  Key,
  Wallet,
  Smartphone,
  Watch,
  Headphones,
  Briefcase,
  MapPin,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!email || !password) {
      setMessage("❌ Please enter email and password.")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`❌ ${error.message}`)
        return
      }

      // Redirect after login
      router.replace("/")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden items-center justify-center">
        {/* Floating Items */}
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
            Welcome back — let’s reunite you with what matters.
          </p>
        </motion.div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              <LogIn className="w-6 h-6" /> Sign in
            </h2>
            <p className="text-muted-foreground">
              Access your dashboard and claims
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-primary/20 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {message && <div className="text-sm">{message}</div>}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              
            </div>

            
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Create one free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
