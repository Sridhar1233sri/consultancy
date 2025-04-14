// src/UserContent.jsx
import React, { useContext } from 'react';
import UserContext from './UserContext';

const UserContent = () => {
  const { user, logout, error } = useContext(UserContext);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-lg">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.username}</h1>
            <p className="text-gray-600 mt-4">Your email: {user.email}</p>
            <p className="text-gray-600 mt-4">Your role: {user.role}</p>
            <div className="mt-8">
              <button
                className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-300"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserContent;
