import { useState } from 'react'
import { supabase } from '@/lib/services'
import { Button, Input, Label } from '@/components/ui'
import { Mail, CheckCircle, ArrowLeft, Shield } from 'lucide-react'
import { FormContentWrapper, BottomSectionWrapper } from '../wrappers'
import { SupportContactModal } from '../modals/SupportContactModal'

interface ForgotPasswordProps {
  onBack: () => void
  isTransitioning?: boolean
}

export function ForgotPassword({ onBack, isTransitioning = false }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Note: For password reset, we need the user's email to send reset instructions
      // The actual password reset will be handled by Supabase on the backend
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex w-full h-full">
          {/* Left side - Success message */}
          <div className="w-1/2 p-12 flex flex-col justify-center">
            <div className="max-w-lg mx-auto w-full h-full flex flex-col">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Reset Email Sent
                </h1>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <FormContentWrapper isVisible={!isTransitioning}>
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Email Sent Successfully!
                  </h2>

                  <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                    We've sent password reset instructions to <strong>{email}</strong>.
                    Please check your inbox and follow the link to reset your password.
                  </p>

                  <Button
                    onClick={onBack}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </div>
                  </Button>
                </FormContentWrapper>
              </div>

              {/* Bottom section with plan info */}
              <BottomSectionWrapper isVisible={!isTransitioning}>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1">
                      <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Need help with your account?</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Our support team is here to help you with any account-related issues.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSupport(true)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 hover:text-indigo-800 dark:hover:text-indigo-300"
                      >
                        Contact Support
                      </button>
                    </div>
                  </div>
                </div>
              </BottomSectionWrapper>
              <SupportContactModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
            </div>
          </div>

        {/* Right side - Visual Design */}
        <div className="w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
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
            <div className="absolute top-10 left-10 w-32 h-32 border border-indigo-300 dark:border-indigo-600 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border border-purple-300 dark:border-purple-600 rounded-full"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-pink-300 dark:border-pink-600 rounded-full"></div>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Forgot Password form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <FormContentWrapper isVisible={!isTransitioning}>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        placeholder="youremail@gmail.com"
                        required
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center text-sm">
                      <span className="w-4 h-4 mr-2 flex-shrink-0">⚠</span>
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              </FormContentWrapper>
            </div>

            {/* Bottom section with plan info */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 rounded-full p-1">
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Need help with your account?</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Our support team is here to help you with any account-related issues.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowSupport(true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </BottomSectionWrapper>
            <SupportContactModal isOpen={showSupport} onClose={() => setShowSupport(false)} />
          </div>
        </div>

        {/* Right side - Visual Design */}
        <div className="w-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
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
            <div className="absolute top-10 left-10 w-32 h-32 border border-indigo-300 dark:border-indigo-600 rounded-full"></div>
            <div className="absolute bottom-20 right-20 w-24 h-24 border border-purple-300 dark:border-purple-600 rounded-full"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 border border-pink-300 dark:border-pink-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
