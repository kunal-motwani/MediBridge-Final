import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Stethoscope, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/appointmentService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await appointmentService.getAppointments();
        setAppointments(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Booked':
        return <span className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wider">Booked</span>;
      case 'Pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
      case 'Completed':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider">Completed</span>;
      case 'Cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold uppercase tracking-wider">Cancelled</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your hospital visits and bookings</p>
        </div>
        <Link
          to="/hospitals"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
        >
          <Calendar className="w-4 h-4" />
          <span>+ Book New Appointment</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : appointments.length === 0 ? (
        <EmptyState 
          icon={Calendar} 
          message="You have no appointments yet." 
          action={{ label: "Find a Hospital", link: "/hospitals" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {appointments.map(apt => (
            <div key={apt._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{apt.hospitalId?.name || 'Unknown Hospital'}</h3>
                  <div className="flex items-center text-slate-500 text-xs mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span className="line-clamp-1">{apt.hospitalId?.address?.city || 'Location unavailable'}</span>
                  </div>
                </div>
                {getStatusBadge(apt.status)}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Department</p>
                    <p className="font-medium text-slate-800">{apt.specialist}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preferred Date</p>
                    <p className="font-medium text-slate-800">{formatDate(apt.preferredDate)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg text-amber-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Preferred Time</p>
                    <p className="font-medium text-slate-800">{apt.preferredTime}</p>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                <span>Booked on {formatDate(apt.createdAt)}</span>
                <span className="font-mono text-slate-400">ID: {apt._id.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
