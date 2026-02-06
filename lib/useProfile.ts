import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabaseClient"

export type Role = "founder" | "seeker" | null

export type ProfileData = {
  id: string
  username: string | null
  role: Role
  avatar_url: string | null
  email?: string | null
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileData | null> => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession()
if (!sessionData.session?.user) return null
      if (sessionError) throw sessionError

      const user = sessionData.session?.user
      if (!user) return null

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle()

      if (error) throw error

      return {
        ...(data as ProfileData),
        email: user.email ?? null,
      }
    },
    staleTime: 1000 * 30, // 30s cache
  })
}
