import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getThumbnailUrl(url: string): string {
  const trimmed = (url ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return ''
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = null
      func(...args)
    }, wait)
  }) as ((...args: Parameters<T>) => void) & { cancel: () => void }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}
