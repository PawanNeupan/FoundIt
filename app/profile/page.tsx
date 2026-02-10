"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabaseClient"
import { useProfile } from "@/lib/useProfile"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useProfile()

  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !profile) router.replace("/login")
  }, [isLoading, profile, router])

  useEffect(() => {
    setUsername(profile?.username ?? "")
    setAvatarUrl(profile?.avatar_url ?? null)
  }, [profile])

  const saveProfile = async () => {
    if (!profile?.id) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", profile.id)

    if (error) setMessage(`❌ Failed: ${error.message}`)
    else {
      setMessage("✅ Username updated!")
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
    }

    setSaving(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    setMessage(null)

    if (!selected) return

    if (!selected.type.startsWith("image/")) {
      setMessage("❌ Please select an image file.")
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      setMessage("❌ Image must be under 5MB.")
      return
    }

    setFile(selected)

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const uploadAvatar = async () => {
    if (!file || !profile?.id) {
      setMessage("❌ Please select an image first.")
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const ext = file.name.split(".").pop() || "png"
      const filePath = `${profile.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)

      setMessage("✅ Avatar updated!")
      await queryClient.invalidateQueries({ queryKey: ["profile"] })
    } catch (err: any) {
      setMessage(`❌ Upload failed: ${err?.message ?? "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

 

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </main>
    )
  }

  if (!profile) return null

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {profile.email && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Email:</span> {profile.email}
            </div>
          )}

          {/* Avatar */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Avatar</div>

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-semibold uppercase">
                    {username?.[0] ?? "U"}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                {previewUrl && (
  <div className="flex items-center gap-3">
    <div className="h-14 w-14 rounded-full overflow-hidden border border-border">
      <img
        src={previewUrl}
        alt="Selected preview"
        className="h-full w-full object-cover"
      />
    </div>
    <div className="text-xs text-muted-foreground">
      Selected image preview
    </div>
  </div>
)}

                <Button onClick={uploadAvatar} disabled={uploading || !file}>
                  {uploading ? "Uploading..." : "Upload Avatar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Username</div>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save Username"}
            </Button>
          </div>

          {message && <div className="text-sm">{message}</div>}
        </CardContent>
      </Card>
    </main>
  )
}
