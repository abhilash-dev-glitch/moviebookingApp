import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function AuthRedirect({ to = '/' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'theaterManager') {
        navigate('/manager');
      } else {
        // For regular users, redirect to the specified path or home
        navigate(to);
      }
    }
  }, [user, navigate, to]);

  return null; // This component doesn't render anything
}
