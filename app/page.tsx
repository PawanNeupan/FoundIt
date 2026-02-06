"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  ArrowRight,
  ShieldCheck,
  Users,
  Zap,
  Search,
  Package,
  CheckCircle2,
  Sparkles,
  MapPin,
} from "lucide-react"

type Role = "founder" | "seeker" | null

export default function HomePage() {
  const [role, setRole] = useState<Role>(null)

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        setRole(null)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      setRole((profile?.role as Role) ?? null)
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Community-powered lost & found
            </div>

            <h1 className="mt-5 text-4xl md:text-6xl font-bold text-foreground text-balance">
              Reunite people with what matters
            </h1>

            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl text-balance">
              FoundIt helps finders post items and seekers prove ownership using
              verification questions — safe, simple, and fair.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {!role ? (
                <>
                  <Link href="/signup">
                    <Button className="h-12 px-6 text-base">
                      Get started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href="/items">
                    <Button variant="outline" className="h-12 px-6 text-base">
                      Browse found items <Search className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : role === "founder" ? (
                <Link href="/dashboard">
                  <Button className="h-12 px-6 text-base">
                    Go to dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link href="/items">
                  <Button className="h-12 px-6 text-base">
                    View items <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Preview Card */}
          <Card className="overflow-hidden card-hover">
            <CardContent className="p-0">
              <div className="p-6 border-b bg-card">
                <p className="text-sm text-muted-foreground">Example</p>
                <p className="text-lg font-semibold mt-1">
                  Black wallet near cafeteria
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Campus Area • Today
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Verification question
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    What color was the wallet?
                  </p>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Filter applicants by correct answers
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Find the real owner quickly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: "Verified ownership",
              desc: "Custom questions prevent fake claims.",
            },
            {
              icon: Users,
              title: "Two clear roles",
              desc: "Finders post items, seekers apply with answers.",
            },
            {
              icon: Zap,
              title: "Fast decisions",
              desc: "Filter applicants and select a winner instantly.",
            },
          ].map((f, idx) => {
            const Icon = f.icon
            return (
              <Card key={idx} className="card-hover">
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-lg bg-primary/15 border border-border flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <Card className="card-hover">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                For finders
              </h3>
              {[
                "Post the found item",
                "Add verification questions",
                "Review applicants",
                "Select the real owner",
              ].map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  • {s}
                </p>
              ))}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                For seekers
              </h3>
              {[
                "Browse found items",
                "Answer questions",
                "Track application status",
                "Recover your item",
              ].map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  • {s}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Ready to reunite?
        </h2>
        <p className="text-muted-foreground mb-6">
          Start helping or find what you lost.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup">
            <Button className="h-12 px-6 text-base">
              Create account
            </Button>
          </Link>
          <Link href="/items">
            <Button variant="outline" className="h-12 px-6 text-base">
              Browse items
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        © 2026 FoundIt. Reuniting people with what matters.
      </footer>
    </main>
  )
}
