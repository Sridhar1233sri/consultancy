// src/UserPanel.jsx
import React from 'react';
import { useUser } from './UserContext'; // Import the useUser hook

const UserPanel = () => {
  const { user } = useUser(); // Get user details from context

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800">User Panel</h1>
        {user ? (
          <p className="text-gray-600 mt-4">Welcome, {user.email}!</p>
        ) : (
          <p className="text-gray-600 mt-4">Please log in to view this content.</p>
        )}
      </div>
    </div>
  );
};

export default UserPanel;