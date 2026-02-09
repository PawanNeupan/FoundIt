"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Item = {
  id: string
  title: string
  category: string | null
  description: string | null
  status: "found" | "claimed"
  image_url: string | null
  created_at: string
}

export default function ItemsPage() {
  const router = useRouter()

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)

      // ✅ 1. Check session FIRST
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace("/login")
        return
      }

      // ✅ 2. Fetch items only if logged in
      const { data, error } = await supabase
        .from("items")
        .select("id,title,category,description,status,image_url,created_at")
        .eq("status", "found")
        .order("created_at", { ascending: false })

      if (error) {
        setMsg(error.message)
        setItems([])
        setLoading(false)
        return
      }

      setItems(data ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading items...
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Found Items</h1>
        <p className="text-sm text-muted-foreground">
          Browse items reported as found.
        </p>
      </div>

      {msg && <p className="text-sm text-red-600 mb-4">{msg}</p>}

      {items.length === 0 ? (
        <p>No found items yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card className="card-hover cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {item.category ?? "Uncategorized"}
                  </p>
                </CardHeader>

                <CardContent className="space-y-3">
                  {item.image_url ? (
                    <div className="relative w-full h-44 overflow-hidden rounded-md border">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}

                  {item.description ? (
                    <p className="text-sm line-clamp-2">{item.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No description
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
