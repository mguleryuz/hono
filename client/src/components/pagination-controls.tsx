import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@c/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@c/components/ui/select'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  className?: string
  showPageSizeSelect?: boolean
  pageSizeOptions?: number[]
  itemName?: string // e.g., "leaderboards", "users"
}

/**
 * Reusable pagination controls component with page navigation and optional page size selection
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalCount,
  limit,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onLimitChange,
  className,
  showPageSizeSelect = false,
  pageSizeOptions = [10, 20, 50, 100],
  itemName = 'items',
}: PaginationControlsProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, 'ellipsis-start')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('ellipsis-end', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()

  // Calculate display range
  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, totalCount)

  // if (totalPages <= 1) {
  //   return null // Don't show pagination if there's only one page or no items
  // }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Results info */}
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          Showing {startItem}-{endItem} of {totalCount} {itemName}
        </span>
        {showPageSizeSelect && onLimitChange && (
          <div className="flex items-center gap-2">
            <span>Show</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Pagination component */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => hasPrevPage && onPageChange(currentPage - 1)}
              style={{
                pointerEvents: hasPrevPage ? 'auto' : 'none',
                opacity: hasPrevPage ? 1 : 0.5,
              }}
            />
          </PaginationItem>

          {pageNumbers.map((pageNum, index) => (
            <PaginationItem key={index}>
              {pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={pageNum === currentPage}
                  onClick={() =>
                    typeof pageNum === 'number' && onPageChange(pageNum)
                  }
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => hasNextPage && onPageChange(currentPage + 1)}
              style={{
                pointerEvents: hasNextPage ? 'auto' : 'none',
                opacity: hasNextPage ? 1 : 0.5,
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
