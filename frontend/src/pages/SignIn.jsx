import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../store/authSlice';
import { toast } from '../lib/toast';
import AuthRedirect from '../components/AuthRedirect';

export default function SignIn(){
  const navigate = useNavigate()
  const location = useLocation()

  const dispatch = useDispatch();
  const { user, loading, error, errors } = useSelector((state) => ({
    user: state.auth.user,
    loading: state.auth.loading,
    error: state.auth.error,
    errors: state.auth.errors
  }));

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [touched, setTouched] = useState({})
  
  // If user is already logged in, AuthRedirect will handle the redirection
  useEffect(() => {
    if (user) {
      return <AuthRedirect to="/" />;
    }
  }, [user]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    if (touched.email) {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (touched.password) {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setValidationErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setValidationErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      email: validateEmail(email),
      password: validatePassword(password)
    };
    
    setValidationErrors(newErrors);
    setTouched({ email: true, password: true });
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      toast.error('Validation failed', 'Please fix the errors and try again.');
      return;
    }
    
    const resultAction = await dispatch(login({ email, password }));
    
    if (login.fulfilled.match(resultAction)) {
      const loggedInUser = resultAction.payload;
      toast.success('Welcome back', `Signed in as ${loggedInUser.name || loggedInUser.email}`);
      
      // Handle redirect logic after login
      const fromLocation = location.state?.from;

      if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (loggedInUser.role === 'theaterManager') {
        navigate('/manager', { replace: true });
      } else if (fromLocation) {
        navigate(fromLocation.pathname + fromLocation.search, { 
          replace: true, 
          state: fromLocation.state 
        });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      toast.error('Sign in failed', 'Please check your email and password.');
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 min-h-[70vh]">
      <h1 className="text-2xl font-bold mb-4">Sign in to CineGo</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {errors && Array.isArray(errors) && (
          <ul className="text-red-300 text-sm list-disc pl-5 space-y-1">
            {errors.map((e,i)=> <li key={i}>{e.msg}</li>)}
          </ul>
        )}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input 
            type="email" 
            autoComplete="email" 
            value={email} 
            onChange={e=>handleEmailChange(e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.email && validationErrors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            required 
          />
          {touched.email && validationErrors.email && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input 
            type="password" 
            autoComplete="current-password" 
            value={password} 
            onChange={e=>handlePasswordChange(e.target.value)}
            onBlur={() => handleBlur('password')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.password && validationErrors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            required 
          />
          {touched.password && validationErrors.password && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>
        <button disabled={loading} className="w-full px-4 py-2 rounded-md bg-brand hover:bg-brand-dark transition text-white">{loading? 'Signing in...' : 'Sign In'}</button>
        <div className="text-sm text-white/70">Don't have an account? <Link to="/signup" className="text-brand">Create one</Link></div>
      </form>
    </div>
  )
}