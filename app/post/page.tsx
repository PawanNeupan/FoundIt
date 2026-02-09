"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useRequireFounder } from "@/lib/useRequireFounder"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Question = {
  question: string
  options: string[]
  correctIndex: number
}

export default function PostItemPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", ""], correctIndex: 0 },
    { question: "", options: ["", "", ""], correctIndex: 0 },
  ])

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const { loading, allowed } = useRequireFounder()

  // ✅ Redirect rules:
  // - if no user -> /login
  // - if seeker (not allowed) -> /items
  useEffect(() => {
    const run = async () => {
      if (loading) return

      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.replace("/login")
        return
      }

      if (!allowed) {
        router.replace("/items")
        return
      }
    }

    run()
  }, [loading, allowed, router])

  const validateQuestions = () => {
    if (questions.length < 2) return "Please add at least 2 questions."

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) return `Question ${i + 1} is empty.`
      if (!Array.isArray(q.options) || q.options.length !== 3)
        return `Question ${i + 1} must have exactly 3 options.`
      for (let j = 0; j < 3; j++) {
        if (!q.options[j].trim())
          return `Option ${String.fromCharCode(65 + j)} in Question ${i + 1} is empty.`
      }
      if (![0, 1, 2].includes(q.correctIndex))
        return `Please select the correct option for Question ${i + 1}.`
    }

    return null
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMsg(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      router.replace("/login")
      return
    }

    if (!file) {
      setMsg("Please select an image.")
      setSaving(false)
      return
    }

    if (!title.trim() || !category.trim()) {
      setMsg("Title and category are required.")
      setSaving(false)
      return
    }

    const qError = validateQuestions()
    if (qError) {
      setMsg(qError)
      setSaving(false)
      return
    }

    // Upload image to Supabase Storage
    const fileExt = file.name.split(".").pop() || "jpg"
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(filePath, file)

    if (uploadError) {
      setMsg("Image upload failed: " + uploadError.message)
      setSaving(false)
      return
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("item-images")
      .getPublicUrl(filePath)

    const image_url = publicUrlData.publicUrl

    // Insert into items table
    const { error: insertError } = await supabase.from("items").insert({
      title,
      category,
      description,
      image_url,
      founder_id: user.id,
      status: "found",
      questions,
    })

    if (insertError) {
      setMsg("Saving item failed: " + insertError.message)
      setSaving(false)
      return
    }

    setMsg("Item posted ✅")
    setTitle("")
    setCategory("")
    setDescription("")
    setFile(null)
    setQuestions([
      { question: "", options: ["", "", ""], correctIndex: 0 },
      { question: "", options: ["", "", ""], correctIndex: 0 },
    ])

    setSaving(false)
    router.replace("/dashboard") // optional: go to dashboard after posting
  }

  // Loading gate
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Checking access...
      </main>
    )
  }

  // While redirecting, render nothing
  if (!allowed) return null

  return (
    <main className="min-h-screen p-6">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-xl card-hover">
          <CardHeader>
            <CardTitle>Post a Found Item</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Black wallet near cafeteria"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Wallet, Phone, ID Card"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe where and when you found it..."
                className="w-full min-h-30 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Item Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload an image so seekers can identify the item.
              </p>
            </div>

            {/* Questions UI */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold">Verification Questions</h3>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="space-y-3 border rounded-md p-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Question {qIndex + 1}
                    </label>
                    <Input
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...questions]
                        copy[qIndex].question = e.target.value
                        setQuestions(copy)
                      }}
                      placeholder="e.g., What color was the wallet?"
                    />
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctIndex === optIndex}
                          onChange={() => {
                            const copy = [...questions]
                            copy[qIndex].correctIndex = optIndex
                            setQuestions(copy)
                          }}
                        />
                        <Input
                          value={opt}
                          onChange={(e) => {
                            const copy = [...questions]
                            copy[qIndex].options[optIndex] = e.target.value
                            setQuestions(copy)
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {questions.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setQuestions([
                      ...questions,
                      { question: "", options: ["", "", ""], correctIndex: 0 },
                    ])
                  }
                >
                  + Add another question
                </Button>
              )}
            </div>

            {msg && <p className="text-sm">{msg}</p>}

            <Button
              className="w-full"
              disabled={!title || !category || !file || saving}
              onClick={handleSubmit}
            >
              {saving ? "Posting..." : "Post Item"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
