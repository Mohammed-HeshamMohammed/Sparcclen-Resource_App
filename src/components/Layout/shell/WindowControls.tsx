import { useEffect, useState } from 'react'
import { ToggleTheme } from '../theme/ToggleTheme'
import { useThemeRateLimit } from '@/hooks/useThemeRateLimit'
import { ArrowBigDown } from 'lucide-react'

interface WindowControlsProps {
  className?: string
  isMaximized?: boolean
  onMaximizeToggle?: () => void
}

export function WindowControls({ className, isMaximized: _isMaximized, onMaximizeToggle }: WindowControlsProps) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const { isCooldownActive, remainingCooldownTime } = useThemeRateLimit()
  const [isPointerOpen, setIsPointerOpen] = useState(false)

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const getWindowApi = () => {
    if (typeof window === 'undefined') return null
    const globalWindow = window as typeof window & {
      api?: {
        window?: {
          minimize?: () => Promise<unknown>
          maximize?: () => Promise<unknown>
          close?: () => Promise<unknown>
        }
        minimize?: () => Promise<unknown>
        maximize?: () => Promise<unknown>
        close?: () => Promise<unknown>
      }
    }

    const bridge = globalWindow.api
    if (!bridge) {
      console.warn('[WindowControls] preload bridge (window.api) not available')
      return null
    }

    const candidate =
      bridge.window && typeof bridge.window === 'object'
        ? bridge.window
        : bridge

    return candidate
  }

  const handleMinimize = async () => {
    try {
      await getWindowApi()?.minimize?.()
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  }

  const handleMaximize = async () => {
    try {
      await getWindowApi()?.maximize?.()
      onMaximizeToggle?.()
    } catch (error) {
      console.error('Failed to maximize window:', error)
    }
  }

  const handleClose = async () => {
    try {
      await getWindowApi()?.close?.()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <button
          onClick={() => setIsPointerOpen(v => !v)}
          className="inline-flex items-center justify-center size-8 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          style={{
            //@ts-expect-error - WebkitAppRegion is not in React CSSProperties; needed to make menu button non-draggable in Electron
            WebkitAppRegion: 'no-drag'
          }}
          aria-haspopup="true"
          aria-expanded={isPointerOpen}
          title="Open menu"
        >
          <ArrowBigDown className="h-5 w-5" />
        </button>
        {isPointerOpen && (
          <>
            {/* Arrow pointing to the dropdown top center */}
            <ArrowBigDown
              className="absolute left-1/2 -translate-x-1/2 top-5 h-4 w-4 text-gray-300 dark:text-gray-700"
              style={{
                //@ts-expect-error - WebkitAppRegion is not in React CSSProperties; needed to keep arrow interactive in Electron
                WebkitAppRegion: 'no-drag'
              }}
            />
            <div
              className="absolute left-1/2 -translate-x-1/2 top-7 z-[100] min-w-[200px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-3"
              style={{
                //@ts-expect-error - WebkitAppRegion is not in React CSSProperties; needed to allow dropdown interaction in Electron
                WebkitAppRegion: 'no-drag'
              }}
            >
            </div>
          </>
        )}
      </div>
      {/* Network status indicator with cooldown display */}
      <div className="flex items-center">
        <span
          title={isOnline ? 'Online' : 'Offline'}
          className={`inline-block w-2.5 h-2.5 rounded-full mr-1 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}
        />
        {isCooldownActive && remainingCooldownTime > 0 && (
          <span
            className="text-xs font-medium text-orange-600 dark:text-orange-400 ml-1 px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-full"
            title={`Theme cooldown: ${remainingCooldownTime}s remaining`}
          >
            {remainingCooldownTime}s
          </span>
        )}
      </div>
      {/* Theme Toggle */}
      <div>
        <ToggleTheme />
      </div>

      {/* Minimize - filled yellow circle */}
      <button
        onClick={handleMinimize}
        className="h-4 w-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors"
        style={{
          //@ts-expect-error - WebkitAppRegion is not in React CSSProperties but needed for Electron
          WebkitAppRegion: 'no-drag'
        }}
        title="Minimize"
        aria-label="Minimize"
      />

      {/* Maximize - filled green circle */}
      <button
        onClick={handleMaximize}
        className="h-4 w-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors"
        style={{
          //@ts-expect-error - WebkitAppRegion is not in React CSSProperties but needed for Electron
          WebkitAppRegion: 'no-drag'
        }}
        title="Maximize"
        aria-label="Maximize"
      />

      {/* Close - filled red circle */}
      <button
        onClick={handleClose}
        className="h-4 w-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
        style={{
          //@ts-expect-error - WebkitAppRegion is not in React CSSProperties but needed for Electron
          WebkitAppRegion: 'no-drag'
        }}
        title="Close"
        aria-label="Close"
      />
    </div>
  )
}
