import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { toast } from '../lib/toast'

export default function SignUp(){
  const navigate = useNavigate()
  const register = useAuth(s => s.register)
  const error = useAuth(s => s.error)
  const errors = useAuth(s => s.errors)
  const loading = useAuth(s => s.loading)
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role:'endUser' })

  const onSubmit = async (e) => {
    e.preventDefault()
    const user = await register(form)
    if (!user) { 
      toast.error('Registration failed', error || 'Please fix the errors and try again.')
      return 
    }
    toast.success('Account created', `Welcome ${user.name}`)
    navigate('/')
  }

  const set = (k,v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">Create your CineGo account</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {errors && Array.isArray(errors) && (
          <ul className="text-red-300 text-sm list-disc pl-5 space-y-1">
            {errors.map((e,i)=> <li key={i}>{e.msg}</li>)}
          </ul>
        )}
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input value={form.name} onChange={e=>set('name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" autoComplete="email" value={form.email} onChange={e=>set('email', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input value={form.phone} onChange={e=>set('phone', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" placeholder="e.g. +919876543210" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" autoComplete="new-password" value={form.password} onChange={e=>set('password', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2" placeholder="At least 8 characters" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Register as</label>
          <select value={form.role} onChange={e=>set('role', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <option value="endUser">End User</option>
            <option value="theaterManager">Theater Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button disabled={loading} className="w-full px-4 py-2 rounded-md bg-brand hover:bg-brand-dark transition text-white">{loading? 'Creating...' : 'Create Account'}</button>
        <div className="text-sm text-white/70">Already have an account? <Link to="/signin" className="text-brand">Sign in</Link></div>
      </form>
    </div>
  )
}
