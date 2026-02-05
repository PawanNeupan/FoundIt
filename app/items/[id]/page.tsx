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

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [hasApplied, setHasApplied] = useState(false)
  const [isWinner, setIsWinner] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)

      const { data, error } = await supabase
        .from("items")
        .select("id,title,category,description,status,image_url,created_at,founder_id,winning_claim_id")
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

      // Check claim status for this user
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (user) {
        const { data: claim } = await supabase
          .from("claims")
          .select("id,is_winner")
          .eq("item_id", params.id)
          .eq("seeker_id", user.id)
          .maybeSingle()

        setHasApplied(!!claim)
        setIsWinner(!!claim?.is_winner)
      }

      setLoading(false)
    }

    if (params?.id) load()
  }, [params?.id])

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

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <Card>
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

          {/* Apply / status messaging */}
          <div className="pt-2">
            {item.status === "claimed" ? (
              isWinner ? (
                <p className="text-sm text-green-700 font-medium">
                  🎉 You were selected! Please contact the founder to collect the item.
                </p>
              ) : hasApplied ? (
                <p className="text-sm text-muted-foreground">
                  This item has been claimed by another applicant. Thanks for applying.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This item has been claimed.
                </p>
              )
            ) : hasApplied ? (
              <Button disabled variant="outline">
                You have already applied
              </Button>
            ) : (
              <Button onClick={goApply}>Apply / Claim</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
