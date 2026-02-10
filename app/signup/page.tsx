import { Suspense } from "react"
import SignupClient from "./SignupClient"

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupClient />
    </Suspense>
  )
}
