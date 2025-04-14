// src/DoctorsList.jsx
import React from 'react';
import AdminNavbar from './AdminNavbar';
import Chatbot from './Chatbot'; // Import the Chatbot component
import doc1 from './assets/doc1.avif';
import doc2 from './assets/doc2.jpg';
import doc3 from './assets/doc3.webp';
import doc4 from './assets/doc4.webp';

const DoctorsList = () => {
  // Updated data for 4 doctors with detailed availability
  const doctors = [
    {
      id: 1,
      name: 'Dr. Ram Abhinav',
      hospital: 'KMCH',
      speciality: 'Oncology',
      availability: {
        days: 'Monday to Saturday',
        time: '9:00 AM – 5:00 PM',
        sunday: 'Holiday',
      },
      profilePhoto: doc1,
    },
    {
      id: 2,
      name: 'Dr. V. Arul Selvan',
      hospital: 'Royal Care',
      speciality: 'Neurologist',
      availability: {
        days: 'Monday to Saturday',
        time: '2:00 PM – 5:00 PM',
        sunday: 'Not available',
      },
      profilePhoto: doc2,
    },
    {
      id: 3,
      name: 'Dr. Varunn M D',
      hospital: 'PSG Hospitals',
      speciality: 'Pulmonologist',
      availability: {
        days: 'Monday, Wednesday, Saturday',
        time: '6:00 PM – 8:00 PM',
      },
      profilePhoto: doc3,
    },
    {
      id: 4,
      name: 'Dr. K. A. Sambasivam',
      hospital: 'G. Kuppuswamy Naidu Memorial Hospital',
      speciality: 'Cardiology',
      availability: {
        mondayThursday: '8:00 AM – 5:00 PM (Review OP)',
        tuesday: '8:00 AM – 5:00 PM',
      },
      profilePhoto: doc4,
    },
  ];

  return (
    <>
      {/* Admin Navbar */}
      <AdminNavbar />

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctors List</h1>

        {/* Horizontal Bars for Doctors */}
        <div className="space-y-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Profile Photo */}
              <div className="flex-shrink-0">
                <img
                  src={doctor.profilePhoto}
                  alt={`${doctor.name}'s profile`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                />
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
                      {doctor.availability.days && (
                        <div>{doctor.availability.days}: {doctor.availability.time}</div>
                      )}
                      {doctor.availability.sunday && (
                        <div>Sunday: {doctor.availability.sunday}</div>
                      )}
                      {doctor.availability.mondayThursday && (
                        <div>Monday & Thursday: {doctor.availability.mondayThursday}</div>
                      )}
                      {doctor.availability.tuesday && (
                        <div>Tuesday: {doctor.availability.tuesday}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Chatbot Component */}
      <Chatbot />
    </>
  );
};

export default DoctorsList;