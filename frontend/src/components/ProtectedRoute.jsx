import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function ProtectedRoute({ children, roles, requireAuth = true }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-10">Checking authentication…</div>
  
  // Handle public routes that shouldn't be accessible when logged in (like login/signup)
  if (!requireAuth && user) {
    // Redirect based on user role
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'theaterManager') return <Navigate to="/manager" replace />
    return <Navigate to="/" replace />
  }
  
  // Handle protected routes that require authentication
  if (requireAuth) {
    if (!user) return <Navigate to="/signin" replace state={{ from: window.location.pathname }} />
    
    // Check if user has required role
    if (roles?.length && !roles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  // If we have a function as children, call it with the user
  if (typeof children === 'function') {
    return children(user)
  }
  
  // Otherwise just render the children
  return children
}
