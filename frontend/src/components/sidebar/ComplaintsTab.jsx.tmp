import React, { useState, useEffect, useRef } from 'react';
import { 
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend 
} from 'chart.js';
import ComplaintForm from './ComplaintForm';
import './ComplaintsTab.css';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ComplaintsTab = ({ pollutionData, location }) => {
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const complaintsByTypeChartRef = useRef(null);
  const complaintStatusChartRef = useRef(null);
  const complaintChartInstance1 = useRef(null);
  const complaintChartInstance2 = useRef(null);

  useEffect(() => {
    fetchComplaints();
    return () => {
      if (complaintChartInstance1.current) {
        complaintChartInstance1.current.destroy();
      }
      if (complaintChartInstance2.current) {
        complaintChartInstance2.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (complaints.length > 0) {
      initializeCharts();
    }
  }, [complaints]);

  const fetchComplaints = async () => {
    try {
      const response = await fetch('/api/complaints');
      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const initializeCharts = () => {
    const typeCount = complaints.reduce((acc, complaint) => {
      acc[complaint.complaintType] = (acc[complaint.complaintType] || 0) + 1;
      return acc;
    }, {});

    const statusCount = complaints.reduce((acc, complaint) => {
      acc[complaint.status || 'Pending'] = (acc[complaint.status || 'Pending'] || 0) + 1;
      return acc;
    }, {});

    if (complaintChartInstance1.current) {
      complaintChartInstance1.current.destroy();
    }

    complaintChartInstance1.current = new ChartJS(complaintsByTypeChartRef.current, {
      type: 'doughnut',
      data: {
        labels: Object.keys(typeCount),
        datasets: [{
          data: Object.values(typeCount),
          backgroundColor: [
            '#4299E1', '#48BB78', '#ED8936', '#ECC94B', '#9F7AEA', '#ED64A6'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Complaints by Type'
          }
        }
      }
    });

    if (complaintChartInstance2.current) {
      complaintChartInstance2.current.destroy();
    }

    complaintChartInstance2.current = new ChartJS(complaintStatusChartRef.current, {
      type: 'bar',
      data: {
        labels: Object.keys(statusCount),
        datasets: [{
          label: 'Number of Complaints',
          data: Object.values(statusCount),
          backgroundColor: ['#4299E1', '#48BB78', '#ECC94B']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Complaint Resolution Status'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  };

  const isPollutionHigh = () => {
    if (!pollutionData?.pollutionLevels?.length) return false;
    const latest = pollutionData.pollutionLevels[pollutionData.pollutionLevels.length - 1];
    return latest.no2_level > 100 || latest.pm25_level > 50;
  };

  const handleComplaintSubmit = async (complaintData) => {
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...complaintData,
          location: location,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to submit complaint');

      const result = await response.json();
      setComplaints(prev => [...prev, result.complaint]);
      setShowForm(false);
      initializeCharts();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      throw error;
    }
  };

  return (
    <div className="complaints-tab">
      <div className="complaints-header">
        <h2>Pollution Complaints Dashboard</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="new-complaint-btn"
        >
          Submit New Complaint
        </button>
      </div>

      {isPollutionHigh() && (
        <div className="pollution-alert">
          <h3>⚠️ High Pollution Alert</h3>
          <p>Current pollution levels are above safe limits in your area.</p>
        </div>
      )}

      {showForm ? (
        <ComplaintForm 
          onSubmit={handleComplaintSubmit}
          currentPollutionLevel={
            pollutionData?.pollutionLevels?.[pollutionData.pollutionLevels.length - 1]
          }
          location={location}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="complaints-dashboard">
          <div className="charts-container">
            <div className="chart-wrapper">
              <canvas ref={complaintsByTypeChartRef}></canvas>
            </div>
            <div className="chart-wrapper">
              <canvas ref={complaintStatusChartRef}></canvas>
            </div>
          </div>

          <div className="complaints-list">
            <h3>Recent Complaints</h3>
            {complaints.length > 0 ? (
              <div className="complaints-grid">
                {complaints.map((complaint, index) => (
                  <div key={index} className="complaint-card">
                    <div className="complaint-header">
                      <span className={`complaint-type ${complaint.complaintType}`}>
                        {complaint.complaintType.replace('_', ' ')}
                      </span>
                      <span className={`complaint-status status-${complaint.status || 'pending'}`}>
                        {complaint.status || 'Pending'}
                      </span>
                    </div>
                    <p className="complaint-description">{complaint.description}</p>
                    <div className="complaint-footer">
                      <span className="complaint-date">
                        {new Date(complaint.timestamp).toLocaleDateString()}
                      </span>
                      {complaint.resolvedAt && (
                        <span className="resolution-date">
                          Resolved: {new Date(complaint.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-complaints">
                <p>No complaints filed yet.</p>
                <p>Help improve air quality by reporting pollution incidents.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintsTab;
