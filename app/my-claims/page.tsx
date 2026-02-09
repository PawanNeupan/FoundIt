"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ClaimRow = {
  id: string
  item_id: string
  created_at: string
  is_winner: boolean
  item: {
    id: string
    title: string
    category: string | null
    status: "found" | "claimed"
    image_url: string | null
    created_at: string
  } | null
}

type Role = "founder" | "seeker" | null

export default function MyClaimsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [claims, setClaims] = useState<ClaimRow[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)

      // ✅ 1) Must be logged in
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace("/login")
        return
      }

      // ✅ 2) Must be seeker (founder -> redirect home)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      const role = (profile?.role as Role) ?? null

      if (role === "founder") {
        router.replace("/")
        return
      }

      // ✅ 3) Load my claims + joined item details
      const { data, error } = await supabase
        .from("claims")
        .select(`
          id,
          item_id,
          created_at,
          is_winner,
          item:items!claims_item_id_fkey (
            id,
            title,
            category,
            status,
            image_url,
            created_at
          )
        `)
        .eq("seeker_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setMsg(error.message)
        setClaims([])
        setLoading(false)
        return
      }

      setClaims((data ?? []) as unknown as ClaimRow[])
      setLoading(false)
    }

    load()
  }, [router])

  const getStatusText = (c: ClaimRow) => {
    if (c.is_winner) return "🎉 Winner selected"
    if (c.item?.status === "claimed") return "❌ Not selected"
    return "⏳ Pending"
  }

  const getStatusClass = (c: ClaimRow) => {
    if (c.is_winner) return "text-green-700"
    if (c.item?.status === "claimed") return "text-muted-foreground"
    return "text-amber-700"
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading your claims...
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Applications</h1>
        <p className="text-sm text-muted-foreground">
          Items you have applied to claim.
        </p>
      </div>

      {msg && <p className="text-sm text-red-600 mb-4">{msg}</p>}

      {claims.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven’t applied for any items yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {claims.map((c) => (
            <Link key={c.id} href={`/items/${c.item_id}`}>
              <Card className="card-hover cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">
                    {c.item?.title ?? "Item"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {c.item?.category ?? "Uncategorized"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {c.item?.image_url ? (
                    <div className="relative w-full h-40 overflow-hidden rounded-md border">
                      <Image
                        src={c.item.image_url}
                        alt={c.item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}

                  <div className={`text-sm font-medium ${getStatusClass(c)}`}>
                    {getStatusText(c)}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(c.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
