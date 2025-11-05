import React from 'react'
import Portal from './Portal'
import useAuth from '../hooks/useAuth'
import LoginForm from './LoginForm'
import SignupForm from './SignupForm'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: Props) {
  const { user, login, signup, logout } = useAuth()
  const [mode, setMode] = React.useState<'login'|'signup'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!isOpen) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(email, password)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Auth failed')
    } finally { setLoading(false) }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/40">
        <div className="bg-haunted-900 border border-haunted-700 rounded-xl p-3 sm:p-6 max-w-xs sm:max-w-sm w-full">
          <h3 className="text-base sm:text-lg font-bold ghost-text">Account</h3>
          {user ? (
            <div className="mt-3 sm:mt-4">
              <div className="text-haunted-100 text-sm sm:text-base">Signed in as {user.email}</div>
              <div className="mt-3 sm:mt-4 flex justify-end">
                <button onClick={() => { logout(); onClose() }} className="px-2 sm:px-3 py-1 bg-haunted-600 rounded text-xs sm:text-sm">Sign out</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="space-x-1 sm:space-x-2">
                  <button type="button" onClick={() => setMode('login')} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${mode==='login'?'bg-haunted-600':''}`}>Login</button>
                  <button type="button" onClick={() => setMode('signup')} className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${mode==='signup'?'bg-haunted-600':''}`}>Sign up</button>
                </div>
                <div>
                  <button type="button" onClick={onClose} className="px-2 sm:px-3 py-1 text-xs sm:text-sm">Cancel</button>
                </div>
              </div>
              {mode === 'login' ? (
                <LoginForm onSuccess={onClose} />
              ) : (
                <SignupForm onSuccess={onClose} />
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  )
}
