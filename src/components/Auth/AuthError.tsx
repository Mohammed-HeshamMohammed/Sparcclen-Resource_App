import { Button } from '../ui/button'
import { XCircle, AlertTriangle } from 'lucide-react'
import FormContentWrapper from './FormContentWrapper'
import BottomSectionWrapper from './BottomSectionWrapper'

interface AuthErrorProps {
  error?: string
  onRetry?: () => void
  isTransitioning?: boolean
}

export default function AuthError({ error, onRetry, isTransitioning = false }: AuthErrorProps) {
  return (
    <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Error message */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Authentication Error
              </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <FormContentWrapper isVisible={!isTransitioning}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>

                <h2 className="text-xl font-semibold text-red-700">
                  Something went wrong
                </h2>

                <p className="text-red-600 max-w-xs">
                  {error ? `Error: ${error}` : 'An unspecified error occurred during authentication.'}
                </p>

                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
                  Please try again or contact support if the problem persists.
                </div>

                <div className="flex gap-3 w-full pt-2">
                  {onRetry && (
                    <Button
                      onClick={onRetry}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Try Again
                    </Button>
                  )}
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Back to Home
                  </Button>
                </div>
              </FormContentWrapper>
            </div>

            {/* Bottom section with help info */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-red-100 rounded-full p-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Need help?</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      If you continue to experience issues, please contact our support team.
                    </p>
                    <button className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800">
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </BottomSectionWrapper>
          </div>
        </div>

        {/* Right side - Visual Design */}
        <div className="w-1/2 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 relative">
              {/* Main cube */}
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl transform rotate-12 shadow-2xl"
                   style={{
                     boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                   }}>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full opacity-80 shadow-lg transform rotate-45"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-70 shadow-lg transform -rotate-12"></div>
              <div className="absolute top-1/2 -left-8 w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-full opacity-60 shadow-lg transform rotate-45"></div>
            </div>
          </div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-red-300 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border border-orange-300 rounded-full"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-yellow-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
