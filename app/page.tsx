'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function InvitePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/invite')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
