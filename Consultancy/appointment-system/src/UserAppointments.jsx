// src/UserAppointments.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserAppointments = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (user) {
        try {
          const response = await axios.get(`http://localhost:5000/appointments?email=${user.email}`);
          setAppointments(response.data.appointments);
        } catch (error) {
          console.error('Error fetching appointments:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAppointments();
  }, [user]);

  const handleCancel = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/appointments/${id}`);
      setAppointments(appointments.filter(appt => appt._id !== id));
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
            <Link
              to="/book-appointment"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Book New Appointment
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
              <Link
                to="/book-appointment"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Book an Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Dr. {appointment.doctorName}</h3>
                      <p className="text-gray-600">{appointment.doctorSpeciality}</p>
                      <p className="text-gray-600">{appointment.doctorHospital}</p>
                    </div>
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-gray-700">
                      <span className="font-medium">Date:</span> {new Date(appointment.date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Time:</span> {appointment.time}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Reason:</span> {appointment.issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAppointments;