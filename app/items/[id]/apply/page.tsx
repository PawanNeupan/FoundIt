"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Question = {
  question: string
  options: string[]
  correctIndex?: number
}

type Item = {
  id: string
  title: string
  status: "found" | "claimed"
  questions: Question[] | null
}

export default function ApplyPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [answers, setAnswers] = useState<(number | null)[]>([])

  // --------------------------------------------------
  // 🔐 AUTH + ROLE + ITEM CHECK
  // --------------------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)

      // 1️⃣ Check session
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace("/login")
        return
      }

      // 2️⃣ Check role (block founders)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profile?.role !== "seeker") {
        router.replace("/items")
        return
      }

      // 3️⃣ Load item
      const { data, error } = await supabase
        .from("items")
        .select("id,title,status,questions")
        .eq("id", params.id)
        .single()

      if (error || !data) {
        router.replace("/items")
        return
      }

      // 4️⃣ Block if already claimed
      if (data.status === "claimed") {
        router.replace("/items")
        return
      }

      const it = data as Item
      setItem(it)

      const qCount = Array.isArray(it.questions) ? it.questions.length : 0
      setAnswers(new Array(qCount).fill(null))

      setLoading(false)
    }

    if (params?.id) load()
  }, [params?.id, router])

  const questions = useMemo(() => {
    if (!item?.questions || !Array.isArray(item.questions)) return []
    return item.questions
  }, [item])

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null)

  // --------------------------------------------------
  // ✅ SUBMIT CLAIM
  // --------------------------------------------------
  const handleContinue = async () => {
    if (!allAnswered) {
      setMsg("Please answer all questions.")
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) {
      router.replace("/login")
      return
    }

    const { error } = await supabase.from("claims").insert({
      item_id: params.id,
      seeker_id: user.id,
      answers,
    })

    if (error) {
      if (error.code === "23505") {
        setMsg("You have already applied for this item.")
      } else {
        setMsg(error.message)
      }
      return
    }

    setMsg("Claim submitted successfully ✅")
    setTimeout(() => router.replace(`/items/${params.id}`), 800)
  }

  // --------------------------------------------------
  // UI STATES
  // --------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading application...
      </main>
    )
  }

  if (!item) return null

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl">Apply to Claim</CardTitle>
          <p className="text-sm text-muted-foreground">{item.title}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {msg && <p className="text-sm text-red-600">{msg}</p>}

          {questions.map((q, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-sm font-medium">
                {idx + 1}. {q.question}
              </p>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === optIdx}
                      onChange={() => {
                        const copy = [...answers]
                        copy[idx] = optIdx
                        setAnswers(copy)
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleContinue} disabled={!allAnswered}>
              Submit Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
