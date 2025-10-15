import { useEffect, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { ToggleTheme } from '../theme/ToggleTheme'
import { useThemeRateLimit } from '@/hooks/useThemeRateLimit'

interface WindowControlsProps {
  className?: string
  isMaximized?: boolean
  onMaximizeToggle?: () => void
}

export function WindowControls({ className, isMaximized: _isMaximized, onMaximizeToggle }: WindowControlsProps) {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const { isCooldownActive, remainingCooldownTime } = useThemeRateLimit()

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
    <div
      className={`flex items-center bg-transparent border-transparent space-x-2 ${className}`}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Network status indicator with cooldown display */}
      <div className="flex items-center pr-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
      <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <ToggleTheme />
      </div>

      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Minus className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Maximize Button */}
      <button
        onClick={handleMaximize}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Square className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-red-500 transition-all duration-200 hover:scale-105 group"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <X className="w-4 h-4 text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors" />
      </button>
    </div>
  )
}
