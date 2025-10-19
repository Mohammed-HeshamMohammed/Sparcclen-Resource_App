import { useEffect, useState } from 'react'
import { supabase } from '@/lib/services' // Use the single client instance
import { Button } from '@/components/ui'
import { CheckCircle, XCircle, Loader2, Clock, UserCheck, AlertCircle } from 'lucide-react'
import { FormContentWrapper, BottomSectionWrapper } from '../wrappers'

interface AuthConfirmProps {
  isTransitioning?: boolean
}

type ErrorType = 'expired' | 'already_confirmed' | 'invalid' | 'generic'

export function AuthConfirm({ isTransitioning = false }: AuthConfirmProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [errorType, setErrorType] = useState<ErrorType>('generic')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleAuthConfirm = async () => {

      // Get the URL parameters from both query string and hash fragment
      const urlParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      // Check for errors first (Supabase redirects with error in hash)
      const error = urlParams.get('error') || hashParams.get('error')
      const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')

      if (error) {
        setStatus('error')
        
        // Determine error type based on error code
        if (errorCode === 'otp_expired' || error === 'otp_expired') {
          setErrorType('expired')
          setMessage('Your confirmation link has expired. Please request a new one.')
        } else if (errorDescription?.toLowerCase().includes('already') || error === 'already_confirmed') {
          setErrorType('already_confirmed')
          setMessage('Your email is already confirmed! You can log in now.')
        } else if (error === 'access_denied') {
          setErrorType('invalid')
          setMessage('This confirmation link is invalid or has already been used.')
        } else {
          setErrorType('generic')
          setMessage(errorDescription ? decodeURIComponent(errorDescription) : 'An error occurred during confirmation.')
        }
        return
      }
      
      // Supabase puts tokens in hash fragment, check both locations
      const token_hash = urlParams.get('token_hash') || hashParams.get('token_hash')
      const type = urlParams.get('type') || hashParams.get('type')
      const next = urlParams.get('next') || hashParams.get('next') || '/'

      if (token_hash && type) {
        // Supabase verifyOtp for email links expects 'email' or 'email_change'
        const mappedType: 'email' | 'email_change' = type === 'email_change' ? 'email_change' : 'email'
        try {
          const { error } = await supabase.auth.verifyOtp({
            type: mappedType,
            token_hash,
          })

          if (error) {
            setStatus('error')
            
            // Parse error message for specific cases
            if (error.message.toLowerCase().includes('expired')) {
              setErrorType('expired')
              setMessage('Your confirmation link has expired. Please request a new one.')
            } else if (error.message.toLowerCase().includes('already')) {
              setErrorType('already_confirmed')
              setMessage('Your email is already confirmed! You can log in now.')
            } else {
              setErrorType('generic')
              setMessage(error.message)
            }
          } else {
            setStatus('success')
            setMessage('Email confirmed successfully!')
            
            // Start Windows-style progress animation
            const progressInterval = setInterval(() => {
              setProgress((prev) => {
                if (prev >= 100) {
                  clearInterval(progressInterval)
                  return 100
                }
                return prev + 2
              })
            }, 40)
            
            // Redirect after animation completes
            setTimeout(() => {
              window.location.href = next
            }, 2500)
          }
        } catch {
          setStatus('error')
          setErrorType('generic')
          setMessage('An unexpected error occurred')
        }
      } else {
        setStatus('error')
        setErrorType('invalid')
        setMessage('No confirmation token found in the URL.')
      }
    }

    handleAuthConfirm()
  }, [])

  return (
    <div className="w-[800px] h-[600px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
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
                {/* Icon based on status and error type */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  status === 'loading' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                  errorType === 'expired' ? 'bg-orange-100 dark:bg-orange-900/30' :
                  errorType === 'already_confirmed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  {status === 'loading' && <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />}
                  {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />}
                  {status === 'error' && errorType === 'expired' && <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />}
                  {status === 'error' && errorType === 'already_confirmed' && <UserCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                  {status === 'error' && errorType === 'invalid' && <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />}
                  {status === 'error' && errorType === 'generic' && <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />}
                </div>

                {/* Title based on status and error type */}
                <h2 className={`text-xl font-semibold ${
                  status === 'loading' ? 'text-gray-900 dark:text-white' :
                  status === 'success' ? 'text-green-700 dark:text-green-400' :
                  errorType === 'expired' ? 'text-orange-700 dark:text-orange-400' :
                  errorType === 'already_confirmed' ? 'text-blue-700 dark:text-blue-400' :
                  'text-red-700 dark:text-red-400'
                }`}>
                  {status === 'loading' && 'Confirming Your Email...'}
                  {status === 'success' && 'Email Confirmed!'}
                  {status === 'error' && errorType === 'expired' && 'Link Expired'}
                  {status === 'error' && errorType === 'already_confirmed' && 'Already Confirmed'}
                  {status === 'error' && errorType === 'invalid' && 'Invalid Link'}
                  {status === 'error' && errorType === 'generic' && 'Confirmation Failed'}
                </h2>

                {/* Message */}
                <p className={`max-w-xs ${
                  status === 'loading' ? 'text-gray-600 dark:text-gray-400' :
                  status === 'success' ? 'text-green-600 dark:text-green-400' :
                  errorType === 'expired' ? 'text-orange-600 dark:text-orange-400' :
                  errorType === 'already_confirmed' ? 'text-blue-600 dark:text-blue-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {status === 'loading' && 'Please wait while we verify your email address...'}
                  {status === 'success' && message}
                  {status === 'error' && message}
                </p>

                {/* Success state with Windows-style progress bar */}
                {status === 'success' && (
                  <div className="w-full max-w-xs space-y-3">
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm">
                      Redirecting you to login...
                    </div>
                    
                    {/* Windows-style progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {progress < 100 ? `${Math.round(progress)}% complete` : 'Complete!'}
                    </p>
                  </div>
                )}

                {/* Error state with specific actions */}
                {status === 'error' && (
                  <div className="w-full max-w-xs space-y-3">
                    {errorType === 'expired' && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-1">What happened?</p>
                        <p className="text-xs">Confirmation links expire after 24 hours for security. Please sign up again to receive a new link.</p>
                      </div>
                    )}
                    
                    {errorType === 'already_confirmed' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-1">Good news!</p>
                        <p className="text-xs">Your account is ready to use. Just log in with your credentials.</p>
                      </div>
                    )}
                    
                    {errorType === 'invalid' && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-1">Invalid or used link</p>
                        <p className="text-xs">This link may have already been used or is invalid. Try signing up again if needed.</p>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        {errorType === 'already_confirmed' ? 'Go to Login' : 'Back to Home'}
                      </Button>
                    </div>
                  </div>
                )}
              </FormContentWrapper>
            </div>

            {/* Bottom section with contextual help info */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start">
                  <div className={`flex-shrink-0 rounded-full p-1 ${
                    status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                    errorType === 'expired' ? 'bg-orange-100 dark:bg-orange-900/30' :
                    errorType === 'already_confirmed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                    'bg-indigo-100 dark:bg-indigo-900/30'
                  }`}>
                    <svg className={`w-4 h-4 ${
                      status === 'success' ? 'text-green-600 dark:text-green-400' :
                      errorType === 'expired' ? 'text-orange-600 dark:text-orange-400' :
                      errorType === 'already_confirmed' ? 'text-blue-600 dark:text-blue-400' :
                      'text-indigo-600 dark:text-indigo-400'
                    }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {status === 'success' && 'Welcome aboard!'}
                      {status === 'error' && errorType === 'expired' && 'Need a new link?'}
                      {status === 'error' && errorType === 'already_confirmed' && 'Ready to start?'}
                      {status === 'error' && (errorType === 'invalid' || errorType === 'generic') && 'Need help?'}
                      {status === 'loading' && 'Almost there...'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {status === 'success' && 'Your account is now active. You can start using all features immediately.'}
                      {status === 'error' && errorType === 'expired' && 'Go back to the signup page to request a fresh confirmation link.'}
                      {status === 'error' && errorType === 'already_confirmed' && 'Your email is verified. Head to the login page to access your account.'}
                      {status === 'error' && (errorType === 'invalid' || errorType === 'generic') && 'If you continue to experience issues, please contact our support team.'}
                      {status === 'loading' && 'Verifying your email address...'}
                    </p>
                    {status === 'error' && (
                      <button 
                        onClick={() => window.location.href = '/'}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        {errorType === 'already_confirmed' ? 'Go to Login' : 'Contact Support'}
                      </button>
                    )}
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
