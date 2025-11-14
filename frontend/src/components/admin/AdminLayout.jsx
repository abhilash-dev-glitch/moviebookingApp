import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { FiGrid, FiFilm, FiHome, FiCalendar, FiUsers, FiUserCheck, FiLogOut, FiXCircle } from 'react-icons/fi';

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <FiGrid /> },
    { name: 'Movies', path: '/admin/movies', icon: <FiFilm /> },
    { name: 'Theaters', path: '/admin/theaters', icon: <FiHome /> },
    { name: 'Shows', path: '/admin/shows', icon: <FiCalendar /> },
    { name: 'Bookings', path: '/admin/bookings', icon: <FiCalendar /> },
    { name: 'Cancellations', path: '/admin/cancellations', icon: <FiXCircle /> },
    { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Managers', path: '/admin/managers', icon: <FiUserCheck /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 pt-16">
      {/* Sidebar - Fixed */}
      <div className="w-64 bg-gray-900 text-white flex flex-col fixed top-16 h-[calc(100vh-4rem)] z-40">
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} to={item.path} icon={item.icon}>
              {item.name}
            </NavItem>
          ))}
        </nav>
        
        {/* User Info Section */}
        <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center mb-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold mr-3">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-red-600/50"
          >
            <FiLogOut className="mr-2 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area - With left margin for fixed sidebar */}
      <div className="flex-1 ml-64">
        <main className="p-6 bg-gray-100 min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Reusable NavItem component for the sidebar
const NavItem = ({ to, icon, children }) => {
  return (
    <NavLink
      to={to}
      end={to === '/admin'} // Ensure only Dashboard is active on index
      className={({ isActive }) =>
        `flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand text-white shadow-lg'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      <span className="mr-3 h-5 w-5">{icon}</span>
      {children}
    </NavLink>
  );
};

export default AdminLayout;