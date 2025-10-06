import { useState } from 'react'
import { supabase } from '../../lib/services/supabase' // Use the single client instance
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Mail, Lock, Info } from 'lucide-react'
import { hashPasswordSecure } from '../../lib/utils/crypto'

interface LoginProps {
  onSuccess: () => void
  onSignUp?: () => void
  onForgotPassword?: () => void
}

export default function Login({ onSuccess, onSignUp, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Hash the password before sending to Supabase
      const { hash: hashedPassword } = await hashPasswordSecure(password)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: hashedPassword, // Send hashed password instead of plain text
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
    <div className="w-full min-h-fit bg-white rounded-lg overflow-hidden shadow-xl transition-all duration-300 ease-in-out">
      <div className="flex w-[800px] h-full">
        {/* Left side - Login form */}
        <div className="w-1/2 p-10 flex flex-col justify-center">
          <div className="max-w-lg mx-auto w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Fluid
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                    className="pl-3 pr-3 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white transition-all duration-200 focus:scale-[1.02]"
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center text-sm">
                  <Info className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all duration-200 hover:scale-105"
              >
                {loading ? 'Signing in...' : 'Log in'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  onClick={onSignUp}
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  Sign Up!
                </button>
              </div>
            </form>

            {/* Bottom section with password change */}
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
                  <button
                    onClick={onForgotPassword}
                    className="text-xs text-indigo-600 font-medium mt-1 hover:text-indigo-800 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
        </div>

        {/* Right side - 3D Fluid cube image */}
        <div className="w-1/2 bg-gray-200 flex items-center justify-center relative" style={{clipPath: 'ellipse(100% 50% at 0% 50%)'}}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 relative">
              {/* This would be replaced with an actual 3D cube image */}
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
   </div>
  )
}
