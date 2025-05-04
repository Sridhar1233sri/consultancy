// src/UserHome.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from './UserContext';
import UserNavbar from './usernavbar.jsx';

const UserHome = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch(`http://localhost:5000/appointments?email=${user.email}`);
        if (response.ok) {
          const data = await response.json();
          setAppointments(data.appointments);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleDeleteAppointment = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/appointments/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAppointments(appointments.filter(appt => appt._id !== id));
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <UserNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Appointments</h1>
        
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{appointment.doctorName}</h3>
                    <p className="text-gray-600">{appointment.doctorSpeciality}</p>
                    <p className="text-gray-600">{appointment.doctorHospital}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteAppointment(appointment._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-700"><span className="font-medium">Date:</span> {new Date(appointment.date).toLocaleDateString()}</p>
                  <p className="text-gray-700"><span className="font-medium">Time:</span> {appointment.time}</p>
                  <p className="text-gray-700"><span className="font-medium">Issue:</span> {appointment.issue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserHome;