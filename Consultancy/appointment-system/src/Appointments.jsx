// src/Appointments.jsx
import React from 'react';
import AdminNavbar from './AdminNavbar';

const Appointments = () => {
  return (

    <>
    <AdminNavbar/>
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
      <p className="text-gray-600 mt-4">View and manage appointments here.</p>
    </div>
    </>
  );
};

export default Appointments;