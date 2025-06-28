import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'

import { useEffectQuery } from '../hooks/use-tanstack-effect'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CopyableAddress } from './ui/copyable-address'
import { Skeleton } from './ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

// Types for the users response
interface User {
  role: string
  address?: string
  twitter_username?: string
  twitter_display_name?: string
  twitter_user_id?: string
  whatsapp_phone?: string
  createdAt: string | Date
}

export function UsersTable() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const {
    data: usersData,
    isLoading,
    error,
  } = useEffectQuery(
    'users',
    '',
    { urlParams: { page, limit } },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  )

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Failed to load users data
            </p>
            <p className="mt-2 text-xs text-red-500">
              {error.message || 'Unknown error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatRole = (role: string) => {
    const variants = {
      SUPER: 'destructive',
      ADMIN: 'default',
      USER: 'secondary',
    } as const
    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {role}
      </Badge>
    )
  }

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return 'N/A'
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users Table
          {usersData?.pagination && (
            <span className="text-muted-foreground text-sm font-normal">
              ({usersData.pagination.totalCount} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Twitter</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : usersData?.users && usersData.users.length > 0 ? (
                usersData.users.map((user, index) => (
                  <TableRow key={user.address || user.twitter_user_id || index}>
                    <TableCell>{formatRole(user.role)}</TableCell>
                    <TableCell>
                      {user.address ? (
                        <CopyableAddress
                          address={user.address}
                          name="Address"
                        />
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.twitter_username ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            @{truncateText(user.twitter_username)}
                          </span>
                          {user.twitter_display_name && (
                            <span className="text-muted-foreground text-xs">
                              {truncateText(user.twitter_display_name)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.whatsapp_phone ? (
                        <span className="font-mono text-sm">
                          {user.whatsapp_phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="text-muted-foreground mb-2 h-8 w-8" />
                      <p className="text-muted-foreground text-sm">
                        No users found
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {usersData?.pagination && usersData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-muted-foreground text-sm">
              Page {usersData.pagination.currentPage} of{' '}
              {usersData.pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!usersData.pagination.hasPrevPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!usersData.pagination.hasNextPage || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
