import React, { useState, useEffect } from 'react'

interface BottomSectionWrapperProps {
  children: React.ReactNode
  isVisible: boolean
  className?: string
}

export function BottomSectionWrapper({ children, isVisible, className = '' }: BottomSectionWrapperProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Reset animation state after transition completes
      const timer = setTimeout(() => {}, 300)
      return () => clearTimeout(timer)
    } else {
      // Remove from DOM after fade out completes
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  if (!shouldRender) return null

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${className} ${
        isVisible
          ? 'opacity-100'
          : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}
