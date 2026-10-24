import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { ArrowLeft, CheckCircle, Pill, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PrescriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await prescriptionService.getPrescriptionById(id);
        setPrescription(res.data.data);
      } catch (err) {
        toast.error('Failed to load prescription');
      } finally {
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [id]);

  const handleMarkComplete = async () => {
    try {
      await prescriptionService.markComplete(id);
      setPrescription({ ...prescription, isActive: false });
      toast.success('Course marked as complete');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Prescription not found.</p>
        <button onClick={() => navigate('/prescriptions')} className="mt-4 text-blue-600 font-medium">
          Back to Prescriptions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/prescriptions')}
          className="flex items-center text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Prescriptions
        </button>
        {prescription.isActive && (
          <button
            onClick={handleMarkComplete}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Course Complete
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full mb-2 ${
              prescription.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {prescription.isActive ? 'Active Course' : 'Completed Course'}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">
              {prescription.diagnosis?.join(', ') || 'Prescription Details'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Issued on {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2 text-blue-600" />
            Medications ({prescription.medicines?.length || 0})
          </h2>
          <div className="grid gap-3">
            {prescription.medicines?.map((med, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">{med.name}</h3>
                  <p className="text-sm text-slate-500">
                    Dosage: <span className="font-medium text-slate-700">{med.dosage}</span> • Frequency: <span className="font-medium text-slate-700">{med.frequency}</span>
                  </p>
                  {med.instructions && (
                    <p className="text-xs text-amber-700 mt-1 bg-amber-50 px-2 py-0.5 rounded inline-block">
                      Note: {med.instructions}
                    </p>
                  )}
                </div>
                <div className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                  Duration: <span className="font-semibold text-slate-900">{med.duration} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {prescription.advice && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Doctor's Advice</h3>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{prescription.advice}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetail;
