import { useEffect, useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthConfirm() {
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
    <div className="w-full min-h-fit bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-300 ease-in-out">
      <div className="flex w-[800px] h-full">
        {/* Left side - Confirmation status */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email Confirmation
              </h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status === 'loading' ? 'bg-blue-100 animate-pulse' :
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
                <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                  You will be redirected shortly...
                </div>
              )}

              {status === 'error' && (
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105"
                >
                  Back to Home
                </Button>
              )}
            </div>

            {/* Bottom section with help info */}
            <div className="mt-auto pt-6 border-t border-gray-200">
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
                  <button className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800 transition-colors">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - 3D Fluid cube image */}
        <div className="w-1/2 bg-gray-200 flex items-center justify-center relative" style={{clipPath: 'ellipse(100% 50% at 0% 50%)'}}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 relative">
              <div className="w-full h-full bg-indigo-400/80 rounded-lg transform rotate-12 shadow-xl"
                   style={{
                     background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.8) 0%, rgba(168, 85, 247, 0.4) 100%)',
                     boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.5)'
                   }}>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
