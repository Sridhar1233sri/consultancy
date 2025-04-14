// src/UserOptions.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const UserOptions = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 overflow-hidden relative">
      {/* Simple background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white opacity-10 rounded-full"></div>
        <div className="absolute top-3/4 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full"></div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-2xl text-center w-full max-w-md p-8 relative z-10 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <div className="bg-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto -mt-16 mb-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome, User!</h1>
        <p className="text-gray-600 mb-6">Are you a new user or an existing user?</p>

        <div className="space-y-4">
          <Link
            to="/register"
            className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:shadow-md hover:brightness-110"
          >
            New User? Register
          </Link>
          <Link
            to="/login"
            className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:shadow-md hover:brightness-110"
          >
            Existing User? Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserOptions;