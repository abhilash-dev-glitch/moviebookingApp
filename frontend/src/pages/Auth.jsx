import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../store/authSlice';
import { toast } from '../lib/toast';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  
  const { user, loading, error, errors } = useSelector((state) => ({
    user: state.auth.user,
    loading: state.auth.loading,
    error: state.auth.error,
    errors: state.auth.errors
  }));

  // Determine initial mode from URL
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState(initialMode);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form state
  const [signUpForm, setSignUpForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    role: 'endUser' 
  });
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Clear errors when switching modes
  useEffect(() => {
    setValidationErrors({});
    setTouched({});
    dispatch(clearError());
  }, [mode, dispatch]);

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
    if (phone.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
    return '';
  };

  const validatePassword = (password, isSignUp = false) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (isSignUp) {
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
      if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPwd) => {
    if (!confirmPwd) return 'Please confirm your password';
    if (confirmPwd !== signUpForm.password) return 'Passwords do not match';
    return '';
  };

  // Sign In handlers
  const handleSignInEmailChange = (value) => {
    setSignInEmail(value);
    if (touched.signInEmail) {
      setValidationErrors(prev => ({ ...prev, signInEmail: validateEmail(value) }));
    }
  };

  const handleSignInPasswordChange = (value) => {
    setSignInPassword(value);
    if (touched.signInPassword) {
      setValidationErrors(prev => ({ ...prev, signInPassword: validatePassword(value, false) }));
    }
  };

  // Sign Up handlers
  const setSignUpField = (k, v) => {
    setSignUpForm(prev => ({ ...prev, [k]: v }));
    if (touched[k]) {
      let error = '';
      switch (k) {
        case 'name': error = validateName(v); break;
        case 'email': error = validateEmail(v); break;
        case 'phone': error = validatePhone(v); break;
        case 'password': error = validatePassword(v, true); break;
      }
      setValidationErrors(prev => ({ ...prev, [k]: error }));
    }
    // Re-validate confirm password when password changes
    if (k === 'password' && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword);
      setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      const error = validateConfirmPassword(value);
      setValidationErrors(prev => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (mode === 'signin') {
      if (field === 'signInEmail') {
        setValidationErrors(prev => ({ ...prev, signInEmail: validateEmail(signInEmail) }));
      } else if (field === 'signInPassword') {
        setValidationErrors(prev => ({ ...prev, signInPassword: validatePassword(signInPassword, false) }));
      }
    } else {
      if (field === 'confirmPassword') {
        setValidationErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
      } else {
        let error = '';
        switch (field) {
          case 'name': error = validateName(signUpForm.name); break;
          case 'email': error = validateEmail(signUpForm.email); break;
          case 'phone': error = validatePhone(signUpForm.phone); break;
          case 'password': error = validatePassword(signUpForm.password, true); break;
        }
        setValidationErrors(prev => ({ ...prev, [field]: error }));
      }
    }
  };

  // Sign In submit
  const handleSignIn = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      signInEmail: validateEmail(signInEmail),
      signInPassword: validatePassword(signInPassword, false)
    };
    
    setValidationErrors(newErrors);
    setTouched({ signInEmail: true, signInPassword: true });
    
    if (Object.values(newErrors).some(error => error !== '')) {
      toast.error('Validation failed', 'Please fix the errors and try again.');
      return;
    }
    
    const resultAction = await dispatch(login({ email: signInEmail, password: signInPassword }));
    
    if (login.fulfilled.match(resultAction)) {
      const loggedInUser = resultAction.payload;
      toast.success('Welcome back', `Signed in as ${loggedInUser.name || loggedInUser.email}`);
      
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
  };

  // Sign Up submit
  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      name: validateName(signUpForm.name),
      email: validateEmail(signUpForm.email),
      phone: validatePhone(signUpForm.phone),
      password: validatePassword(signUpForm.password, true),
      confirmPassword: validateConfirmPassword(confirmPassword)
    };
    
    setValidationErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    
    if (Object.values(newErrors).some(error => error !== '')) {
      toast.error('Validation failed', 'Please fix the errors and try again.');
      return;
    }
    
    const resultAction = await dispatch(register(signUpForm));
    
    if (register.fulfilled.match(resultAction)) {
      const newUser = resultAction.payload;
      toast.success('Account created', `Welcome ${newUser.name}`);
      navigate('/');
    } else {
      toast.error('Registration failed', error || 'Please fix the errors and try again.');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-brand/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-dark mb-4 shadow-2xl shadow-brand/50 transform hover:scale-110 transition-transform duration-300">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-transparent">
            {mode === 'signin' ? 'Welcome Back' : 'Join CineGo'}
          </h1>
          <p className="text-white/60 text-sm">
            {mode === 'signin' 
              ? 'Sign in to continue your movie journey' 
              : 'Create an account to book your favorite movies'}
          </p>
        </div>

        {/* Glass Card Container */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
          
          {/* Animated Toggle with Icons */}
          <div className="relative bg-gray-900/95 backdrop-blur-md border-2 border-white/40 rounded-full p-2 mb-8 shadow-2xl">
            <div className="grid grid-cols-2 relative gap-2">
              {/* Sliding background with glow */}
              <div 
                className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-gradient-to-br from-emerald-500 via-green-500 to-emerald-600 rounded-full transition-all duration-500 ease-out ${
                  mode === 'signup' ? 'translate-x-[calc(100%+16px)]' : 'translate-x-0'
                }`}
                style={{
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.8), 0 0 60px rgba(16, 185, 129, 0.5), inset 0 2px 15px rgba(255, 255, 255, 0.3)'
                }}
              />
              
              {/* Sign In Button */}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`relative z-10 flex items-center justify-center gap-2 px-6 py-4 rounded-full text-sm font-bold transition-all duration-500 ${
                  mode === 'signin' 
                    ? 'text-emerald-400 scale-105' 
                    : 'text-gray-300 hover:text-white scale-100'
                }`}
              >
                <svg 
                  className={`w-6 h-6 transition-all duration-500 ${
                    mode === 'signin' 
                      ? 'rotate-0 scale-110 drop-shadow-[0_0_15px_rgba(52,211,153,1)]' 
                      : 'rotate-180 scale-90'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                  />
                </svg>
                <span className={`transition-all duration-300 ${
                  mode === 'signin' ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                }`}>
                  Sign In
                </span>
              </button>
              
              {/* Sign Up Button */}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`relative z-10 flex items-center justify-center gap-2 px-6 py-4 rounded-full text-sm font-bold transition-all duration-500 ${
                  mode === 'signup' 
                    ? 'text-emerald-400 scale-105' 
                    : 'text-gray-300 hover:text-white scale-100'
                }`}
              >
                <svg 
                  className={`w-6 h-6 transition-all duration-500 ${
                    mode === 'signup' 
                      ? 'rotate-0 scale-110 drop-shadow-[0_0_15px_rgba(52,211,153,1)]' 
                      : '-rotate-180 scale-90'
                  }`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                  />
                </svg>
                <span className={`transition-all duration-300 ${
                  mode === 'signup' ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                }`}>
                  Sign Up
                </span>
              </button>
            </div>
          </div>

          {/* Forms Container with slide animation */}
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: mode === 'signin' ? 'translateX(0)' : 'translateX(-100%)' }}
            >
              {/* Sign In Form */}
              <div className="w-full flex-shrink-0">
                <form onSubmit={handleSignIn} className="space-y-5">
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {errors && Array.isArray(errors) && (
                <ul className="text-red-300 text-sm list-disc pl-5 space-y-1">
                  {errors.map((e, i) => <li key={i}>{e.msg}</li>)}
                </ul>
              )}
              
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input 
                        type="email" 
                        autoComplete="email" 
                        value={signInEmail} 
                        onChange={e => handleSignInEmailChange(e.target.value)}
                        onBlur={() => handleBlur('signInEmail')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.signInEmail && validationErrors.signInEmail 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="you@example.com"
                        required 
                      />
                    </div>
                    {touched.signInEmail && validationErrors.signInEmail && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.signInEmail}
                      </p>
                    )}
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input 
                        type="password" 
                        autoComplete="current-password" 
                        value={signInPassword} 
                        onChange={e => handleSignInPasswordChange(e.target.value)}
                        onBlur={() => handleBlur('signInPassword')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.signInPassword && validationErrors.signInPassword 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="••••••••"
                        required 
                      />
                    </div>
                    {touched.signInPassword && validationErrors.signInPassword && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.signInPassword}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    disabled={loading} 
                    className="group relative w-full px-6 py-4 rounded-xl bg-gradient-to-r from-brand via-brand-dark to-brand bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold shadow-lg shadow-brand/50 hover:shadow-xl hover:shadow-brand/60 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
            </form>
          </div>

              {/* Sign Up Form */}
              <div className="w-full flex-shrink-0">
                <form onSubmit={handleSignUp} className="space-y-5">
              {error && <div className="text-red-400 text-sm">{error}</div>}
              {errors && Array.isArray(errors) && (
                <ul className="text-red-300 text-sm list-disc pl-5 space-y-1">
                  {errors.map((e, i) => <li key={i}>{e.msg}</li>)}
                </ul>
              )}
              
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input 
                        value={signUpForm.name} 
                        onChange={e => setSignUpField('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.name && validationErrors.name 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="John Doe"
                        required 
                      />
                    </div>
                    {touched.name && validationErrors.name && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.name}
                      </p>
                    )}
                  </div>
              
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input 
                        type="email" 
                        autoComplete="email" 
                        value={signUpForm.email} 
                        onChange={e => setSignUpField('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.email && validationErrors.email 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="you@example.com"
                        required 
                      />
                    </div>
                    {touched.email && validationErrors.email && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input 
                        type="tel"
                        value={signUpForm.phone} 
                        onChange={e => setSignUpField('phone', e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.phone && validationErrors.phone 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="+91 98765 43210" 
                        required 
                      />
                    </div>
                    {touched.phone && validationErrors.phone && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input 
                        type="password" 
                        autoComplete="new-password" 
                        value={signUpForm.password} 
                        onChange={e => setSignUpField('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.password && validationErrors.password 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    {touched.password && validationErrors.password && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.password}
                      </p>
                    )}
                    <p className="text-xs text-white/40 mt-2">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-medium mb-2 text-white/80 group-focus-within:text-white transition-colors">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-white/40 group-focus-within:text-brand transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <input 
                        type="password" 
                        autoComplete="new-password" 
                        value={confirmPassword} 
                        onChange={e => handleConfirmPasswordChange(e.target.value)}
                        onBlur={() => handleBlur('confirmPassword')}
                        className={`w-full bg-black/30 backdrop-blur-sm border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/40 transition-all duration-300 focus:outline-none focus:scale-[1.02] ${
                          touched.confirmPassword && validationErrors.confirmPassword 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                            : 'border-white/10 focus:border-brand focus:ring-2 focus:ring-brand/20'
                        }`}
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    {touched.confirmPassword && validationErrors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-2 flex items-center animate-shake">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    disabled={loading} 
                    className="group relative w-full px-6 py-4 rounded-xl bg-gradient-to-r from-brand via-brand-dark to-brand bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-semibold shadow-lg shadow-brand/50 hover:shadow-xl hover:shadow-brand/60 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Note */}
        <p className="text-center text-white/40 text-sm mt-6">
          By continuing, you agree to CineGo's Terms of Service and Privacy Policy
        </p>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .bg-size-200 {
          background-size: 200% 100%;
        }
        
        .bg-pos-0 {
          background-position: 0% 0%;
        }
        
        .bg-pos-100 {
          background-position: 100% 0%;
        }
      `}</style>
    </div>
  );
}
