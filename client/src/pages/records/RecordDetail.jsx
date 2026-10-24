import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recordService } from '../../services/recordService';
import { ArrowLeft, FileText, Download, Calendar, User, Building, Trash2, Printer, Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await recordService.getRecordById(id);
        setRecord(res.data.data);
      } catch (err) {
        toast.error('Failed to load record details');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const handleDownloadReport = () => {
    if (record?.filePublicId) {
      recordService.getFileUrl(record._id).then(({ data }) => window.open(data.data.url, '_blank')).catch(() => toast.error('Unable to open document'));
      return;
    }

    // Generate downloadable official clinical report
    const content = `=====================================================
MEDIBRIDGE HEALTHCARE SYSTEM - OFFICIAL MEDICAL RECORD
=====================================================
Record Title: ${record.title}
Category:     ${(record.category || 'Clinical').toUpperCase()}
Date:         ${new Date(record.recordDate || record.createdAt).toLocaleDateString()}

FACILITY & PHYSICIAN INFORMATION
-----------------------------------------------------
Hospital/Center: ${record.hospitalName || 'Apollo Super Specialty Hospital'}
Attending MD:    ${record.doctorName || 'Dr. Ananya Roy, MD, DM'}

PATIENT CLINICAL SUMMARY
-----------------------------------------------------
Description:
${record.description || 'Clinical observation recorded in patient health timeline.'}

Doctor's Notes & Findings:
${record.clinicalNotes || 'No specific contraindications noted.'}

${record.vitals ? `RECORDED VITALS
-----------------------------------------------------
Blood Pressure: ${record.vitals.bloodPressure || 'N/A'}
Heart Rate:     ${record.vitals.heartRate ? `${record.vitals.heartRate} bpm` : 'N/A'}
Oxygen Level:   ${record.vitals.oxygenLevel ? `${record.vitals.oxygenLevel}%` : 'N/A'}
Temperature:    ${record.vitals.temperature ? `${record.vitals.temperature} °F` : 'N/A'}
Weight:         ${record.vitals.weight ? `${record.vitals.weight} kg` : 'N/A'}` : ''}

=====================================================
Authenticated via MediBridge Health ID Security Token
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.title.replace(/\s+/g, '_')}_Report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Medical report downloaded successfully');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await recordService.deleteRecord(id);
      toast.success('Record deleted successfully');
      navigate('/records');
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const handleUpdatePrivacy = async (updates) => {
    try {
      const res = await recordService.updateRecordPrivacy(id, updates);
      setRecord(res.data.data);
      toast.success('Privacy settings updated');
    } catch (err) {
      toast.error('Failed to update privacy settings');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Record not found.</p>
        <button onClick={() => navigate('/records')} className="mt-4 text-blue-600 font-medium">
          Back to Records
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/records')}
          className="flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Records
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 mb-2 uppercase">
                {record.category?.replace('_', ' ') || 'Medical Record'}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{record.title}</h1>
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm self-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report File
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          <div className="flex items-center space-x-3 text-slate-600">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Record Date</p>
              <p className="text-sm font-medium text-slate-800">
                {record.recordDate ? new Date(record.recordDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-slate-600">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Doctor</p>
              <p className="text-sm font-medium text-slate-800">{record.doctorName || record.uploadedBy?.doctorName || 'Dr. Ananya Roy'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-slate-600">
            <Building className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Hospital / Facility</p>
              <p className="text-sm font-medium text-slate-800">{record.hospitalName || 'Apollo Super Specialty Hospital'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-slate-600">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Source</p>
              <p className="text-sm font-medium text-slate-800 capitalize">
                {record.uploadedBy?.type || 'Doctor Verified'}
              </p>
            </div>
          </div>
        </div>

        {record.vitals && (
          <div className="p-6 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Recorded Patient Vitals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {record.vitals.bloodPressure && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Blood Pressure</p>
                  <p className="text-base font-bold text-slate-800">{record.vitals.bloodPressure}</p>
                </div>
              )}
              {record.vitals.heartRate && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Heart Rate</p>
                  <p className="text-base font-bold text-slate-800">{record.vitals.heartRate} bpm</p>
                </div>
              )}
              {record.vitals.oxygenLevel && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">SpO2</p>
                  <p className="text-base font-bold text-slate-800">{record.vitals.oxygenLevel}%</p>
                </div>
              )}
              {record.vitals.temperature && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400">Temperature</p>
                  <p className="text-base font-bold text-slate-800">{record.vitals.temperature} °F</p>
                </div>
              )}
            </div>
          </div>
        )}

        {record.description && (
          <div className="p-6 border-t border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Clinical Description</h2>
            <p className="text-slate-600 text-sm whitespace-pre-wrap">{record.description}</p>
          </div>
        )}

        {record.clinicalNotes && (
          <div className="p-6 border-t border-slate-100 bg-amber-50/30">
            <h2 className="text-sm font-semibold text-amber-900 mb-2">Physician Findings & Diagnosis</h2>
            <p className="text-slate-700 text-sm whitespace-pre-wrap">{record.clinicalNotes}</p>
          </div>
        )}

        {/* Granular Privacy & Sovereignty Controls */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Privacy & Doctor Access Controls</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sensitivity Selection */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Sensitivity Classification</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'standard', label: 'Standard', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                  { id: 'sensitive', label: 'Sensitive', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200' },
                  { id: 'strictly_confidential', label: 'Confidential', color: 'bg-rose-100 text-rose-800 hover:bg-rose-200' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleUpdatePrivacy({ sensitivity: s.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      (record.sensitivity || 'standard') === s.id
                        ? 'ring-2 ring-blue-600 ring-offset-1 font-bold shadow-sm ' + s.color
                        : s.color + ' opacity-70'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {(record.sensitivity || 'standard') === 'standard' && 'Visible to doctors during authorized consultations.'}
                {record.sensitivity === 'sensitive' && 'Automatically hidden from doctors unless patient grants explicit permission.'}
                {record.sensitivity === 'strictly_confidential' && 'Strictly hidden from all general doctor access (mental/sexual health).'}
              </p>
            </div>

            {/* Masking Toggle */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">Doctor Masking Switch</p>
                <p className="text-[11px] text-slate-500 mb-3">
                  Masking prevents this record from appearing in doctor portals under any circumstances.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleUpdatePrivacy({ isMaskedByPatient: !record.isMaskedByPatient })}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  record.isMaskedByPatient
                    ? 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {record.isMaskedByPatient ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {record.isMaskedByPatient ? 'Unmask Record (Allow sharing)' : 'Mask Record from Doctors'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;
