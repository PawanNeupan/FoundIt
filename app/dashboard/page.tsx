"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useRequireFounder } from "@/lib/useRequireFounder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Question = {
  question: string
  options: string[]
  correctIndex: number
}

type Item = {
  id: string
  title: string
  created_at: string
  questions: Question[] | null
  image_url: string | null
  category: string | null
  status: "found" | "claimed"
  winning_claim_id: string | null
}

type SeekerProfile = {
  username: string | null
  email: string | null
  avatar_url: string | null
}

type Claim = {
  id: string
  item_id: string
  seeker_id: string
  answers: number[]
  created_at: string
  is_winner: boolean
  seeker_profile?: SeekerProfile | null
}

function scoreClaim(questions: Question[] | null, answers: number[]) {
  const qs = Array.isArray(questions) ? questions : []
  const total = qs.length
  let correct = 0
  for (let i = 0; i < total; i++) {
    if (typeof answers[i] === "number" && answers[i] === qs[i].correctIndex) correct++
  }
  return { correct, total }
}

export default function DashboardPage() {
  const { loading: gateLoading, allowed } = useRequireFounder()

  const [items, setItems] = useState<Item[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const [minCorrect, setMinCorrect] = useState(0)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)

  const reload = async () => {
    setLoading(true)
    setMsg(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) {
      setMsg("Not logged in.")
      setLoading(false)
      return
    }

    // Items
    const { data: itemsData, error: itemsError } = await supabase
      .from("items")
      .select("id,title,created_at,questions,image_url,category,status,winning_claim_id")
      .eq("founder_id", user.id)
      .order("created_at", { ascending: false })

    if (itemsError) {
      setMsg(itemsError.message)
      setLoading(false)
      return
    }

    const it = (itemsData ?? []) as Item[]
    setItems(it)
    setSelectedItemId((prev) => prev ?? it[0]?.id ?? null)

    // Claims + seeker profile
    const { data: claimsData, error: claimsError } = await supabase
      .from("claims")
      .select(
        `
        id,
        item_id,
        seeker_id,
        answers,
        created_at,
        is_winner,
        seeker_profile:profiles!claims_seeker_id_fkey (
          username,
          email,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false })

    if (claimsError) {
      setMsg(claimsError.message)
      setLoading(false)
      return
    }

    setClaims((claimsData ?? []) as unknown as Claim[])
    setLoading(false)
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId]
  )

  const itemClaims = useMemo(() => {
    if (!selectedItemId) return []
    const list = claims.filter((c) => c.item_id === selectedItemId)
    const questions = selectedItem?.questions ?? null

    const scored = list.map((c: any) => {
      const { correct, total } = scoreClaim(questions, c.answers ?? [])
      return { ...c, correct, total }
    })

    return scored.filter((c: any) => c.correct >= minCorrect)
  }, [claims, selectedItemId, selectedItem?.questions, minCorrect])

  const selectWinner = async (claimId: string) => {
    if (!selectedItem) return
    if (selectedItem.status === "claimed") {
      alert("Item is already claimed.")
      return
    }

    const ok = confirm("Select this seeker as the winner and mark item as claimed?")
    if (!ok) return

    setActionBusy(true)
    setMsg(null)

    // 1) Set all claims for item to is_winner = false
    const { error: clearErr } = await supabase
      .from("claims")
      .update({ is_winner: false })
      .eq("item_id", selectedItem.id)

    if (clearErr) {
      setMsg(clearErr.message)
      setActionBusy(false)
      return
    }

    // 2) Set the chosen claim to is_winner = true
    const { error: winErr } = await supabase
      .from("claims")
      .update({ is_winner: true })
      .eq("id", claimId)

    if (winErr) {
      setMsg(winErr.message)
      setActionBusy(false)
      return
    }

    // 3) Mark item claimed and store winning_claim_id
    const { error: itemErr } = await supabase
      .from("items")
      .update({ status: "claimed", winning_claim_id: claimId })
      .eq("id", selectedItem.id)

    if (itemErr) {
      setMsg(itemErr.message)
      setActionBusy(false)
      return
    }

    setActionBusy(false)
    await reload()
    alert("Winner selected ✅ Item claimed.")
  }

  if (gateLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Checking access...
      </main>
    )
  }

  if (!allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Only founders can view this dashboard.
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Founder Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Choose a winner and filter applicants by correct answers.
        </p>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: items list */}
        <Card className="lg:col-span-1 card-hover">
          <CardHeader>
            <CardTitle className="text-base">Your Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You haven’t posted any items yet.
              </p>
            ) : (
              items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setSelectedItemId(it.id)}
                  className={`w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition
                    ${
                      selectedItemId === it.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                >
                  {it.image_url ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-background">
                      <Image src={it.image_url} alt={it.title} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-md border flex items-center justify-center text-[10px] text-muted-foreground bg-background">
                      No img
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title}</div>
                    <div
                      className={`text-xs truncate ${
                        selectedItemId === it.id
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {it.category ?? "Uncategorized"} • {it.status}
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: applicants */}
        <Card className="lg:col-span-2 card-hover">
          <CardHeader>
            <CardTitle className="text-base">
              Applicants {selectedItem ? `for: ${selectedItem.title}` : ""}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedItem && (
              <div className="flex flex-col sm:flex-row gap-4 border rounded-md p-3">
                {selectedItem.image_url ? (
                  <div className="relative w-full sm:w-56 h-40 overflow-hidden rounded-md border">
                    <Image src={selectedItem.image_url} alt={selectedItem.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full sm:w-56 h-40 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium">{selectedItem.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedItem.category ?? "Uncategorized"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Questions: {Array.isArray(selectedItem.questions) ? selectedItem.questions.length : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="font-medium">{selectedItem.status}</span>
                  </p>
                  {selectedItem.status === "claimed" && selectedItem.winning_claim_id && (
                    <p className="text-xs text-green-700">
                      ✅ Winner selected (claim id: {selectedItem.winning_claim_id})
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm">Min correct:</span>
              {[0, 1, 2, 3].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={minCorrect === n ? "default" : "outline"}
                  onClick={() => setMinCorrect(n)}
                  disabled={!selectedItem}
                >
                  {n}+
                </Button>
              ))}
            </div>

            {!selectedItem ? (
              <p className="text-sm text-muted-foreground">Select an item to view applicants.</p>
            ) : itemClaims.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applicants match this filter.</p>
            ) : (
              <div className="space-y-3">
                {itemClaims.map((c: any) => {
                  const p: SeekerProfile | null | undefined = c.seeker_profile
                  const displayName = p?.username || "Unknown user"
                  const displayEmail = p?.email || ""

                  return (
                    <div key={c.id} className="border rounded-md p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {displayName}{" "}
                            {c.is_winner && (
                              <span className="ml-2 text-xs text-green-700">🏆 Winner</span>
                            )}
                          </p>
                          {displayEmail && (
                            <p className="text-xs text-muted-foreground">{displayEmail}</p>
                          )}
                        </div>

                        <p className="text-sm">
                          Score: <span className="font-semibold">{c.correct}/{c.total}</span>
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Answers: {Array.isArray(c.answers) ? c.answers.join(", ") : "—"}
                      </div>

                      <div className="flex gap-2 items-center pt-2">
                        <Button
                          size="sm"
                          onClick={() => selectWinner(c.id)}
                          disabled={actionBusy || selectedItem.status === "claimed"}
                        >
                          Select Winner
                        </Button>

                        {selectedItem.status === "claimed" && !c.is_winner && (
                          <span className="text-xs text-muted-foreground">
                            Item already claimed
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
