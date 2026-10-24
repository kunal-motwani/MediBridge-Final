import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, FileText, Download, Clock, ChevronRight, Shield, ShieldAlert,
  ShieldCheck, EyeOff, Eye, Check, ChevronDown, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { recordService } from '../../services/recordService';
import GrokMedicalSummaryCard from '../../components/GrokMedicalSummaryCard';
import toast from 'react-hot-toast';

const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, standard, sensitive, confidential, masked
  const [openMenuId, setOpenMenuId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fetchMyAiSummary = async () => {
    try {
      setSummaryLoading(true);
      setShowSummary(true);
      const res = await recordService.getMyAiSummary();
      setSummaryData(res.data.data);
      toast.success('Grok AI Health Summary ready!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await recordService.getRecords();
      setRecords(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrivacy = async (e, recordId, updates) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenuId(null);
    setUpdatingId(recordId);

    try {
      const res = await recordService.updateRecordPrivacy(recordId, updates);
      const updated = res.data.data;
      setRecords((prev) => prev.map((r) => (r._id === recordId ? { ...r, ...updated } : r)));
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleQuickDownload = (e, record) => {
    e.preventDefault();
    e.stopPropagation();

    if (record.filePublicId) {
      recordService
        .getFileUrl(record._id)
        .then(({ data }) => window.open(data.data.url, '_blank'))
        .catch(() => toast.error('Unable to open document'));
      return;
    }

    const content = `MEDIBRIDGE MEDICAL REPORT\n-------------------------\nTitle: ${record.title}\nCategory: ${record.category}\nDate: ${new Date(record.recordDate || record.createdAt).toLocaleDateString()}\nHospital: ${record.hospitalName || 'Apollo Hospital'}\nDoctor: ${record.doctorName || 'Dr. Ananya Roy'}\nSensitivity: ${record.sensitivity || 'standard'}\n\nNotes:\n${record.clinicalNotes || record.description || 'Clinical observation.'}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.title.replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded report summary');
  };

  const filteredRecords = records.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'masked') return r.isMaskedByPatient;
    if (filter === 'confidential') return r.sensitivity === 'strictly_confidential';
    if (filter === 'sensitive') return r.sensitivity === 'sensitive';
    if (filter === 'standard') return r.sensitivity === 'standard' || !r.sensitivity;
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ABDM & DPDP Compliant
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your diagnostic reports and configure granular privacy controls for each document.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              if (!summaryData) fetchMyAiSummary();
              else setShowSummary(!showSummary);
            }}
            disabled={summaryLoading}
            className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            title="Summarize prescriptions, lab reports and medications with Grok"
          >
            <Sparkles size={16} className={summaryLoading ? "animate-spin" : ""} />
            {summaryLoading ? 'Analyzing...' : (showSummary && summaryData ? 'Hide AI Summary' : '✨ Grok AI Summary')}
          </button>
          <Link
            to="/access-log"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Shield className="w-4 h-4 text-blue-600" />
            Manage Doctor Consent
          </Link>
          <Link
            to="/records/upload"
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Upload Record
          </Link>
        </div>
      </div>

      {/* GROK AI PATIENT HEALTH SUMMARY */}
      {showSummary && (
        <GrokMedicalSummaryCard
          summaryData={summaryData}
          onRefresh={fetchMyAiSummary}
          loading={summaryLoading}
          healthId="Personal Health Vault"
        />
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-100">
        <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: `All (${records.length})` },
          { id: 'standard', label: `Standard (${records.filter(r => !r.sensitivity || r.sensitivity === 'standard').length})` },
          { id: 'sensitive', label: `Sensitive (${records.filter(r => r.sensitivity === 'sensitive').length})` },
          { id: 'confidential', label: `Confidential (${records.filter(r => r.sensitivity === 'strictly_confidential').length})` },
          { id: 'masked', label: `Masked (${records.filter(r => r.isMaskedByPatient).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No records found</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            {filter === 'all'
              ? "You haven't uploaded or received any medical records yet."
              : `No records matching the filter '${filter}'.`}
          </p>
          {filter === 'all' ? (
            <Link to="/records/upload" className="text-blue-600 font-medium hover:underline">
              Upload your first record
            </Link>
          ) : (
            <button
              onClick={() => setFilter('all')}
              className="text-blue-600 font-medium hover:underline text-sm"
            >
              Show all records
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecords.map((record) => {
            const isMenuOpen = openMenuId === record._id;
            const isUpdating = updatingId === record._id;
            const sensitivity = record.sensitivity || 'standard';

            return (
              <div
                key={record._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all relative group"
              >
                <div>
                  {/* Top Bar: Icon, Category & Privacy Badges */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                      <FileText size={22} />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* Mask Badge */}
                      {record.isMaskedByPatient && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                          <EyeOff size={11} /> Masked
                        </span>
                      )}

                      {/* Sensitivity Badge */}
                      {sensitivity === 'strictly_confidential' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                          <ShieldAlert size={11} /> Confidential
                        </span>
                      )}
                      {sensitivity === 'sensitive' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                          <Shield size={11} /> Sensitive
                        </span>
                      )}
                      {sensitivity === 'standard' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
                          <ShieldCheck size={11} /> Standard
                        </span>
                      )}

                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full capitalize">
                        {record.category?.replace('_', ' ') || 'General'}
                      </span>
                    </div>
                  </div>

                  <Link to={`/records/${record._id}`}>
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {record.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {record.clinicalNotes || record.description || 'Verified hospital record'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-xs text-gray-400 mb-3 gap-1">
                    <Clock size={14} />
                    {new Date(record.recordDate || record.createdAt).toLocaleDateString()}
                    {record.hospitalName && (
                      <span className="ml-2 font-medium text-slate-500 truncate">
                        • {record.hospitalName}
                      </span>
                    )}
                  </div>

                  {/* Privacy Quick Action Dropdown Bar */}
                  <div className="relative mb-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Doctor Visibility:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(isMenuOpen ? null : record._id);
                      }}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                    >
                      <Shield size={12} className="text-blue-600" />
                      <span>
                        {record.isMaskedByPatient
                          ? 'Masked (Invisible)'
                          : sensitivity === 'strictly_confidential'
                          ? 'Confidential'
                          : sensitivity === 'sensitive'
                          ? 'Sensitive'
                          : 'Standard Access'}
                      </span>
                      <ChevronDown size={12} />
                    </button>

                    {/* Popover Menu */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-100"
                      >
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Record Sensitivity
                        </p>
                        <button
                          type="button"
                          onClick={(e) => handleUpdatePrivacy(e, record._id, { sensitivity: 'standard' })}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                            sensitivity === 'standard' ? 'font-semibold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Standard</p>
                            <p className="text-[10px] text-slate-400">Shared during normal consultations</p>
                          </div>
                          {sensitivity === 'standard' && <Check size={14} className="text-blue-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleUpdatePrivacy(e, record._id, { sensitivity: 'sensitive' })}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                            sensitivity === 'sensitive' ? 'font-semibold text-amber-700 bg-amber-50/50' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Sensitive</p>
                            <p className="text-[10px] text-slate-400">Hidden from doctors by default</p>
                          </div>
                          {sensitivity === 'sensitive' && <Check size={14} className="text-amber-600" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleUpdatePrivacy(e, record._id, { sensitivity: 'strictly_confidential' })}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                            sensitivity === 'strictly_confidential' ? 'font-semibold text-rose-700 bg-rose-50/50' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-medium">Strictly Confidential</p>
                            <p className="text-[10px] text-slate-400">Mental, sexual or oncology notes</p>
                          </div>
                          {sensitivity === 'strictly_confidential' && <Check size={14} className="text-rose-600" />}
                        </button>

                        <div className="my-1.5 border-t border-slate-100" />

                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                          Doctor Masking
                        </p>
                        <button
                          type="button"
                          onClick={(e) =>
                            handleUpdatePrivacy(e, record._id, {
                              isMaskedByPatient: !record.isMaskedByPatient,
                            })
                          }
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 ${
                            record.isMaskedByPatient ? 'text-purple-700 bg-purple-50/50 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {record.isMaskedByPatient ? <Eye size={14} /> : <EyeOff size={14} />}
                            <div>
                              <p className="font-medium">
                                {record.isMaskedByPatient ? 'Unmask Record' : 'Mask Completely'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {record.isMaskedByPatient
                                  ? 'Allow sharing when permitted'
                                  : 'Never show to doctors'}
                              </p>
                            </div>
                          </div>
                          {record.isMaskedByPatient && <Check size={14} className="text-purple-600" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/records/${record._id}`}
                      className="flex-1 text-center py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                    >
                      View Details <ChevronRight size={14} className="ml-1" />
                    </Link>
                    <button
                      onClick={(e) => handleQuickDownload(e, record)}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Download Report"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
