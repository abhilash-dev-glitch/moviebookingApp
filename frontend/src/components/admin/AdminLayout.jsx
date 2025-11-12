import { Link, Outlet, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Movies', path: '/admin/movies' },
    { name: 'Theaters', path: '/admin/theaters' },
    { name: 'Shows', path: '/admin/shows' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Managers', path: '/admin/managers' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Panel</h1>
              </div>
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${location.pathname === item.path
                      ? 'border-indigo-500 text-white'
                      : 'border-transparent text-gray-300 hover:border-gray-300 hover:text-white'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button className="bg-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
