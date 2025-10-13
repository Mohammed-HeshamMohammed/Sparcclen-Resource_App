import React, { useState, useMemo } from 'react'
import { supabase } from '@/lib/services' // Use the single client instance
import { Button, Input, Label } from '@/components/ui'
import { Mail, Lock, Info, CheckCircle } from 'lucide-react'
import { hashPasswordSecure } from '@/lib/utils'
import { FormContentWrapper } from '../wrappers'

interface SignUpProps {
  onSuccess: () => void
  onBackToLogin?: () => void
  isTransitioning?: boolean
}

export const SignUp: React.FC<SignUpProps> = ({ onSuccess, onBackToLogin, isTransitioning = false }) => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    score = Object.values(checks).filter(Boolean).length
    
    if (score <= 1) return { score, label: 'Very Weak', color: 'bg-red-500' }
    if (score <= 2) return { score, label: 'Weak', color: 'bg-orange-500' }
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' }
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' }
    return { score, label: 'Strong', color: 'bg-green-500' }
  }, [password])

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
      // Deterministic client-side hash so the same password yields the same value
      const { hash: hashedPassword } = await hashPasswordSecure(password)

      const { error } = await supabase.auth.signUp({
        email,
        password: hashedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
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

  return (
    <div className="w-[850px] h-[700px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Form */}
        <div className="w-1/2 p-10 md:p-12 flex flex-col">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            {success ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to Sparcclen
                  </h1>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <FormContentWrapper isVisible={!isTransitioning}>
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Account Created!
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 max-w-xs">
                      We've sent a confirmation link to <strong>{email}</strong>.
                      Please check your inbox and click the link to activate your account.
                    </p>

                    <Button
                      onClick={onBackToLogin || onSuccess}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md"
                    >
                      Back to Login
                    </Button>
                  </FormContentWrapper>
                </div>
 
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Create a Sparcclen Account
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Initiate the impossible with Sparcclen's powerful platform
                  </p>
                </div>

                <div className="flex-1 flex flex-col">
                  <FormContentWrapper isVisible={!isTransitioning}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Display Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</Label>
                        <div className="relative">
                          <Input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                            className="pl-4 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
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

                      {/* Password Field with Integrated Strength Indicator */}
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            placeholder="Create a strong password"
                            required
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          
                          {/* Password Strength Indicator - Integrated into input */}
                          {password && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((bar) => (
                                <div
                                  key={bar}
                                  className={`h-1 w-1 rounded-full transition-all duration-300 ${
                                    bar <= passwordStrength.score
                                      ? passwordStrength.color
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Password Strength Label */}
                        {password && (
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-medium ${
                              passwordStrength.score <= 2 ? 'text-red-600' :
                              passwordStrength.score <= 3 ? 'text-orange-600' :
                              passwordStrength.score <= 4 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {passwordStrength.label}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {password.length}/8+ characters
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password Field */}
                      <div className="space-y-2">
                        <Label htmlFor="repeatPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="repeatPassword"
                            type="password"
                            value={repeatPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepeatPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>
                        {repeatPassword && password !== repeatPassword && (
                          <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                        )}
                        {repeatPassword && password === repeatPassword && password && (
                          <p className="text-xs text-green-600 dark:text-green-400">Passwords match</p>
                        )}
                      </div>

                      {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center text-sm">
                          <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                          {error}
                        </div>
                      )}

                      <div className="pt-4">
                        <Button
                          type="submit"
                          disabled={loading || password !== repeatPassword || passwordStrength.score < 2}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                          {loading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      </div>

                      <div className="text-center text-sm pt-2">
                        <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
                        <button
                          type="button"
                          onClick={onBackToLogin}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors"
                        >
                          Login
                        </button>
                      </div>
                    </form>
                  </FormContentWrapper>
                </div>
 
              </>
            )}
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
