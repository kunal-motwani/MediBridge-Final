import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Landing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [emergencyId, setEmergencyId] = useState('');

  const handleEmergencyLookup = (e) => {
    e.preventDefault();
    const cleanId = emergencyId.trim().toUpperCase();
    if (cleanId) {
      navigate(`/emergency/${cleanId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              MB
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">MediBridge</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#emergency" className="hover:text-blue-600 transition-colors">Emergency Access</a>
            <a href="#hospitals" className="hover:text-blue-600 transition-colors">Hospitals</a>
            <a href="#financial" className="hover:text-blue-600 transition-colors">Financial Aid</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-700 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              Universal Healthcare Interoperability & Financial Inclusion
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              One Health Identity. <br />
              <span className="text-blue-600">Complete Healthcare Control.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              MediBridge unites medical records, doctor consultations, time-bounded consent,
              emergency NFC response, and AI-powered micro-loans under a single, secure platform.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 transition-all text-center"
              >
                Register as Patient
              </Link>
              <Link
                to="/register/doctor"
                className="w-full sm:w-auto rounded-xl bg-white border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100 transition-all text-center shadow-sm"
              >
                Join as Doctor
              </Link>
            </div>

            {/* Quick Demo Access banner */}
            <div className="mt-8 inline-block rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 text-xs text-blue-800">
              <span className="font-semibold">Quick Demo Credentials:</span> Patient: <code className="font-mono font-bold">patient@medibridge.com</code> (PIN: <code className="font-mono font-bold">1234</code>) | Doctor: <code className="font-mono font-bold">doctor@medibridge.com</code> (Password: <code className="font-mono font-bold">Password123!</code>)
            </div>
          </div>

          {/* Quick Emergency Lookup Box */}
          <div id="emergency" className="mt-16 max-w-2xl mx-auto rounded-2xl bg-white p-6 sm:p-8 shadow-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 font-bold">
                SOS
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Emergency Profile Quick Access</h3>
                <p className="text-xs text-slate-500">First responders and paramedics can view critical life-saving profiles instantly.</p>
              </div>
            </div>

            <form onSubmit={handleEmergencyLookup} className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter Health ID (e.g. MB-2026-100001)"
                value={emergencyId}
                onChange={(e) => setEmergencyId(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 transition-colors"
              >
                View Emergency Info
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Core MediBridge Services</h2>
            <p className="mt-3 text-base text-slate-600">Built to solve healthcare fragmentation, patient privacy, and financial emergencies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                ID
              </div>
              <h3 className="text-lg font-bold text-slate-900">Universal Health ID & NFC</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Unique identifier with QR and physical NFC card write capability. Instant emergency vitals without requiring device unlock.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                PIN
              </div>
              <h3 className="text-lg font-bold text-slate-900">Doctor Consent & Access Logs</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Doctors must request timed access using the patient's 4-digit PIN. Full audit trails allow patients to view or revoke active sessions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                REC
              </div>
              <h3 className="text-lg font-bold text-slate-900">Digital Medical Records</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Unified storage for diagnosis records, lab test reports, and electronic prescriptions. Download or share with doctors on-demand.
              </p>
            </div>

            {/* Feature 4 */}
            <div id="financial" className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
                ML
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Medical Micro-Loans</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Dual-engine evaluation combining rule-based financial models and ML prediction for rapid emergency medical loan approvals.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg mb-4">
                CF
              </div>
              <h3 className="text-lg font-bold text-slate-900">Verified Crowdfunding</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Integrated fundraising for medical expenses exceeding loan coverage. Public campaigns with transparent real-time donation tracking.
              </p>
            </div>

            {/* Feature 6 */}
            <div id="hospitals" className="rounded-2xl border border-slate-200 p-6 bg-slate-50/50 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg mb-4">
                HSP
              </div>
              <h3 className="text-lg font-bold text-slate-900">Hospital Discovery & Care</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Browse super specialty hospitals, discover verified doctors, view departmental qualifications, and book appointments directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              MB
            </div>
            <div>
              <p className="text-sm font-semibold text-white">MediBridge Healthcare Platform</p>
              <p className="text-xs text-slate-500">UCS503 Software Engineering Course Project</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Patient Register</Link>
            <Link to="/register/doctor" className="hover:text-white transition-colors">Doctor Portal</Link>
            <Link to="/emergency/MB-2026-100001" className="hover:text-white transition-colors">Demo Emergency Card</Link>
          </div>

          <p className="text-xs text-slate-500">
            &copy; 2026 MediBridge Team. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
