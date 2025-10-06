import { useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, ArrowRight, CheckCircle, ArrowLeft, Shield } from 'lucide-react'

interface ForgotPasswordProps {
  onBack: () => void
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full min-h-fit bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-300 ease-in-out">
        <div className="flex w-[800px] h-full">
          {/* Left side - Success message */}
          <div className="w-1/2 p-10 flex flex-col justify-center">
            <div className="max-w-lg mx-auto w-full">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Reset Email Sent
                </h1>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-8 h-8 text-indigo-600" />
                </div>

                <h2 className="text-xl font-semibold text-gray-900">
                  Email Sent Successfully!
                </h2>

                <p className="text-gray-600 max-w-xs">
                  We've sent password reset instructions to <strong>{email}</strong>.
                  Please check your inbox and follow the link to reset your password.
                </p>

                <Button
                  onClick={onBack}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </div>
                </Button>
              </div>

              {/* Bottom section with plan info */}
              <div className="mt-auto pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Need help with your account?</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Our support team is here to help you with any account-related issues.
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

  return (
    <div className="w-full min-h-fit bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-300 ease-in-out">
      <div className="flex w-[800px] h-full">
        {/* Left side - Forgot Password form */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@gmail.com"
                    required
                    className="pl-3 pr-3 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all duration-200 focus:scale-[1.02]"
                  />
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm">
                  <span className="w-4 h-4 mr-2 flex-shrink-0">⚠</span>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  ← Back to Login
                </button>
              </div>
            </form>

            {/* Bottom section with plan info */}
            <div className="mt-auto pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                  <Shield className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Need help with your account?</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Our support team is here to help you with any account-related issues.
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
