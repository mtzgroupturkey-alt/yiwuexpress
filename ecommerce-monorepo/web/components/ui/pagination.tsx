'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Generate page numbers to display with ellipsis for large page counts
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const pages: (number | 'ellipsis')[] = []
  
  // If 7 or fewer pages, show all
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }
  
  // Always show first page
  pages.push(1)
  
  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - 1)
  let rangeEnd = Math.min(totalPages - 1, currentPage + 1)
  
  // Adjust range to always show 3 numbers when possible
  if (rangeEnd - rangeStart < 2) {
    if (rangeStart === 2) {
      rangeEnd = Math.min(totalPages - 1, rangeEnd + 1)
    } else if (rangeEnd === totalPages - 1) {
      rangeStart = Math.max(2, rangeStart - 1)
    }
  }
  
  // Add ellipsis if gap before range
  if (rangeStart > 2) {
    pages.push('ellipsis')
  }
  
  // Add page numbers in range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }
  
  // Add ellipsis if gap after range
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis')
  }
  
  // Always show last page
  pages.push(totalPages)
  
  return pages
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = '' 
}: PaginationProps) {
  // Don't render if there's only one page or less
  if (totalPages <= 1) {
    return null
  }
  
  const pageNumbers = getPageNumbers(currentPage, totalPages)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages
  
  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-center gap-1 ${className}`}
    >
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label="Go to previous page"
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>
      
      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
                aria-hidden="true"
              >
                ...
              </span>
            )
          }
          
          const isActive = page === currentPage
          
          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? 'page' : undefined}
              className={isActive ? 'bg-primary text-white' : ''}
            >
              {page}
            </Button>
          )
        })}
      </div>
      
      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
        className="gap-1"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
