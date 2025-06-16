import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Flame } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: AdminComponent,
})

function AdminComponent() {
  return (
    <div className="page">
      <div className="m-auto flex max-w-sm flex-col items-center justify-center gap-5 text-center">
        <Flame size={100} />
        <h1>Welcome to Hono + Vite Server!</h1>
      </div>
    </div>
  )
}
