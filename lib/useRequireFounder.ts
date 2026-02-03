"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export function useRequireFounder() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        router.push("/login")
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error || !profile) {
        router.push("/login")
        return
      }

      if (profile.role !== "founder") {
        setAllowed(false)
        setLoading(false)
        return
      }

      setAllowed(true)
      setLoading(false)
    }

    run()
  }, [router])

  return { loading, allowed }
}
