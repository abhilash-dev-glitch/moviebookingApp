import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './index.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Toast from './components/Toast'
import Toaster from './components/Toaster'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetail from './pages/MovieDetail'
import Showtimes from './pages/Showtimes'
import SeatSelection from './pages/SeatSelection'
import Checkout from './pages/Checkout'
import Auth from './pages/Auth'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import { useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { store } from './store/store';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import BookingConfirmation from './pages/BookingConfirmation';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
import { checkAuth } from './store/authSlice';

// Import Admin components
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminMovies from './pages/admin/Movies'
import AdminTheaters from './pages/admin/Theaters'
import AdminShows from './pages/admin/Shows'
import AdminUsers from './pages/admin/Users'
import AdminManagers from './pages/admin/Managers'
import AdminBookings from './pages/admin/Bookings'
import AdminCancellations from './pages/admin/Cancellations'

// Import Manager components
import ManagerDashboard from './pages/manager/ManagerDashboard'
import ManageTheaters from './pages/manager/ManageTheaters' 
import ManagerMovies from './pages/manager/Movies'
import ManagerScreens from './pages/manager/Screens'
import ManageShows from './pages/manager/ManageShows'
import ManageBookings from './pages/manager/ManageBookings'
import ManageCancellations from './pages/manager/ManageCancellations'     

// Memoized selectors for auth state
const selectAuthState = (state) => state.auth;
const selectUser = createSelector(
  [selectAuthState],
  (auth) => auth.user
);
const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth.loading
);

function AppContent() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const [authChecked, setAuthChecked] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Check auth status on initial load
    const verifyAuth = async () => {
      try {
        await dispatch(checkAuth()).unwrap();
      } catch (error) {
        console.log('User not authenticated');
      } finally {
        setAuthChecked(true);
      }
    };
    
    if (!user) {
      verifyAuth();
    } else {
      setAuthChecked(true);
    }
  }, [dispatch, user]);
  
  // Show loading indicator while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }
  
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isManagerRoute = location.pathname.startsWith('/manager');
  const hideFooter = isAdminRoute || isManagerRoute;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Toast />
      <Navbar />
      <main className="flex-1">
        <Routes>
            {/* Root path - Show Home component */}
            <Route path="/" element={
              <Home />
            } />
            
            {/* Role-based redirects */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedRoute>
            } />
            
            {/* Public routes */}
            <Route path="/movies" element={<Movies />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/movies/:id/showtimes" element={<Showtimes />} />
            <Route path="/showtimes/:showtimeId/seats" element={<SeatSelection />} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            
            {/* Auth routes with redirect if already logged in */}
            <Route path="/signin" element={
              <ProtectedRoute requireAuth={false}>
                <Auth />
              </ProtectedRoute>
            } />
            <Route path="/signup" element={
              <ProtectedRoute requireAuth={false}>
                <Auth />
              </ProtectedRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/bookings/:id" element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            } />

            {/* --- ADMIN NESTED ROUTES --- */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="movies" element={<AdminMovies />} />
              <Route path="theaters" element={<AdminTheaters />} />
              <Route path="shows" element={<AdminShows />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="cancellations" element={<AdminCancellations />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="managers" element={<AdminManagers />} />
            </Route>

            {/* --- MANAGER NESTED ROUTES --- */}
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute roles={["theaterManager", "admin"]}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            >
              <Route path="theaters" element={<ManageTheaters />} />
              <Route path="movies" element={<ManagerMovies />} />
              <Route path="screens" element={<ManagerScreens />} />
              <Route path="shows" element={<ManageShows />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="cancellations" element={<ManageCancellations />} />
            </Route>
            
            {/* 404 - Not Found */}
            <Route path="*" element={
              <div className="max-w-7xl mx-auto px-4 py-10">
                <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist or has been moved.</p>
              </div>
            } />
          </Routes>
        </main>
        {!hideFooter && <Footer />}
      </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </Elements>
    </Provider>
  );
}