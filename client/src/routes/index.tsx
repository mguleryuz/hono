import { createFileRoute } from '@tanstack/react-router'
import { Flame } from 'lucide-react'

import { UsersTable } from '../components/users-table'

export const Route = createFileRoute('/')({
  component: AdminComponent,
})

function AdminComponent() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-5 text-center">
        <Flame size={100} />
        <h1>Welcome to Hono + Vite Server!</h1>
        <p className="text-muted-foreground max-w-md">
          This is a demonstration of the users table. Sign in to see the app
          working.
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        <UsersTable />
      </div>
    </div>
  )
}
