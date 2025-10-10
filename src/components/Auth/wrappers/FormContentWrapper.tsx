import React, { useState, useEffect } from 'react'

interface FormContentWrapperProps {
  children: React.ReactNode
  isVisible: boolean
  className?: string
}

export function FormContentWrapper({ children, isVisible, className = '' }: FormContentWrapperProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      // Wait for transition to complete when showing
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
          ? 'opacity-100 transform translate-x-0'
          : 'opacity-0 transform translate-x-full'
      }`}
    >
      {children}
    </div>
  )
}
