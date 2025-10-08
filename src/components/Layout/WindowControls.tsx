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
