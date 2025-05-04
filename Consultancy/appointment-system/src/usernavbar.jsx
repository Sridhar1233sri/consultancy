// src/UserNavbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext';

const UserNavbar = () => {
  const { user, logout } = useUser();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link to="/user-home" className="text-xl font-bold text-indigo-600">
            MediCare
          </Link>
          <Link to="/user-home" className="text-gray-700 hover:text-indigo-600">
            Home
          </Link>
          <Link to="/book-appointment" className="text-gray-700 hover:text-indigo-600">
            Book Appointment
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">{user.username}</span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default UserNavbar;