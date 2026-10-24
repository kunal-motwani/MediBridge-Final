import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { Pill, Calendar, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const res = activeTab === 'active' 
          ? await prescriptionService.getActivePrescriptions()
          : await prescriptionService.getPrescriptions();
        setPrescriptions(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load prescriptions');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-500">View and track all prescribed medications and instructions</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Courses
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">No Prescriptions Found</h3>
          <p className="text-slate-500 text-sm mt-1">Prescriptions issued by your doctor will show up here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {prescriptions.map((p) => (
            <Link
              key={p._id}
              to={`/prescriptions/${p._id}`}
              className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex items-center justify-between group"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    p.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.isActive ? 'Active Course' : 'Completed'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-base">
                  {p.diagnosis?.join(', ') || 'Prescription'}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                  {p.medicines?.map((m, idx) => (
                    <span key={idx} className="bg-slate-50 px-2 py-1 rounded text-xs border border-slate-100">
                      {m.name} ({m.dosage})
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
