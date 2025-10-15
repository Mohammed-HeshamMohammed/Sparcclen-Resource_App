import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Category } from '@/types'
import { CategoryFilter } from '@/components/Resources'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FiltersTapProps {
  categories: Category[]
  activeCategory: string | null
  activeSubcategory: string | null
  onSelectCategory: (categoryId: string, subcategoryId?: string) => void
  onClearCategoryFilter: () => void
  classificationOptions: string[]
  activeClassification: string | null
  onClassificationChange: (value: string | null) => void
  tagOptions: string[]
  activeTag: string | null
  onTagChange: (value: string | null) => void
  isLoading?: boolean
}

function SelectFilter({
  label,
  options,
  value,
  onChange,
  disabled,
  menuColumns,
  menuWidth,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  menuColumns?: number
  menuWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(null)
  const hasOptions = options.length > 0
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null)
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false })

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPortalNode(document.body)
  }, [])

  useEffect(() => {
    if (!hasOptions || disabled) {
      setOpen(false)
    }
  }, [hasOptions, disabled])

  const recalculateMenuPosition = useCallback(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const baseColumnWidth = 160
    const gapWidth = 12
    const paddingAllowance = 32
    const defaultWidth = 280
    const desiredWidth =
      menuWidth ??
      (menuColumns
        ? menuColumns * baseColumnWidth + Math.max(menuColumns - 1, 0) * gapWidth + paddingAllowance
        : defaultWidth)
    const maxAvailableWidth = Math.max(0, window.innerWidth - 32)
    const width = Math.min(maxAvailableWidth, Math.max(rect.width, desiredWidth))
    const left = Math.min(Math.max(rect.left, 16), window.innerWidth - width - 16)
    const top = rect.bottom + 8
    setMenuStyle({
      top,
      left,
      width,
    })
  }, [menuColumns, menuWidth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!open) return
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleWindowUpdate = () => {
      if (!open) return
      recalculateMenuPosition()
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('resize', handleWindowUpdate)
    window.addEventListener('scroll', handleWindowUpdate, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('resize', handleWindowUpdate)
      window.removeEventListener('scroll', handleWindowUpdate, true)
    }
  }, [open, recalculateMenuPosition])

  useEffect(() => {
    if (!open) return
    recalculateMenuPosition()
  }, [open, recalculateMenuPosition])

  const updateScrollState = () => {
    const el = contentRef.current
    if (!el) {
      setScrollState({ canScrollUp: false, canScrollDown: false })
      return
    }
    const canScrollUp = el.scrollTop > 0
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1
    setScrollState({ canScrollUp, canScrollDown })
  }

  useEffect(() => {
    if (!open) return
    const el = contentRef.current
    updateScrollState()
    if (!el) return

    const handleScroll = () => updateScrollState()
    el.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [open, options.length])

  const scrollContent = (direction: 'up' | 'down') => {
    const el = contentRef.current
    if (!el) return
    const amount = 100
    el.scrollBy({
      top: direction === 'down' ? amount : -amount,
      behavior: 'smooth',
    })
  }

  const handleToggle = () => {
    if (disabled || !hasOptions) return
    setOpen(prev => {
      const next = !prev
      if (!prev) {
        recalculateMenuPosition()
      }
      return next
    })
  }

  const displayLabel = value ?? `All ${label.toLowerCase()}`
  if (!hasOptions) return null

  return (
    <div
      ref={containerRef}
      className="relative flex min-w-[220px] flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
    >
      <span>{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-full border border-white/25 bg-white/45 px-4 py-2 text-sm text-left text-gray-800 shadow-sm backdrop-blur-2xl transition focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700/60 dark:bg-gray-900/45 dark:text-white dark:focus:border-blue-400',
        )}
      >
        <span className="truncate capitalize">{displayLabel}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform text-gray-500 dark:text-gray-400',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && !disabled && menuStyle && portalNode &&
        createPortal(
          <div
            className="fixed z-[1600] rounded-2xl border border-white/40 bg-white p-3 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-900"
            style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
          >
            <div className="relative">
              <div
                ref={contentRef}
                className={cn(
                  'max-h-56 overflow-y-auto pr-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]',
                  menuColumns ? 'px-1' : '',
                )}
                style={{ msOverflowStyle: 'none' }}
              >
                <div
                  className={cn(
                    menuColumns ? 'grid gap-1' : 'flex flex-col gap-1',
                  )}
                  style={menuColumns ? { gridTemplateColumns: `repeat(${menuColumns}, minmax(0, 1fr))` } : undefined}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(null)
                      setOpen(false)
                    }}
                    className={cn(
                      'inline-flex items-center rounded-xl px-3 py-2 text-sm text-left transition',
                      value === null
                        ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                      menuColumns ? 'justify-self-start' : 'self-start',
                    )}
                    style={
                      menuColumns
                        ? { gridColumn: `1 / span ${menuColumns}`, justifySelf: 'start', width: 'max-content' }
                        : { width: 'max-content' }
                    }
                  >
                    All {label.toLowerCase()}
                  </button>

                  {options.map(option => {
                    const isActive = option === value
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          onChange(option)
                          setOpen(false)
                        }}
                        className={cn(
                          'w-full rounded-xl px-3 py-2 text-sm text-left transition',
                          isActive
                            ? 'bg-blue-100/80 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                aria-label={`Scroll ${label} options up`}
                disabled={!scrollState.canScrollUp}
                onClick={() => scrollContent('up')}
                className={cn(
                  'absolute right-1 top-2 inline-flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-gray-300 dark:hover:text-gray-100',
                )}
              >
                <ChevronDown className="h-4 w-4 -rotate-180" />
              </button>

              <button
                type="button"
                aria-label={`Scroll ${label} options down`}
                disabled={!scrollState.canScrollDown}
                onClick={() => scrollContent('down')}
                className={cn(
                  'absolute bottom-2 right-1 inline-flex h-8 w-8 items-center justify-center text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 dark:text-gray-300 dark:hover:text-gray-100',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>,
          portalNode
        )}
    </div>
  )
}

export function FiltersTap({
  categories,
  activeCategory,
  activeSubcategory,
  onSelectCategory,
  onClearCategoryFilter,
  classificationOptions,
  activeClassification,
  onClassificationChange,
  tagOptions,
  activeTag,
  onTagChange,
  isLoading = false,
}: FiltersTapProps) {
  const showSecondaryFilters = classificationOptions.length > 0 || tagOptions.length > 0

  return (
    <div className="w-full rounded-3xl border border-white/20 bg-white/10 px-6 py-5 backdrop-blur-xl shadow-sm dark:border-gray-700/60 dark:bg-gray-900/40">
      <div className="flex w-full flex-wrap items-center gap-6">
        <div className="min-w-[260px] flex-1">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            onSelectCategory={onSelectCategory}
            onClearFilter={onClearCategoryFilter}
          />
        </div>

        {showSecondaryFilters && (
          <div className="flex flex-wrap items-center justify-end gap-4">
            <SelectFilter
              label="Classification"
              options={classificationOptions}
              value={activeClassification}
              onChange={onClassificationChange}
              disabled={isLoading}
              menuColumns={2}
            />
            <SelectFilter
              label="Tags"
              options={tagOptions}
              value={activeTag}
              onChange={onTagChange}
              disabled={isLoading}
              menuColumns={3}
            />
          </div>
        )}
      </div>
    </div>
  )
}
