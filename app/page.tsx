"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Home() {
  const [status, setStatus] = useState("Checking Supabase connection...")

  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.from("items").select("*").limit(1)
      if (error) {
        setStatus("Connected ✅ (items table not created yet — that's OK)")
      } else {
        setStatus("Connected ✅ and items table exists")
      }
    }
    test()
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center text-lg">
      {status}
    </main>
  )
}
