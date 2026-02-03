"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useRequireFounder } from "@/lib/useRequireFounder"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PostItemPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const { loading, allowed } = useRequireFounder()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMsg(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      setMsg("You are not logged in.")
      setSaving(false)
      return
    }

    if (!file) {
      setMsg("Please select an image.")
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
      questions: null,
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
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Checking access...
      </main>
    )
  }

  if (!allowed) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        You are not allowed to post items.  
        <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="flex items-center justify-center">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Post a Found Item</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
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
