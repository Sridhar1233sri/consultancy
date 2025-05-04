// src/UserPanel.jsx
import React from 'react';
import { useUser } from './UserContext';
import { Link } from 'react-router-dom';

const UserPanel = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">User Dashboard</h1>
          
          {user ? (
            <div className="space-y-6">
              <div className="bg-indigo-50 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-indigo-800 mb-2">Welcome, {user.username || user.email}!</h2>
                <p className="text-gray-600">What would you like to do today?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/book-appointment"
                  className="bg-white border border-indigo-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Book Appointment</h3>
                      <p className="text-sm text-gray-500">Schedule with a doctor</p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/user-appointments"
                  className="bg-white border border-indigo-200 rounded-lg p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">My Appointments</h3>
                      <p className="text-sm text-gray-500">View your scheduled visits</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Please log in to access the dashboard</p>
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPanel;