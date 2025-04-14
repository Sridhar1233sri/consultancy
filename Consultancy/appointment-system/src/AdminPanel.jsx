// src/AdminPanel.jsx
import React, { useState } from 'react';
import AdminNavbar from './AdminNavbar'; // Import the AdminNavbar component
import Home from './Home'; // Import the Home component
import DoctorsList from './DoctorsList'; // Import the DoctorsList component
import Appointments from './Appointments'; // Import the Appointments component
import { useLocation } from 'react-router-dom'; // Import useLocation for route handling

const AdminPanel = () => {
  // State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Predefined admin credentials (you can replace this with an API call later)
  const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin', // Role for admin
  };

  // Validation function
  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate the form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Check if credentials match the predefined admin credentials
    if (
      email === adminCredentials.email &&
      password === adminCredentials.password &&
      adminCredentials.role === 'admin'
    ) {
      setIsAdminLoggedIn(true);
      setErrors({}); // Clear any previous errors
    } else {
      setErrors({ general: 'Invalid email or password' });
    }
  };

  // Get the current route
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      {isAdminLoggedIn ? (
        // Admin Dashboard After Login
        <div className="flex-1 flex flex-col">
          {/* Admin Navbar */}
          <AdminNavbar />

          {/* Main Content */}
          <div className="flex-1 p-8 bg-white rounded-lg shadow-lg">
            {currentPath === '/admin' && <Home />}
            {currentPath === '/admin/doctors' && <DoctorsList />}
            {currentPath === '/admin/appointments' && <Appointments />}
          </div>
        </div>
      ) : (
        // Login Form
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center w-full max-w-md">
            <form onSubmit={handleSubmit}>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h1>

              {/* Email Field */}
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-4 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500 ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* General Error Message */}
              {errors.general && (
                <p className="text-red-500 text-sm mb-4">{errors.general}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;