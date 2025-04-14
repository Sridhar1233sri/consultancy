// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPanel from './AdminPanel';
import UserPanel from './UserPanel';
import Register from './Register';
import UserOptions from './UserOptions';
import Login from './Login';
import { UserProvider } from './UserContext'; // Import the UserProvider
import DoctorsList from './DoctorsList';
import Appointments from './Appointments';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider> {/* Wrap the app with UserProvider */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admindoctorlist" element={<DoctorsList />} />
        <Route path="/adminappointments" element={<Appointments />} />
        <Route path="/user-options" element={<UserOptions />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </UserProvider>
  </BrowserRouter>
);