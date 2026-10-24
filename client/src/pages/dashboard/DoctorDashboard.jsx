import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Activity, Search, Calendar, Clock, User as UserIcon, CheckCircle, XCircle, Mic } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import useAuthStore from '../../store/authStore';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ patients: 0, sessions: 0 });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentService.getDoctorAppointments();
      setAppointments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load doctor appointments");
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, sessionsRes] = await Promise.all([
          doctorService.getMyPatients(),
          doctorService.getMySessions()
        ]);
        setStats({
          patients: patientsRes.data.data.length || 0,
          sessions: sessionsRes.data.data.length || 0
        });
      } catch (err) {
        console.error("Failed to load doctor dashboard stats");
      }
    };
    
    Promise.all([fetchStats(), fetchAppointments()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, Dr. {user?.firstName} {user?.lastName}</h1>
        <p className="text-slate-500">Manage your patients, appointments, and medical records.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} title="Patients Treated" value={stats.patients} />
        <StatCard icon={Activity} title="Active Sessions" value={stats.sessions} />
        <StatCard icon={Calendar} title="Pending Appointments" value={appointments.filter(a => a.status === 'Pending').length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Find a Patient</h2>
        <p className="text-slate-500 mb-6">Scan NFC card or enter Health ID to access patient medical records securely.</p>
        <Link to="/doctor/find-patient" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
          Search Patient Records
        </Link>
      </div>

      <div className="pt-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Upcoming & Pending Appointments</h2>
        {appointments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700">No Appointments</h3>
            <p className="text-slate-500">You have no pending or upcoming appointments at your hospital.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                  <th className="p-4 font-semibold">Patient</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{apt.patientName || (apt.userId ? `${apt.userId.firstName} ${apt.userId.lastName}` : 'Unknown')}</p>
                          <p className="text-xs text-slate-500">{apt.patientPhone || apt.userId?.phone || 'No phone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium whitespace-nowrap">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(apt.preferredDate)}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {apt.preferredTime}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {apt.specialist}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        apt.status === 'Booked' ? 'bg-green-100 text-green-700' :
                        apt.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        apt.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {apt.status === 'Pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(apt._id, 'Booked')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg text-sm font-medium transition"
                          >
                            <CheckCircle className="w-4 h-4" /> Accept
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(apt._id, 'Rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}
                      {apt.status === 'Booked' && (
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={`/doctor/patient/${apt.healthId || apt.userId?.healthId || 'MB-2026-720421'}/scribe`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                          >
                            <Mic className="w-3.5 h-3.5" /> Start AI Scribe
                          </Link>
                          <button 
                            onClick={() => handleUpdateStatus(apt._id, 'Completed')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition"
                          >
                            Complete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
