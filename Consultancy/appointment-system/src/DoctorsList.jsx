import React, { useState, useEffect } from 'react';
import AdminNavbar from './AdminNavbar';
import Chatbot from './Chatbot';

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      const response = await fetch('http://localhost:5000/doctors');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch doctors');
      }
      
      setDoctors(data.doctors);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/doctors?id=${doctorId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete doctor');
      }

      // Refresh the doctors list
      await fetchDoctors();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="p-4 md:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctors List</h1>
          <p>Loading doctors...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminNavbar />
        <div className="p-4 md:p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctors List</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctors List</h1>

        {doctors.length === 0 ? (
          <p>No doctors found.</p>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center gap-4 relative"
              >
                {/* Profile Photo */}
                <div className="flex-shrink-0">
                  {doctor.profilePhoto ? (
                    <img
                      src={doctor.profilePhoto}
                      alt={`${doctor.name}'s profile`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-indigo-500">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>

                {/* Doctor Details */}
                <div className="flex-grow">
                  <div className="mb-2">
                    <span className="font-bold text-lg">{doctor.name}</span>
                    <span className="text-sm text-gray-500 ml-2">Doctor ID: {doctor.id}</span>
                  </div>

                  {/* Grid Layout for Hospital, Speciality, and Availability */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Hospital */}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold mb-1">Hospital</span>
                      <span className="text-gray-600">{doctor.hospital}</span>
                    </div>

                    {/* Speciality */}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold mb-1">Speciality</span>
                      <span className="text-gray-600">{doctor.speciality}</span>
                    </div>

                    {/* Availability */}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold mb-1">Availability</span>
                      <div className="text-gray-600 space-y-1">
                        {doctor.availability?.days && (
                          <div>{doctor.availability.days}: {doctor.availability.time}</div>
                        )}
                        {doctor.availability?.sunday && (
                          <div>Sunday: {doctor.availability.sunday}</div>
                        )}
                        {doctor.availability?.mondayThursday && (
                          <div>Monday & Thursday: {doctor.availability.mondayThursday}</div>
                        )}
                        {doctor.availability?.tuesday && (
                          <div>Tuesday: {doctor.availability.tuesday}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                  title="Delete doctor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Chatbot />
    </>
  );
};

export default DoctorsList;