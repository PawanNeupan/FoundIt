"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Question = {
  question: string
  options: string[]
  correctIndex?: number // stored in DB but we won't show it
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

  // answers[i] = selected option index (0/1/2) or null
  const [answers, setAnswers] = useState<(number | null)[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMsg(null)

      const { data, error } = await supabase
        .from("items")
        .select("id,title,status,questions")
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

      const qCount = Array.isArray(it.questions) ? it.questions.length : 0
      setAnswers(new Array(qCount).fill(null))

      setLoading(false)
    }

    if (params?.id) load()
  }, [params?.id])

  const questions = useMemo(() => {
    if (!item?.questions || !Array.isArray(item.questions)) return []
    return item.questions
  }, [item])

  const allAnswered = answers.length > 0 && answers.every((a) => a !== null)

  const handleContinue = async () => {
  if (questions.length === 0) {
    setMsg("This item has no questions.")
    return
  }

  if (!allAnswered) {
    setMsg("Please answer all questions.")
    return
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user

  if (!user) {
    setMsg("You must be logged in to apply.")
    return
  }

  const { error } = await supabase.from("claims").insert({
    item_id: params.id,
    seeker_id: user.id,
    answers, // array of selected option indexes
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
  setTimeout(() => router.push(`/items/${params.id}`), 800)
}


  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading application...
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
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Apply to Claim</CardTitle>
          <p className="text-sm text-muted-foreground">{item.title}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {msg && <p className="text-sm text-red-600">{msg}</p>}

          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions available for this item yet.
            </p>
          ) : (
            questions.map((q, idx) => (
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
            ))
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleContinue} disabled={questions.length === 0}>
              Submit Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
