import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPrevNext?: boolean
  showFirstLast?: boolean
  maxVisible?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPrevNext = true,
  showFirstLast = true,
  maxVisible = 7,
}: PaginationProps) {
  const pages = React.useMemo(() => {
    const items: (number | string)[] = []
    
    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      // Always show first page
      items.push(1)

      const leftSiblingIndex = Math.max(currentPage - 1, 2)
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1)

      const shouldShowLeftDots = leftSiblingIndex > 2
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1

      if (!shouldShowLeftDots && shouldShowRightDots) {
        // Show pages at start
        for (let i = 2; i <= Math.min(maxVisible - 2, totalPages - 1); i++) {
          items.push(i)
        }
        items.push('...')
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        // Show pages at end
        items.push('...')
        for (let i = Math.max(2, totalPages - maxVisible + 3); i <= totalPages - 1; i++) {
          items.push(i)
        }
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        // Show pages in middle
        items.push('...')
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          items.push(i)
        }
        items.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(totalPages)
      }
    }

    return items
  }, [currentPage, totalPages, maxVisible])

  if (totalPages <= 1) {
    return null
  }

  return (
    <nav className="flex items-center justify-center space-x-2">
      {showPrevNext && (
        <>
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">First page</span>
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      )}

      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="outline"
              size="sm"
              disabled
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
            className="h-8 w-8 p-0"
          >
            {page}
          </Button>
        )
      })}

      {showPrevNext && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Last page</span>
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          )}
        </>
      )}
    </nav>
  )
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}) {
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="text-sm text-gray-600">
      Showing <span className="font-medium">{start}</span> to{" "}
      <span className="font-medium">{end}</span> of{" "}
      <span className="font-medium">{totalItems}</span> results
    </div>
  )
}
