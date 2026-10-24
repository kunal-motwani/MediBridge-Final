import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, HeartPulse, Shield, Plus, Hospital } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import useAuthStore from '../../store/authStore';
import { recordService } from '../../services/recordService';
import { prescriptionService } from '../../services/prescriptionService';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ records: 0, activePrescriptions: 0 });
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recordsRes, presRes] = await Promise.all([
          recordService.getRecords({ limit: 5 }),
          prescriptionService.getActivePrescriptions()
        ]);
        
        setRecentRecords(recordsRes.data.data);
        setStats({
          records: recordsRes.data.pagination.total || 0,
          activePrescriptions: presRes.data.data.length || 0
        });
      } catch (err) {
        console.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user?.firstName}</h1>
          <p className="text-slate-500">Here's an overview of your health profile today.</p>
        </div>
        <Link to="/profile/health-id" className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 flex items-center gap-2">
          <Shield className="w-4 h-4" /> View Health ID
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={FileText} title="Total Records" value={stats.records} />
        <StatCard icon={HeartPulse} title="Active Prescriptions" value={stats.activePrescriptions} />
        <StatCard icon={Shield} title="Emergency Profile" value={user?.bloodGroup ? "Updated" : "Incomplete"} subtitle={!user?.bloodGroup ? "Please update ASAP" : ""} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Recent Records</h2>
              <Link to="/records" className="text-sm font-medium text-blue-600 hover:text-blue-800">View All</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No medical records found.</div>
              ) : (
                recentRecords.map(record => (
                  <div key={record._id} className="p-6 hover:bg-slate-50 transition flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-slate-800">{record.title}</h3>
                        <Badge variant="info">{record.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{record.hospitalName} • Dr. {record.doctorName}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(record.recordDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/records/upload" className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md group-hover:text-blue-600 shadow-sm"><Plus className="w-5 h-5" /></div>
                  <span className="font-medium text-slate-700 group-hover:text-blue-700">Upload Record</span>
                </div>
              </Link>
              <Link to="/hospitals" className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md group-hover:text-blue-600 shadow-sm"><Hospital className="w-5 h-5" /></div>
                  <span className="font-medium text-slate-700 group-hover:text-blue-700">Find Hospital</span>
                </div>
              </Link>
              <Link to="/prescriptions" className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md group-hover:text-blue-600 shadow-sm"><HeartPulse className="w-5 h-5" /></div>
                  <span className="font-medium text-slate-700 group-hover:text-blue-700">My Prescriptions</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
