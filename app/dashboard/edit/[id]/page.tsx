"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
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

type ItemRow = {
  id: string
  title: string
  category: string | null
  description: string | null
  image_url: string | null
  founder_id: string
  questions: Question[] | null
}

function getStoragePathFromPublicUrl(publicUrl: string) {
  const marker = "/storage/v1/object/public/item-images/"
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.substring(idx + marker.length)
}

export default function EditItemPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { loading: gateLoading, allowed } = useRequireFounder()

  const itemId = params?.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [item, setItem] = useState<ItemRow | null>(null)

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", ""], correctIndex: 0 },
    { question: "", options: ["", "", ""], correctIndex: 0 },
  ])

  // ✅ redirect if not founder
  useEffect(() => {
    if (!gateLoading && !allowed) router.replace("/items")
  }, [gateLoading, allowed, router])

  // ✅ load item + ownership check
  useEffect(() => {
    const load = async () => {
      if (!itemId) return
      setLoading(true)
      setMsg(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user) {
        router.replace("/login")
        return
      }

      const { data, error } = await supabase
        .from("items")
        .select("id,title,category,description,image_url,founder_id,questions")
        .eq("id", itemId)
        .single()

      if (error || !data) {
        router.replace("/items")
        return
      }

      const it = data as ItemRow

      // ✅ only owner founder can edit
      if (it.founder_id !== user.id) {
        router.replace("/items")
        return
      }

      setItem(it)
      setTitle(it.title ?? "")
      setCategory(it.category ?? "")
      setDescription(it.description ?? "")
      setImageUrl(it.image_url ?? null)

      const qs = Array.isArray(it.questions) ? it.questions : null
      if (qs && qs.length > 0) setQuestions(qs)
      else {
        setQuestions([
          { question: "", options: ["", "", ""], correctIndex: 0 },
          { question: "", options: ["", "", ""], correctIndex: 0 },
        ])
      }

      setLoading(false)
    }

    load()
  }, [itemId, router])

  // cleanup preview
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const validateQuestions = () => {
    if (questions.length < 2) return "Please keep at least 2 questions."

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
        return `Select correct option for Question ${i + 1}.`
    }

    return null
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(null)
    const f = e.target.files?.[0] ?? null
    if (!f) return

    if (!f.type.startsWith("image/")) {
      setMsg("❌ Please choose an image file.")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setMsg("❌ Image must be under 5MB.")
      return
    }

    setFile(f)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const save = async () => {
    if (!item) return

    setMsg(null)

    if (!title.trim() || !category.trim()) {
      setMsg("❌ Title and category are required.")
      return
    }

    const qErr = validateQuestions()
    if (qErr) {
      setMsg("❌ " + qErr)
      return
    }

    setSaving(true)

    try {
      let finalImageUrl = imageUrl

      // ✅ if user selected a new image, upload it
      if (file) {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData.session?.user
        if (!user) {
          router.replace("/login")
          return
        }

        const ext = file.name.split(".").pop() || "jpg"
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from("item-images")
          .upload(filePath, file, { upsert: false })

        if (uploadErr) {
          setMsg("❌ Image upload failed: " + uploadErr.message)
          setSaving(false)
          return
        }

        const { data: urlData } = supabase.storage.from("item-images").getPublicUrl(filePath)
        finalImageUrl = urlData.publicUrl

        // optional: remove old image (only if it was from our bucket)
        if (imageUrl) {
          const oldPath = getStoragePathFromPublicUrl(imageUrl)
          if (oldPath) {
            await supabase.storage.from("item-images").remove([oldPath])
          }
        }
      }

      const { error: updateErr } = await supabase
        .from("items")
        .update({
          title,
          category,
          description,
          image_url: finalImageUrl,
          questions,
        })
        .eq("id", item.id)

      if (updateErr) {
        setMsg("❌ Update failed: " + updateErr.message)
        setSaving(false)
        return
      }

      setMsg("✅ Updated successfully!")
      setTimeout(() => router.push("/dashboard"), 500)
    } finally {
      setSaving(false)
    }
  }

  const previewSrc = useMemo(() => {
    if (previewUrl) return previewUrl
    if (imageUrl) return imageUrl
    return null
  }, [previewUrl, imageUrl])

  if (gateLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading...
      </main>
    )
  }

  // redirect happening if not allowed
  if (!allowed) return null

  if (!item) return null

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Edit Item</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              Back
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {msg && <p className="text-sm">{msg}</p>}

            {/* Image */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Item Image</div>

              {previewSrc ? (
                <div className="relative w-full h-56 overflow-hidden rounded-md border">
                  {/* preview URL is not next/image friendly sometimes; use img */}
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image src={previewSrc} alt="Item" fill className="object-cover" />
                  )}
                </div>
              ) : (
                <div className="w-full h-56 rounded-md border flex items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}

              <Input type="file" accept="image/*" onChange={onPickFile} />
              {previewUrl && (
                <p className="text-xs text-muted-foreground">New image selected ✅</p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Verification Questions</h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={questions.length >= 3}
                  onClick={() =>
                    setQuestions((prev) => [
                      ...prev,
                      { question: "", options: ["", "", ""], correctIndex: 0 },
                    ])
                  }
                >
                  + Add
                </Button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={qIndex} className="space-y-3 border rounded-md p-4">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm font-medium">Question {qIndex + 1}</label>

                    {questions.length > 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setQuestions((prev) => prev.filter((_, i) => i !== qIndex))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Input
                    value={q.question}
                    onChange={(e) => {
                      const copy = [...questions]
                      copy[qIndex].question = e.target.value
                      setQuestions(copy)
                    }}
                    placeholder="e.g., What color was the wallet?"
                  />

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
            </div>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
