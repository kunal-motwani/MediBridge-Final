import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ChevronRight } from 'lucide-react';

const MyPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorService.getMyPatients().then(res => {
      setPatients(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <h1 className="text-2xl font-bold text-slate-900">My Patients</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y">
        {patients.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No patients found</p>
        ) : (
          patients.map((p, i) => (
            <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
              <div>
                <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                <p className="text-xs text-slate-500 font-mono">ID: {p.healthId}</p>
              </div>
              <Link
                to={`/doctor/patient/${p.healthId}/records`}
                className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                View Records <ChevronRight size={14} />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default MyPatients;
