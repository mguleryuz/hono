import { useCallback, useState } from 'react'

interface PaginationState {
  page: number
  limit: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
}

interface UsePaginationReturn {
  pagination: PaginationState
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  prevPage: () => void
  updatePagination: (newPagination: Partial<PaginationState>) => void
}

/**
 * Hook for managing pagination state
 */
export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationReturn {
  const { initialPage = 1, initialLimit = 10 } = options

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 })) // Reset to page 1 when changing limit
  }, [])

  const nextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.hasNextPage) {
        return { ...prev, page: prev.page + 1 }
      }
      return prev
    })
  }, [])

  const prevPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.hasPrevPage) {
        return { ...prev, page: prev.page - 1 }
      }
      return prev
    })
  }, [])

  const updatePagination = useCallback(
    (newPagination: Partial<PaginationState>) => {
      setPagination((prev) => ({ ...prev, ...newPagination }))
    },
    []
  )

  return {
    pagination,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    updatePagination,
  }
}
