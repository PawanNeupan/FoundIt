"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Item = {
  id: string
  title: string
  category: string | null
  description: string | null
  status: "found" | "claimed"
  image_url: string | null
  created_at: string
  founder_id: string
  winning_claim_id: string | null
}

type Role = "founder" | "seeker" | null

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [hasApplied, setHasApplied] = useState(false)
  const [isWinner, setIsWinner] = useState(false)

  const [viewerRole, setViewerRole] = useState<Role>(null)

  const [founderEmail, setFounderEmail] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)
      setFounderEmail(null)
      setViewerRole(null)
      setHasApplied(false)
      setIsWinner(false)

      // 1) Load item
      const { data, error } = await supabase
        .from("items")
        .select(
          "id,title,category,description,status,image_url,created_at,founder_id,winning_claim_id"
        )
        .eq("id", params.id)
        .single()

      if (error) {
        setMsg(error.message)
        setItem(null)
        setLoading(false)
        return
      }

      const it = data as Item
      setItem(it)

      // 2) Get session
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        // optional: force login for detail page too
        router.replace("/login")
        return
      }

      // 3) Fetch viewer role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = (profile?.role as Role) ?? null
      setViewerRole(role)

      // ✅ If viewer is a founder, they should NOT apply at all
      if (role === "founder") {
        setLoading(false)
        return
      }

      // 4) Viewer is seeker: check claim status
      const { data: claim } = await supabase
        .from("claims")
        .select("id,is_winner")
        .eq("item_id", params.id)
        .eq("seeker_id", user.id)
        .maybeSingle()

      const applied = !!claim
      const winner = !!claim?.is_winner

      setHasApplied(applied)
      setIsWinner(winner)

      // 5) If winner, fetch founder email
      if (winner) {
        const { data: founderProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", it.founder_id)
          .maybeSingle()

        setFounderEmail(founderProfile?.email ?? null)
      }

      setLoading(false)
    }

    if (params?.id) load()
  }, [params?.id, router])

  const goApply = () => router.push(`/items/${params.id}/apply`)

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading item...
      </main>
    )
  }

  if (!item) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-red-600">{msg ?? "Item not found"}</p>
      </main>
    )
  }

  const canApply = viewerRole !== "founder" // ✅ main rule

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl">{item.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {item.category ?? "Uncategorized"} • Status: {item.status}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {item.image_url ? (
            <div className="relative w-full h-72 overflow-hidden rounded-md border">
              <Image src={item.image_url} alt={item.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-72 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm">{item.description || "No description provided."}</p>
          </div>

          {/* Apply / status messaging (ONLY seekers) */}
          {canApply ? (
            <div className="pt-2">
              {item.status === "claimed" ? (
                isWinner ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-700 font-medium">
                      🎉 You were selected! Contact the founder to collect the item.
                    </p>

                    {founderEmail ? (
                      <p className="text-sm">
                        Founder Email:{" "}
                        <a
                          href={`mailto:${founderEmail}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {founderEmail}
                        </a>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Founder email not available.
                      </p>
                    )}
                  </div>
                ) : hasApplied ? (
                  <p className="text-sm text-muted-foreground">
                    This item has been claimed by another applicant. Thanks for applying.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">This item has been claimed.</p>
                )
              ) : hasApplied ? (
                <Button disabled variant="outline">
                  You have already applied
                </Button>
              ) : (
                <Button onClick={goApply}>Apply / Claim</Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pt-2">
              Founders can’t apply for items.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
