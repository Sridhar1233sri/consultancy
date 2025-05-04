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
import { UserProvider } from './UserContext';
import DoctorsList from './DoctorsList';
import Appointments from './Appointments';
import Home from './Home';
import BookAppointment from './BookAppointment';
import UserAppointments from './UserAppointments';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admindoctorlist" element={<DoctorsList />} />
        <Route path="/adminappointments" element={<Appointments />} />
        <Route path="/user-options" element={<UserOptions />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user-panel" element={<UserPanel />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/user-appointments" element={<UserAppointments />} />
      </Routes>
    </UserProvider>
  </BrowserRouter>
);