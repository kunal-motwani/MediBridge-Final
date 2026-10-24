import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldOff, FileText, UserCheck, Stethoscope, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentAccessService } from '../../services/documentAccessService';

export default function ManageRecordAccess() {
  const [data, setData] = useState({ doctor: null, allDoctors: [], records: [] });
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const refresh = useCallback(async (docId) => {
    try {
      const response = await documentAccessService.getMine(docId);
      setData(response.data.data);
      if (response.data.data.doctor?._id && !docId) {
        setSelectedDoctorId(response.data.data.doctor._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load sharing settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDoctorChange = async (newDocId) => {
    setSelectedDoctorId(newDocId);
    setLoading(true);
    await refresh(newDocId);
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error('Please select a doctor first');
      return;
    }
    try {
      await documentAccessService.assignDoctor(selectedDoctorId);
      toast.success('Assigned doctor updated');
      await refresh(selectedDoctorId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assigned doctor');
    }
  };

  const toggle = async (record) => {
    if (!selectedDoctorId) {
      toast.error('Select a doctor above to grant or revoke record access');
      return;
    }
    setBusy(record._id);
    try {
      const action = record.accessStatus === 'shared' ? documentAccessService.revoke : documentAccessService.grant;
      await action(record._id, selectedDoctorId);
      toast.success(record.accessStatus === 'shared' ? 'Access revoked for this doctor' : 'Record shared with selected doctor');
      await refresh(selectedDoctorId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update access');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-medium">Loading access settings...</div>;

  const currentDoctor = data.allDoctors?.find(d => d._id === selectedDoctorId) || data.doctor;

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Manage Medical Record Access</h1>
        <p className="mt-1 text-slate-500 text-sm">Choose which doctor you want to grant or revoke access to your medical records.</p>
      </header>

      {/* Doctor Selection Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Select Doctor to Manage Access</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2">
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium"
            >
              <option value="">-- Choose a doctor --</option>
              {data.allDoctors?.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.firstName} {doc.lastName} ({doc.doctorProfile?.specialization || 'Physician'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleAssignDoctor}
            disabled={!selectedDoctorId || selectedDoctorId === data.doctor?._id}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UserCheck size={16} /> Set as Primary Doctor
          </button>
        </div>

        {currentDoctor ? (
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-sm">
            <div>
              <p className="font-bold text-slate-900">Dr. {currentDoctor.firstName} {currentDoctor.lastName}</p>
              <p className="text-xs text-slate-500">{currentDoctor.doctorProfile?.specialization || 'General Physician'} • {currentDoctor.email}</p>
            </div>
            {data.doctor?._id === currentDoctor._id && (
              <span className="text-xs px-2.5 py-1 bg-blue-600 text-white rounded-full font-semibold">
                Primary Doctor
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
            Select a doctor above to grant or revoke permissions for each of your records.
          </p>
        )}
      </section>

      {/* Records Access List */}
      {!data.records.length ? (
        <section className="rounded-xl border border-dashed bg-white p-12 text-center text-slate-500">
          <FileText className="mx-auto mb-3 w-10 h-10 text-slate-300" />
          <h3 className="font-bold text-slate-700">No medical records found</h3>
          <p className="text-xs text-slate-400 mt-1">Upload records first to manage their privacy permissions.</p>
        </section>
      ) : (
        <section className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Record Sharing Permissions ({data.records.length})
            </h3>
          </div>

          {data.records.map((record) => (
            <article key={record._id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/50 transition">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{record.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-500 capitalize">
                    {record.category?.replaceAll('_', ' ')}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">
                    {new Date(record.recordDate || record.createdAt).toLocaleDateString()}
                  </span>
                  {record.sensitivity && record.sensitivity !== 'standard' && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold capitalize">
                        {record.sensitivity.replace('_', ' ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.accessStatus === 'shared' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  {record.accessStatus === 'shared' ? 'Shared with Dr.' : 'Private'}
                </span>
                <button
                  disabled={!selectedDoctorId || busy === record._id}
                  onClick={() => toggle(record)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
                    record.accessStatus === 'shared'
                      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {record.accessStatus === 'shared' ? (
                    <><ShieldOff size={15} /> Revoke</>
                  ) : (
                    <><ShieldCheck size={15} className="text-green-600" /> Grant Access</>
                  )}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
