import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/authSlice';
import { toast } from '../lib/toast';

export default function SignUp(){
  const navigate = useNavigate()
  
  const dispatch = useDispatch();
  const { user, loading, error, errors } = useSelector((state) => ({
    user: state.auth.user,
    loading: state.auth.loading,
    error: state.auth.error,
    errors: state.auth.errors
  }));

  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role:'endUser' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState({})
  const [touched, setTouched] = useState({})

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

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirmPassword = (confirmPwd) => {
    if (!confirmPwd) return 'Please confirm your password';
    if (confirmPwd !== form.password) return 'Passwords do not match';
    return '';
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name': return validateName(value);
      case 'email': return validateEmail(value);
      case 'phone': return validatePhone(value);
      case 'password': return validatePassword(value);
      case 'confirmPassword': return validateConfirmPassword(value);
      default: return '';
    }
  };

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (touched[k]) {
      const error = validateField(k, v);
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
    if (field === 'confirmPassword') {
      const error = validateConfirmPassword(confirmPassword);
      setValidationErrors(prev => ({ ...prev, confirmPassword: error }));
    } else {
      const error = validateField(field, form[field]);
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(confirmPassword)
    };
    
    setValidationErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    
    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      toast.error('Validation failed', 'Please fix the errors and try again.');
      return;
    }
    
    const resultAction = await dispatch(register(form));
    
    if (register.fulfilled.match(resultAction)) {
      const user = resultAction.payload;
      toast.success('Account created', `Welcome ${user.name}`);
      navigate('/');
    } else {
      toast.error('Registration failed', error || 'Please fix the errors and try again.');
    }
  }
  
  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

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
          <input 
            value={form.name} 
            onChange={e=>set('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.name && validationErrors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            required 
          />
          {touched.name && validationErrors.name && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input 
            type="email" 
            autoComplete="email" 
            value={form.email} 
            onChange={e=>set('email', e.target.value)}
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
          <label className="block text-sm mb-1">Phone</label>
          <input 
            type="tel"
            value={form.phone} 
            onChange={e=>set('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.phone && validationErrors.phone 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            placeholder="e.g. +919876543210" 
            required 
          />
          {touched.phone && validationErrors.phone && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input 
            type="password" 
            autoComplete="new-password" 
            value={form.password} 
            onChange={e=>set('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.password && validationErrors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number" 
            required 
          />
          {touched.password && validationErrors.password && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Confirm Password</label>
          <input 
            type="password" 
            autoComplete="new-password" 
            value={confirmPassword} 
            onChange={e=>handleConfirmPasswordChange(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 ${
              touched.confirmPassword && validationErrors.confirmPassword 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/10 focus:ring-brand'
            }`}
            placeholder="Re-enter your password" 
            required 
          />
          {touched.confirmPassword && validationErrors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
          )}
        </div>
        <button disabled={loading} className="w-full px-4 py-2 rounded-md bg-brand hover:bg-brand-dark transition text-white">{loading? 'Creating...' : 'Create Account'}</button>
        <div className="text-sm text-white/70">Already have an account? <Link to="/signin" className="text-brand">Sign in</Link></div>
      </form>
    </div>
  )
}