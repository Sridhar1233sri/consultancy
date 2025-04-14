// src/App.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext';
import Lottie from "lottie-react";
import animation from './assets/home_animation.json';

const App = () => {
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen flex bg-gradient-to-r from-indigo-600 to-purple-600">
      {/* Left Half - Animation */}
      <div className="w-1/2 flex items-center justify-center">
        <Lottie animationData={animation} loop={true} autoplay={true} className="w-3/4 h-3/4" />
      </div>

      {/* Right Half - Login */}
      <div className="w-1/2 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-md space-y-6 mx-4">
          <h1 className="text-3xl font-bold text-gray-800">Appointment System</h1>

          {!user ? (
            <>
              <p className="text-gray-600">Please select your role to continue</p>
              <div className="space-y-4">
                <Link
                  to="/admin"
                  className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
                >
                  Login as Admin
                </Link>
                <Link
                  to="/user-options"
                  className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
                >
                  Login as User
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600">Welcome, {user.email}!</p>
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition duration-300"
              >
                Logout
              </button>
            </>
          )}

          <p className="text-sm text-gray-500">
            &copy; 2023 Appointment System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
