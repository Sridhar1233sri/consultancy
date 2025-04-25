// src/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
const Home = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    hospital: '',
    speciality: '',
    availability: {
      days: '',
      time: '',
      sunday: '',
      mondayThursday: '',
      tuesday: ''
    },
    profilePhoto: null
  });
  const [availabilityType, setAvailabilityType] = useState('regular');
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle regular input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  // Handle availability input changes
  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [name]: value
      }
    });
  };

  // Handle file upload for profile photo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      // Store the data URL directly
      setFormData({ ...formData, profilePhoto: reader.result });
    }
  };

  // Handle availability type selection
  const handleAvailabilityTypeChange = (e) => {
    setAvailabilityType(e.target.value);
  };

  // Handle form submission
  // Update the handleSubmit function in Home.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  // Basic validation
  if (!formData.name || !formData.hospital || !formData.speciality) {
    setError('Please fill in all required fields.');
    return;
  }
  // Validate profile photo
  if (!previewImage) {
    setError('Please upload a profile photo.');
    return;
  }

  try {
    const doctorData = {
      name: formData.name,
      hospital: formData.hospital,
      speciality: formData.speciality,
      availability: formData.availability,
      profilePhoto: previewImage
    };

    const response = await fetch('http://localhost:5000/doctors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doctorData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add doctor');
    }

    // Show success message
    setSuccess('Doctor added successfully!');
    
    // Reset form
    setFormData({
      name: '',
      hospital: '',
      speciality: '',
      availability: {
        days: '',
        time: '',
        sunday: '',
        mondayThursday: '',
        tuesday: ''
      },
      profilePhoto: null
    });
    setPreviewImage(null);
    
    // Navigate to doctors list after a short delay
    setTimeout(() => {
      navigate('/admindoctorlist');
    }, 1500);
  } catch (error) {
    setError(error.message || 'Failed to save doctor information. Please try again.');
    console.error('Error saving doctor:', error);
  }
};

  return (<>
    <AdminNavbar />
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Doctor</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        {/* Basic Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Doctor Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Dr. Full Name"
                required
              />
            </div>
            {/* Hospital */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="hospital">
                Hospital <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="hospital"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Hospital Name"
                required
              />
            </div>
            {/* Speciality */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="speciality">
                Speciality <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="speciality"
                name="speciality"
                value={formData.speciality}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Medical Speciality"
                required
              />
            </div>
            {/* Profile Photo */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="profilePhoto">
                Profile Photo <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                id="profilePhoto"
                name="profilePhoto"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                accept="image/*"
                required
              />
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Profile preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Availability Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Availability</h2>
          {/* Availability Type Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Availability Type:
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="availabilityType"
                  value="regular"
                  checked={availabilityType === 'regular'}
                  onChange={handleAvailabilityTypeChange}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">Regular Schedule</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="availabilityType"
                  value="custom"
                  checked={availabilityType === 'custom'}
                  onChange={handleAvailabilityTypeChange}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2">Custom Schedule</span>
              </label>
            </div>
          </div>
          {availabilityType === 'regular' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Days */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="days">
                  Working Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="days"
                  name="days"
                  value={formData.availability.days}
                  onChange={handleAvailabilityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Monday to Saturday"
                  required={availabilityType === 'regular'}
                />
              </div>
              {/* Time */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="time">
                  Working Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="time"
                  name="time"
                  value={formData.availability.time}
                  onChange={handleAvailabilityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 9:00 AM – 5:00 PM"
                  required={availabilityType === 'regular'}
                />
              </div>
              {/* Sunday */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="sunday">
                  Sunday Availability
                </label>
                <input
                  type="text"
                  id="sunday"
                  name="sunday"
                  value={formData.availability.sunday}
                  onChange={handleAvailabilityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Holiday or specific hours"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monday and Thursday */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="mondayThursday">
                  Monday & Thursday <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="mondayThursday"
                  name="mondayThursday"
                  value={formData.availability.mondayThursday}
                  onChange={handleAvailabilityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 8:00 AM – 5:00 PM"
                  required={availabilityType === 'custom'}
                />
              </div>
              {/* Tuesday */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="tuesday">
                  Tuesday <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tuesday"
                  name="tuesday"
                  value={formData.availability.tuesday}
                  onChange={handleAvailabilityChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 8:00 AM – 5:00 PM"
                  required={availabilityType === 'custom'}
                />
              </div>
            </div>
          )}
        </div>
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Doctor
          </button>
        </div>
      </form>
    </div></>
  );
};

export default Home;