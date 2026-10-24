import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, Key } from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import toast from 'react-hot-toast';
import SmartCardReader from '../../components/shared/SmartCardReader';

const FindPatient = () => {
  const navigate = useNavigate();
  const [healthId, setHealthId] = useState('');
  const [patient, setPatient] = useState(null);
  const [pin, setPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const executeSearch = async (idToSearch) => {
    if (!idToSearch) return;
    try {
      setLoading(true);
      const res = await doctorService.searchPatient(idToSearch);
      setPatient(res.data.data);
      setPin(['', '', '', '']);
    } catch (error) {
      toast.error('Patient not found with this Health ID');
      setPatient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(healthId);
  };

  const handlePinChange = (index, value) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    
    // Auto focus next input
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`).focus();
    }
  };

  const handleVerify = async () => {
    const fullPin = pin.join('');
    if (fullPin.length !== 4) {
      toast.error('Please enter the 4-digit PIN');
      return;
    }

    try {
      setVerifying(true);
      const targetHealthId = patient.healthId || healthId;
      await doctorService.requestAccess({ healthId: targetHealthId, accessPin: fullPin });
      toast.success('Access consent verified successfully');
      navigate(`/doctor/patient/${targetHealthId}/records`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid PIN. Access denied.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Find Patient</h1>
        <p className="text-sm text-gray-500 mt-1">Search patients by their unique Health ID</p>
      </div>

      {/* Quick Demo Patient Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
            RS
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Demo Patient: Rahul Sharma</h3>
            <p className="text-xs text-slate-500 font-mono">
              Health ID: <strong className="text-blue-700">MB-2026-487139</strong> • Master PIN: <strong className="text-slate-800">1234</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setHealthId('MB-2026-487139');
            executeSearch('MB-2026-487139');
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Select Rahul Sharma
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value.toUpperCase())}
              placeholder="e.g. MB-2026-123456"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <SmartCardReader onRead={(id) => { setHealthId(id); executeSearch(id); }} />
        </form>
      </div>

      {patient && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
          <div className="bg-blue-50 p-6 border-b border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h2>
                <p className="text-blue-600 font-medium">{patient.healthId}</p>
              </div>
            </div>
          </div>

          <div className="p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Consent Required</h3>
            <p className="text-gray-500 text-center max-w-md mb-8">
              To view this patient's medical history or add new records, please ask them for their 4-digit temporary access PIN.
            </p>

            <div className="flex gap-4 mb-8">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              ))}
            </div>

            <button
              onClick={handleVerify}
              disabled={verifying || pin.join('').length !== 4}
              className="px-8 py-3 bg-gray-900 text-white font-medium rounded-lg flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Key size={18} />
              {verifying ? 'Verifying...' : 'Verify PIN & Request Access'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindPatient;
