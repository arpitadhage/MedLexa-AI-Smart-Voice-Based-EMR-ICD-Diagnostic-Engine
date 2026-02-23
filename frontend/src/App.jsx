import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RecordUpload from './pages/RecordUpload';
import Transcript from './pages/Transcript';
import TranscriptResult from './pages/TranscriptResult';
import EMRExtractResult from './pages/EMRExtractResult';
import GenerateEMR from './pages/GenerateEMR';
import EMRForm from './pages/EMRForm';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import DoctorRecords from './pages/DoctorRecords';
import ProgressTracking from './pages/ProgressTracking';
import BookAppointment from './pages/patient/BookAppointment';
import PatientAppointmentDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Any authenticated user */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />

            {/* Doctor only */}
            <Route path="/record-upload"      element={<ProtectedRoute roles={['doctor']}><RecordUpload /></ProtectedRoute>} />
            <Route path="/transcript-result"  element={<ProtectedRoute roles={['doctor']}><TranscriptResult /></ProtectedRoute>} />
            <Route path="/emr-extract-result" element={<ProtectedRoute roles={['doctor']}><EMRExtractResult /></ProtectedRoute>} />
            <Route path="/transcript"         element={<ProtectedRoute roles={['doctor']}><Transcript /></ProtectedRoute>} />
            <Route path="/generate-emr" element={<ProtectedRoute roles={['doctor']}><GenerateEMR /></ProtectedRoute>} />
            <Route path="/emr-form"     element={<ProtectedRoute roles={['doctor']}><EMRForm /></ProtectedRoute>} />
            <Route path="/doctor-records" element={<ProtectedRoute roles={['doctor']}><DoctorRecords /></ProtectedRoute>} />
            <Route path="/progress-tracking" element={<ProtectedRoute roles={['doctor']}><ProgressTracking /></ProtectedRoute>} />

            {/* Patient only */}
            <Route path="/patient-dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/patient/book-appointment" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />
            <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientAppointmentDashboard /></ProtectedRoute>} />

            {/* Doctor appointment dashboard */}
            <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
