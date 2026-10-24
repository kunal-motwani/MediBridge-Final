import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DoctorRegister from './pages/auth/DoctorRegister';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Patient & Core Pages
import PatientDashboard from './pages/dashboard/PatientDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import PatientProfile from './pages/profile/PatientProfile';
import EmergencyProfile from './pages/profile/EmergencyProfile';
import HealthIdPage from './pages/profile/HealthIdPage';
import HospitalSearch from './pages/hospitals/HospitalSearch';
import HospitalDetail from './pages/hospitals/HospitalDetail';
import BookAppointment from './pages/hospitals/BookAppointment';
import Appointments from './pages/dashboard/Appointments';
import MedicalRecords from './pages/records/MedicalRecords';
import UploadRecord from './pages/records/UploadRecord';
import RecordDetail from './pages/records/RecordDetail';
import ManageRecordAccess from './pages/records/ManageRecordAccess';
import Prescriptions from './pages/prescriptions/Prescriptions';
import PrescriptionDetail from './pages/prescriptions/PrescriptionDetail';
import AccessLog from './pages/access/AccessLog';

// Financial & Crowdfunding Pages
import ApplyLoan from './pages/financial/ApplyLoan';
import LoanResult from './pages/financial/LoanResult';
import LoanHistory from './pages/financial/LoanHistory';
import CreateFundraiser from './pages/fundraiser/CreateFundraiser';
import MyFundraisers from './pages/fundraiser/MyFundraisers';
import FundraiserCampaign from './pages/fundraiser/FundraiserCampaign';

// Doctor Portal Pages
import FindPatient from './pages/doctor/FindPatient';
import PatientRecords from './pages/doctor/PatientRecords';
import AddRecord from './pages/doctor/AddRecord';
import WritePrescription from './pages/doctor/WritePrescription';
import MyPatients from './pages/doctor/MyPatients';
import ClinicalScribe from './pages/doctor/ClinicalScribe';

// Public Pages
import EmergencyPublic from './pages/emergency/EmergencyPublic';
import Landing from './pages/public/Landing';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/doctor" element={<DoctorRegister />} />
      
      {/* Auth required routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        
        {/* Patient Routes */}
        <Route path="/dashboard" element={<RoleRoute allow={['patient']}><PatientDashboard /></RoleRoute>} />
        <Route path="/profile" element={<PatientProfile />} />
        <Route path="/profile/emergency" element={<EmergencyProfile />} />
        <Route path="/profile/health-id" element={<HealthIdPage />} />
        <Route path="/hospitals" element={<HospitalSearch />} />
        <Route path="/hospitals/:id" element={<HospitalDetail />} />
        <Route path="/hospitals/:id/book" element={<RoleRoute allow={['patient']}><BookAppointment /></RoleRoute>} />
        <Route path="/appointments" element={<RoleRoute allow={['patient']}><Appointments /></RoleRoute>} />
        
        {/* Medical Records */}
        <Route path="/records" element={<MedicalRecords />} />
        <Route path="/records/upload" element={<UploadRecord />} />
        <Route path="/records/:id" element={<RecordDetail />} />
        <Route path="/records/access" element={<RoleRoute allow={['patient']}><ManageRecordAccess /></RoleRoute>} />
        
        {/* Prescriptions */}
        <Route path="/prescriptions" element={<Prescriptions />} />
        <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />
        
        {/* Patient Access Log */}
        <Route path="/access-log" element={<AccessLog />} />
        
        {/* Financial / Loan */}
        <Route path="/financial/apply" element={<ApplyLoan />} />
        <Route path="/financial/result" element={<LoanResult />} />
        <Route path="/financial/history" element={<LoanHistory />} />
        
        {/* Fundraiser */}
        <Route path="/fundraiser/create" element={<CreateFundraiser />} />
        <Route path="/fundraiser/my" element={<MyFundraisers />} />

        {/* Doctor Routes */}
        <Route path="/doctor/dashboard" element={<RoleRoute allow={['doctor']}><DoctorDashboard /></RoleRoute>} />
        <Route path="/doctor/find-patient" element={<RoleRoute allow={['doctor']}><FindPatient /></RoleRoute>} />
        <Route path="/doctor/patient/:healthId/records" element={<RoleRoute allow={['doctor']}><PatientRecords /></RoleRoute>} />
        <Route path="/doctor/patient/:healthId/scribe" element={<RoleRoute allow={['doctor']}><ClinicalScribe /></RoleRoute>} />
        <Route path="/doctor/patient/:healthId/add-record" element={<RoleRoute allow={['doctor']}><AddRecord /></RoleRoute>} />
        <Route path="/doctor/patient/:healthId/prescribe" element={<RoleRoute allow={['doctor']}><WritePrescription /></RoleRoute>} />
        <Route path="/doctor/my-patients" element={<RoleRoute allow={['doctor']}><MyPatients /></RoleRoute>} />

      </Route>

      {/* Public Routes (No Auth) */}
      <Route path="/emergency/:healthId" element={<EmergencyPublic />} />
      <Route path="/fundraiser/:slug" element={<FundraiserCampaign />} />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
