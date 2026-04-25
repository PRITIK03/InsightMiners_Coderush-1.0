import React, { useState } from 'react';
import './ComplaintForm.css';

const ComplaintForm = ({ onSubmit, currentPollutionLevel, location }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    complaintType: 'air_quality',
    description: '',
    isAnonymous: false,
    image: null,
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : 
              type === 'file' ? files[0] : 
              value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add location and pollution level data
      const complaintData = {
        ...formData,
        pollutionLevel: currentPollutionLevel,
        location: location,
        timestamp: new Date().toISOString(),
      };
      
      await onSubmit(complaintData);
      setSubmitted(true);
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        complaintType: 'air_quality',
        description: '',
        isAnonymous: false,
        image: null,
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="complaint-success">
        <h3>Thank you for your complaint submission!</h3>
        <p>Your complaint has been registered. You will receive updates on the status.</p>
        <button onClick={() => setSubmitted(false)} className="new-complaint-btn">
          Submit Another Complaint
        </button>
      </div>
    );
  }

  return (
    <form className="complaint-form" onSubmit={handleSubmit}>
      <h3>Submit Pollution Complaint</h3>
      
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="isAnonymous"
            checked={formData.isAnonymous}
            onChange={handleChange}
          />
          Submit Anonymously
        </label>
      </div>

      {!formData.isAnonymous && (
        <>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required={!formData.isAnonymous}
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required={!formData.isAnonymous}
            />
          </div>

          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      <div className="form-group">
        <label>Complaint Type:</label>
        <select
          name="complaintType"
          value={formData.complaintType}
          onChange={handleChange}
          required
        >
          <option value="air_quality">Air Quality</option>
          <option value="industrial_emission">Industrial Emission</option>
          <option value="vehicle_pollution">Vehicle Pollution</option>
          <option value="construction_dust">Construction Dust</option>
          <option value="burning_waste">Burning Waste</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Description:</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          placeholder="Please describe the pollution issue in detail..."
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Upload Image (optional):</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
        />
      </div>

      <div className="current-readings">
        <p>Current Pollution Level: {currentPollutionLevel}</p>
        <p>Location: {location}</p>
      </div>

      <button type="submit" className="submit-btn">Submit Complaint</button>
    </form>
  );
};

export default ComplaintForm;
