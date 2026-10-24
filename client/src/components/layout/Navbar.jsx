import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    if (typeof logout === 'function') {
      logout();
    } else if (typeof clearAuth === 'function') {
      clearAuth();
    }
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 h-16 fixed top-0 w-full z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="mr-4 lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none">
          <Menu className="w-6 h-6" />
        </button>
        <Link to={user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <span className="text-xl font-bold text-slate-800">MediBridge</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-lg transition focus:outline-none"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {user.firstName?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user.firstName} {user.lastName}</span>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-slate-100 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
