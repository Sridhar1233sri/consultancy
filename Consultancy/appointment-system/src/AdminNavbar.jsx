import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Here you can add any logout logic (clearing tokens, etc.) before redirecting
    navigate('/');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <nav className="bg-indigo-600 text-white py-4 px-6 flex justify-between items-center">
      {/* Left Side - Navigation Links */}
      <div className="flex space-x-6">
        <Link to="/home" className="hover:text-indigo-200 transition duration-300">
          Home
        </Link>
        <Link to="/admindoctorlist" className="hover:text-indigo-200 transition duration-300">
          Doctors List
        </Link>
        <Link to="/adminappointments" className="hover:text-indigo-200 transition duration-300">
          Appointments
        </Link>
      </div>

      {/* Right Side - Profile Section */}
      <div className="flex items-center space-x-4">
        <span className="hidden md:block">Welcome, Admin</span>
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="w-10 h-10 bg-indigo-700 rounded-full flex items-center justify-center hover:bg-indigo-800 transition duration-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </button>
          
          {/* Dropdown Menu - now visible based on state */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50">
              <ul className="py-2">
                <li>
                  <Link
                    to="/admin/profile"
                    className="block px-4 py-2 text-gray-800 hover:bg-indigo-600 hover:text-white transition duration-300"
                  >
                    Profile
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-600 hover:text-white transition duration-300"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;