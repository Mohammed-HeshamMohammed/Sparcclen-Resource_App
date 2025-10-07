import React, { useState, useEffect } from 'react'

interface FormContentWrapperProps {
  children: React.ReactNode
  isVisible: boolean
  className?: string
}

export default function FormContentWrapper({ children, isVisible, className = '' }: FormContentWrapperProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      setIsAnimating(true)
      // Reset animation state after transition completes
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(true)
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
