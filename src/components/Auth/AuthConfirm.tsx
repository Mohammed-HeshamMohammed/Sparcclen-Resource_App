import { useEffect, useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import FormContentWrapper from './FormContentWrapper'
import BottomSectionWrapper from './BottomSectionWrapper'

interface AuthConfirmProps {
  isTransitioning?: boolean
}

export default function AuthConfirm({ isTransitioning = false }: AuthConfirmProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthConfirm = async () => {

      // Get the URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const token_hash = urlParams.get('token_hash')
      const type = urlParams.get('type')
      const next = urlParams.get('next') || '/'

      if (token_hash && type) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            type: type as any,
            token_hash,
          })

          if (error) {
            setStatus('error')
            setMessage(error.message)
          } else {
            setStatus('success')
            setMessage('Email confirmed successfully!')
            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = next
            }, 2000)
          }
        } catch (err) {
          setStatus('error')
          setMessage('An unexpected error occurred')
        }
      } else {
        setStatus('error')
        setMessage('No token hash or type provided')
      }
    }

    handleAuthConfirm()
  }, [])

  return (
    <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Confirmation status */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email Confirmation
              </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <FormContentWrapper isVisible={!isTransitioning}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  status === 'loading' ? 'bg-blue-100' :
                  status === 'success' ? 'bg-green-100' :
                  'bg-red-100'
                }`}>
                  {status === 'loading' && <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}
                  {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
                  {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
                </div>

                <h2 className={`text-xl font-semibold ${
                  status === 'loading' ? 'text-gray-900' :
                  status === 'success' ? 'text-green-700' :
                  'text-red-700'
                }`}>
                  {status === 'loading' && 'Confirming...'}
                  {status === 'success' && 'Email Confirmed!'}
                  {status === 'error' && 'Confirmation Failed'}
                </h2>

                <p className={`max-w-xs ${
                  status === 'loading' ? 'text-gray-600' :
                  status === 'success' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {status === 'loading' && 'Please wait while we confirm your email...'}
                  {status === 'success' && message}
                  {status === 'error' && message}
                </p>

                {status === 'success' && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
                    You will be redirected shortly...
                  </div>
                )}

                {status === 'error' && (
                  <div className="pt-2">
                    <Button
                      onClick={() => window.location.href = '/'}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Back to Home
                    </Button>
                  </div>
                )}
              </FormContentWrapper>
            </div>

            {/* Bottom section with help info */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Need help?</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      If you're having trouble confirming your email, please check your spam folder or try again.
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
        <div className="w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-80 h-80 relative">
              {/* Main cube */}
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl transform rotate-12 shadow-2xl"
                   style={{
                     boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                   }}>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full opacity-80 shadow-lg transform rotate-45"></div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full opacity-70 shadow-lg transform -rotate-12"></div>
              <div className="absolute top-1/2 -left-8 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-60 shadow-lg transform rotate-45"></div>
            </div>
          </div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 border border-indigo-300 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border border-purple-300 rounded-full"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-pink-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
