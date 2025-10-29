import React from 'react'
import useAuth from '../hooks/useAuth'

export default function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
  const { signup } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [touched, setTouched] = React.useState({ email: false, password: false })

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak'
  const passwordValid = password.length >= 6
  const formValid = emailValid && passwordValid

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setTouched({ email: true, password: true })
    if (!formValid) return setError('Please fix validation errors')
    setLoading(true)
    setError(null)
    try {
      await signup(email.trim(), password)
      try { localStorage.setItem('haunted_user_email', email.trim()) } catch {}
      onSuccess?.()
    } catch (err: any) {
      setError(err?.message || 'Signup failed')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="mt-4" aria-live="polite">
      <div className="mb-2">
        <label className="text-haunted-300 text-sm">Email</label>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, email: true }))}
          placeholder="you@example.com"
          aria-invalid={touched.email && !emailValid}
          className="w-full p-2 bg-haunted-800 rounded mt-1"
        />
        {touched.email && !emailValid && <div className="text-yellow-300 text-xs mt-1">Please enter a valid email</div>}
      </div>
      <div className="mb-2">
        <label className="text-haunted-300 text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, password: true }))}
          placeholder="Choose a secure password"
          aria-invalid={touched.password && !passwordValid}
          className="w-full p-2 bg-haunted-800 rounded mt-1"
        />
        {password.length > 0 && <div className="text-haunted-300 text-xs mt-1">Strength: <span className={passwordStrength==='strong'?'text-green-300':passwordStrength==='medium'?'text-yellow-300':'text-red-400'}>{passwordStrength}</span></div>}
        {touched.password && !passwordValid && <div className="text-yellow-300 text-xs mt-1">Password should be at least 6 characters</div>}
      </div>
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <div className="flex items-center justify-end space-x-2">
        <button type="submit" disabled={loading} className={`px-3 py-1 bg-haunted-600 rounded ${!formValid ? 'opacity-60 cursor-not-allowed' : ''}`}>{loading ? '...' : 'Sign up'}</button>
      </div>
    </form>
  )
}
