import { useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, Lock, Info } from 'lucide-react'
import { hashPasswordSecure } from '../../lib/utils/crypto'
import FormContentWrapper from './FormContentWrapper'
import BottomSectionWrapper from './BottomSectionWrapper'

interface LoginProps {
  onSuccess: () => void
  onSignUp?: () => void
  onForgotPassword?: () => void
  isTransitioning?: boolean
}

export default function Login({ onSuccess, onSignUp, onForgotPassword, isTransitioning = false }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Hash the password before sending to Supabase for consistent security
      const { hash: hashedPassword } = await hashPasswordSecure(password)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: hashedPassword, // Send hashed password for consistent security
      })

      if (error) {
        setError(error.message)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[900px] h-[750px] bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      <div className="flex w-full h-full">
        {/* Left side - Login form */}
        <div className="w-1/2 p-12 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full h-full flex flex-col">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Sparcclen
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Initiate the impossible
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

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        placeholder="********"
                        required
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 transition-colors"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg flex items-center text-sm">
                      <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {loading ? 'Signing in...' : 'Log in'}
                    </Button>
                  </div>

                  <div className="text-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
                    <button
                      type="button"
                      onClick={onSignUp}
                      className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Sign Up!
                    </button>
                  </div>
                </form>
              </FormContentWrapper>
            </div>

            {/* Bottom section with password change */}
            <BottomSectionWrapper isVisible={!isTransitioning}>
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-full p-1">
                    <Lock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Need to change your password?</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Update your password securely anytime you need to.
                    </p>
                    <button
                      onClick={onForgotPassword}
                      className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800"
                    >
                      Change Password
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
