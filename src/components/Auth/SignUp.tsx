import React, { useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, Lock, Info, CheckCircle, ArrowRight } from 'lucide-react'
import { hashPasswordSecure } from '../../lib/utils/crypto'

interface SignUpProps {
  onSuccess: () => void
  onBackToLogin?: () => void
}

const SignUpComponent: React.FC<SignUpProps> = ({ onSuccess, onBackToLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!password) {
      setError('Password is required')
      setLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setLoading(false)
      return
    }

    try {
      // Hash the password before sending to Supabase
      const { hash: hashedPassword } = await hashPasswordSecure(password)

      const { error } = await supabase.auth.signUp({
        email,
        password: hashedPassword, // Send hashed password instead of plain text
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
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

  return (
    <div className="w-full min-h-fit bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-300 ease-in-out">
      <div className="flex w-[800px] h-full">
        {/* Left side - Form */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            {success ? (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Fluid
                  </h1>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="w-8 h-8 text-indigo-600" />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900">
                    Account Created!
                  </h2>

                  <p className="text-gray-600 max-w-xs">
                    We've sent a confirmation link to <strong>{email}</strong>.
                    Please check your inbox and click the link to activate your account.
                  </p>

                  <Button
                    onClick={onBackToLogin || onSuccess}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105"
                  >
                    Back to Login
                  </Button>
                </div>

                {/* Bottom section with plan change info */}
                <div className="mt-auto pt-6 border-t border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                      <Lock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Need to change your password?</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Update your password securely anytime you need to.
                      </p>
                      <button className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Create a Fluid Account
                  </h1>
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

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="pl-3 pr-3 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all duration-200 focus:scale-[1.02]"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="repeatPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="repeatPassword"
                        type="password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="pl-3 pr-3 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all duration-200 focus:scale-[1.02]"
                      />
                      <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm animate-pulse">
                      <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <button
                      type="button"
                      onClick={onBackToLogin}
                      className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                    >
                      Login
                    </button>
                  </div>
                </form>

                {/* Bottom section with plan change info */}
                <div className="mt-auto pt-6 border-t border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                      <Lock className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Need to change your password?</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Update your password securely anytime you need to.
                      </p>
                      <button className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800 transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side - 3D Fluid cube image */}
        <div className="w-1/2 bg-gray-200 flex items-center justify-center relative" style={{clipPath: 'ellipse(100% 50% at 0% 50%)'}}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 relative">
              {/* This would be replaced with an actual 3D cube image */}
              <div className="w-full h-full bg-indigo-400/80 rounded-lg transform rotate-12 shadow-xl transition-transform duration-500 hover:rotate-6"
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

export default SignUpComponent
