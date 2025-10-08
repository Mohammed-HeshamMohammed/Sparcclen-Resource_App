import { Minus, Square, X } from 'lucide-react'
import { ToggleTheme } from './ToggleTheme'

interface WindowControlsProps {
  className?: string
  isMaximized?: boolean
  onMaximizeToggle?: () => void
}

export function WindowControls({ className, isMaximized, onMaximizeToggle }: WindowControlsProps) {
  const handleMinimize = () => {
    try {
      window.api?.minimize()
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  }

  const handleMaximize = () => {
    try {
      window.api?.maximize()
      onMaximizeToggle?.()
    } catch (error) {
      console.error('Failed to maximize window:', error)
    }
  }

  const handleClose = () => {
    try {
      window.api?.close()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }

  return (
    <div className={`flex items-center bg-transparent border-transparent space-x-2 ${className}`}>
      {/* Theme Toggle */}
      <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <ToggleTheme />
      </div>

      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Minus className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Maximize Button */}
      <button
        onClick={handleMaximize}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Square className="w-4 h-4 text-gray-700 dark:text-gray-200" />
      </button>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-sm transition-all duration-200 hover:scale-105"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}
