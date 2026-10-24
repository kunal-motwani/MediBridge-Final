import React, { useState, useEffect } from 'react';
import { accessService } from '../../services/accessService';
import { recordService } from '../../services/recordService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, RefreshCw,
  Plus, Shield, Key, Copy, Check, User, EyeOff, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const AccessLog = () => {
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Consent Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [grantMode, setGrantMode] = useState('pin'); // 'pin' or 'direct'
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [scopeType, setScopeType] = useState('all'); // 'all', 'selective_records', 'category'
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(['lab_report', 'prescription']);
  const [excludeSensitive, setExcludeSensitive] = useState(true);
  const [durationHours, setDurationHours] = useState(1);
  const [permissions, setPermissions] = useState({
    viewRecords: true,
    viewPrescriptions: true,
    addRecords: true,
    addPrescription: true,
  });

  // Generated PIN Result
  const [generatedPinData, setGeneratedPinData] = useState(null);
  const [copiedPin, setCopiedPin] = useState(false);

  const availableCategories = [
    { id: 'lab_report', label: 'Lab Reports' },
    { id: 'prescription', label: 'Prescriptions' },
    { id: 'imaging', label: 'Imaging / Scans' },
    { id: 'discharge_summary', label: 'Discharge Summaries' },
    { id: 'diagnosis', label: 'Diagnoses' },
    { id: 'surgery_note', label: 'Surgery Notes' },
    { id: 'follow_up', label: 'Follow Up Notes' },
    { id: 'other', label: 'Other Records' },
  ];

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      const [logsRes, sessionsRes, recordsRes, doctorsRes] = await Promise.all([
        accessService.getAccessLog(),
        accessService.getActiveSessions(),
        recordService.getRecords(),
        accessService.getDoctors().catch(() => ({ data: { data: [] } })),
      ]);
      setLogs(logsRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
      setPatientRecords(recordsRes.data.data || []);
      setDoctorsList(doctorsRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load access activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessData();
  }, []);

  const handleRevoke = async (id, doctorName) => {
    const reason = window.prompt(`Revoke access for ${doctorName || 'doctor'}? Reason (optional):`, 'Consultation concluded');
    if (reason === null) return; // user cancelled prompt

    try {
      setActionLoading(true);
      await accessService.revokeSession(id, reason || 'Patient revoked consent manually');
      toast.success('Doctor access revoked immediately');
      fetchAccessData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRecordSelection = (recordId) => {
    setSelectedRecordIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const toggleCategorySelection = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleCreateConsent = async (e) => {
    e.preventDefault();

    if (grantMode === 'direct' && !selectedDoctorId) {
      toast.error('Please select a doctor to grant direct access');
      return;
    }

    if (scopeType === 'selective_records' && selectedRecordIds.length === 0) {
      toast.error('Please select at least one record to share');
      return;
    }

    if (scopeType === 'category' && selectedCategories.length === 0) {
      toast.error('Please select at least one medical category to share');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        generatePin: grantMode === 'pin',
        doctorId: grantMode === 'direct' ? selectedDoctorId : undefined,
        scopeType,
        allowedRecordIds: scopeType === 'selective_records' ? selectedRecordIds : [],
        allowedCategories: scopeType === 'category' ? selectedCategories : [],
        excludeSensitive,
        durationHours: Number(durationHours),
        permissions,
      };

      const res = await accessService.grantAccess(payload);

      if (grantMode === 'pin') {
        setGeneratedPinData(res.data.data);
        toast.success('Custom 1-Time Access PIN generated!');
      } else {
        toast.success('Access granted to doctor successfully!');
        setIsModalOpen(false);
      }

      fetchAccessData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to configure consent');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPin = (pin) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    toast.success('PIN copied to clipboard');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const formatRemainingTime = (expiresAt) => {
    const diffMs = new Date(expiresAt) - new Date();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)} days left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 px-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Access & Consent Control</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Zero-Trust Architecture
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure record-level consent scopes, generate 1-time PINs, and revoke doctor access in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setGeneratedPinData(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={16} />
            Grant Doctor Consent
          </button>
          <button
            onClick={fetchAccessData}
            className="flex items-center justify-center p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh access records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Doctor Sessions Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Active Doctor Sessions ({sessions.length})</h2>
          </div>
          <span className="text-xs text-slate-400">Enforced at database layer</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No active doctor sessions</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Your medical records are currently private. When you share a scoped PIN with a doctor or grant them consent, their active session will appear here.
              </p>
              <button
                onClick={() => {
                  setGeneratedPinData(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
              >
                <Key size={14} /> Generate 1-Time Consent PIN
              </button>
            </div>
          ) : (
            sessions.map((s) => {
              const doctorDisplayName = s.doctorId?.firstName
                ? `Dr. ${s.doctorId.firstName} ${s.doctorId.lastName}`
                : s.doctorName || 'Authorized Physician';
              const specialization = s.doctorId?.doctorProfile?.specialization || 'General Practice';
              const remainingTime = formatRemainingTime(s.expiresAt);

              return (
                <div key={s._id} className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>

                      {/* Scope Badge */}
                      {s.scopeType === 'selective_records' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Selective ({s.allowedRecordIds?.length || 0} Records)
                        </span>
                      )}
                      {s.scopeType === 'category' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 capitalize">
                          Categories: {s.allowedCategories?.join(', ') || 'Filtered'}
                        </span>
                      )}
                      {s.scopeType === 'all' && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          All Standard Records
                        </span>
                      )}

                      {/* Sensitive Status */}
                      {s.excludeSensitive ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <EyeOff size={11} /> Sensitive Hidden
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Sensitive Included
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-base">{doctorDisplayName}</p>
                      <p className="text-xs text-slate-500">
                        {specialization} • {s.doctorId?.email || 'Walk-in PIN Session'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-emerald-700">
                        <Clock size={13} /> {remainingTime}
                      </span>
                      <span>•</span>
                      <span>Expires: {new Date(s.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(s.expiresAt).toLocaleDateString()}</span>
                    </div>

                    {/* Allowed Record Pills if selective */}
                    {s.scopeType === 'selective_records' && s.allowedRecordIds?.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {s.allowedRecordIds.map((rec) => (
                          <span key={rec._id || rec} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                            📄 {rec.title || 'Selected record'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => handleRevoke(s._id, doctorDisplayName)}
                      disabled={actionLoading}
                      className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <XCircle size={14} />
                      Revoke Access Now
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Audit Log & History Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Audit Log & Access Trail ({logs.length})</h2>
          </div>
          <span className="text-xs text-slate-400">Immutable accountability log</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {logs.length === 0 ? (
            <p className="p-6 text-slate-500 text-center text-sm">No access activity recorded yet.</p>
          ) : (
            logs.map((log) => {
              const docName = log.doctorId?.firstName
                ? `Dr. ${log.doctorId.firstName} ${log.doctorId.lastName}`
                : log.doctorName || 'Physician';

              let actionBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
              if (log.action === 'access_granted') actionBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              if (log.action === 'access_revoked') actionBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              if (log.action === 'viewed_single_record') actionBadgeColor = 'bg-cyan-50 text-cyan-700 border-cyan-200';

              return (
                <div key={log._id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${actionBadgeColor}`}>
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{docName}</span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-2xl">
                        {log.details}
                      </p>
                    )}
                    {log.recordTitle && (
                      <p className="text-xs text-slate-500">
                        Record inspected: <span className="font-semibold text-slate-700">{log.recordTitle}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400 block">
                      {new Date(log.createdAt || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt || log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Manage Doctor Consent Drawer / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 my-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Configure Doctor Consent
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Specify scope, TTL, and record sensitivity before granting access.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Generated PIN View if active */}
            {generatedPinData ? (
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Key size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">Your 1-Time Access PIN</h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    Share this 4-digit temporary code with your physician. It will bind to the selected privacy contract and expire in 15 minutes.
                  </p>
                </div>

                <div className="bg-white border-2 border-blue-400 rounded-2xl py-4 px-6 inline-flex items-center gap-4 shadow-sm">
                  <span className="text-4xl font-extrabold tracking-widest text-blue-600 font-mono">
                    {generatedPinData.pin}
                  </span>
                  <button
                    onClick={() => handleCopyPin(generatedPinData.pin)}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                  >
                    {copiedPin ? <Check size={16} /> : <Copy size={16} />}
                    {copiedPin ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>
                    Scope: <strong className="text-slate-800 capitalize">{generatedPinData.scopeType?.replace('_', ' ')}</strong> ({generatedPinData.durationHours} Hours TTL)
                  </p>
                  <p>
                    Sensitive Records: <strong className="text-slate-800">{generatedPinData.excludeSensitive ? 'Excluded (Safe)' : 'Included'}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-700 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateConsent} className="space-y-6">
                {/* Mode Selector: Walk-in PIN vs Direct Doctor Grant */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Sharing Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGrantMode('pin')}
                      className={`p-3 rounded-xl border text-left transition ${
                        grantMode === 'pin'
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Key size={16} className="text-blue-600" /> 1-Time Access PIN
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Best for clinic / hospital walk-ins. Doctor enters this code.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGrantMode('direct')}
                      className={`p-3 rounded-xl border text-left transition ${
                        grantMode === 'direct'
                          ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <User size={16} className="text-blue-600" /> Direct Doctor Grant
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Select a doctor directly for remote or scheduled care.
                      </p>
                    </button>
                  </div>
                </div>

                {/* If Direct Doctor Mode: Doctor Picker */}
                {grantMode === 'direct' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Doctor
                    </label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required
                    >
                      <option value="">-- Choose a doctor --</option>
                      {doctorsList.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          Dr. {doc.firstName} {doc.lastName} ({doc.doctorProfile?.specialization || 'General'}) - {doc.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 1. Scope Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Record Sharing Scope
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'all', title: 'All Records', desc: 'Standard full consultation' },
                      { id: 'selective_records', title: 'Selective Records', desc: 'Pick exact records to share' },
                      { id: 'category', title: 'By Category', desc: 'Filter by department/type' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setScopeType(s.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          scopeType === s.id
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="font-semibold text-xs text-slate-900">{s.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope Sub-selection: Selective Records list */}
                {scopeType === 'selective_records' && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Choose which records to share ({selectedRecordIds.length} selected):
                    </p>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white rounded-lg border border-slate-200">
                      {patientRecords.length === 0 ? (
                        <p className="p-3 text-xs text-slate-400">No records available</p>
                      ) : (
                        patientRecords.map((r) => (
                          <label
                            key={r._id}
                            className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedRecordIds.includes(r._id)}
                                onChange={() => toggleRecordSelection(r._id)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <p className="font-medium text-slate-800">{r.title}</p>
                                <p className="text-[10px] text-slate-400 capitalize">
                                  {r.category?.replace('_', ' ')} • {new Date(r.recordDate || r.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                              {r.sensitivity || 'standard'}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Scope Sub-selection: Category Checkboxes */}
                {scopeType === 'category' && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">
                      Allowed Categories ({selectedCategories.length} selected):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableCategories.map((c) => (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(c.id)}
                            onChange={() => toggleCategorySelection(c.id)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span>{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Sensitivity Switch */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="excludeSensitive"
                    checked={excludeSensitive}
                    onChange={(e) => setExcludeSensitive(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <label htmlFor="excludeSensitive" className="text-xs cursor-pointer">
                    <strong className="text-amber-900 block font-semibold">
                      🛡️ Automatically hide sensitive and psychiatric records
                    </strong>
                    <span className="text-amber-700">
                      Restricts documents tagged as <em>Sensitive</em> or <em>Strictly Confidential</em>. Recommended for general practitioner and orthopedic visits.
                    </span>
                  </label>
                </div>

                {/* 3. Session Duration Slider / Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Session Duration (TTL)
                    </label>
                    <span className="text-xs font-semibold text-blue-600">
                      {durationHours === 1
                        ? '1 Hour (Clinic Visit)'
                        : durationHours === 4
                        ? '4 Hours (Extended)'
                        : durationHours === 24
                        ? '24 Hours (Full Day)'
                        : '7 Days (Hospitalization)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { h: 1, label: '1 Hr' },
                      { h: 4, label: '4 Hrs' },
                      { h: 24, label: '24 Hrs' },
                      { h: 168, label: '7 Days' },
                    ].map((d) => (
                      <button
                        key={d.h}
                        type="button"
                        onClick={() => setDurationHours(d.h)}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${
                          durationHours === d.h
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {grantMode === 'pin' ? <Key size={14} /> : <CheckCircle2 size={14} />}
                    {actionLoading
                      ? 'Generating...'
                      : grantMode === 'pin'
                      ? 'Generate 1-Time Consent PIN'
                      : 'Grant Doctor Access'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessLog;
