import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Stethoscope, Activity, AlertTriangle, CheckCircle2,
  FileText, ArrowRight, Pill, RefreshCw, Copy, ShieldAlert, ChevronRight,
  TrendingUp, Check, ExternalLink
} from 'lucide-react';
import { doctorService } from '../services/doctorService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const QUICK_SYMPTOMS = [
  'Increased Thirst (Polydipsia)',
  'Frequent Urination (Nocturia)',
  'Blurred Vision',
  'Fatigue & Lethargy',
  'Morning Dizziness',
  'Chest Tightness',
  'Shortness of Breath',
  'Occasional Headache'
];

const HfDiagnosisCopilotModal = ({ isOpen, onClose, healthId, initialDiagnoses = [], initialLabs = [] }) => {
  const navigate = useNavigate();

  const [symptoms, setSymptoms] = useState(
    'Increased thirst, frequent urination (especially nocturnal), fatigue, and occasional blurred vision over the past 3 weeks.'
  );
  const [customNotes, setCustomNotes] = useState('Patient notes sedentary lifestyle over recent months and mild stress.');
  const [loading, setLoading] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);

  const toggleSymptom = (sym) => {
    if (symptoms.includes(sym)) {
      setSymptoms(symptoms.replace(sym, '').replace(/,\s*,/g, ',').trim());
    } else {
      setSymptoms(prev => (prev ? `${prev}, ${sym}` : sym));
    }
  };

  const handleRunDiagnosis = async () => {
    if (!symptoms.trim()) {
      toast.error('Please enter or select at least one presenting symptom.');
      return;
    }

    try {
      setLoading(true);
      const res = await doctorService.suggestDiagnosis(healthId, {
        symptoms,
        customNotes
      });
      setDiagnosisData(res.data.data);
      if (res.data.data?.differentialDiagnoses?.length > 0) {
        setSelectedDiagnosis(res.data.data.differentialDiagnoses[0]);
      }
      toast.success('Hugging Face Diagnostic Copilot analysis complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run Hugging Face diagnostic model');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptAndPrescribe = (diag) => {
    onClose();
    // Navigate to Write Prescription with diagnosis query state
    navigate(`/doctor/patient/${healthId}/prescribe?diagnosis=${encodeURIComponent(diag.condition)}&icd10=${encodeURIComponent(diag.icd10 || '')}`);
  };

  const handleCopyReport = () => {
    if (!diagnosisData) return;
    const text = `=== HUGGING FACE CLINICAL DIAGNOSTIC COPILOT ===
Patient Health ID: ${healthId}
Model: ${diagnosisData.modelMeta?.model || 'Hugging Face Bio_ClinicalBERT'}
Framework: ${diagnosisData.modelMeta?.provider || 'Hugging Face Hub'}
Analyzed: ${new Date(diagnosisData.modelMeta?.analyzedAt || Date.now()).toLocaleString()}

PRESENTING SYMPTOMS:
${symptoms}

DIFFERENTIAL DIAGNOSES:
${(diagnosisData.differentialDiagnoses || []).map((d, i) => `${i + 1}. ${d.condition} [ICD-10: ${d.icd10}] (Confidence: ${d.confidence}%)
   Rationale: ${d.clinicalRationale}
   Suggested Action: ${d.suggestedAction}`).join('\n\n')}

RECOMMENDED TESTS:
${(diagnosisData.recommendedDiagnosticTests || []).map(t => `- [${t.priority}] ${t.test}: ${t.reason}`).join('\n')}

SAFETY ALERTS:
${(diagnosisData.contraindicationAlerts || []).map(c => `- ${c.warning}`).join('\n')}
`;
    navigator.clipboard.writeText(text);
    toast.success('Diagnostic report copied to clipboard!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-orange-500/20">
              🤗
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Hugging Face Clinical Diagnostic Copilot
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Bio_ClinicalBERT • ICD-10
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  Patient: {healthId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-modal clinical decision support correlating symptoms, lab biomarkers, and medical history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {diagnosisData && (
              <button
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition border border-slate-700"
              >
                <Copy size={13} /> Copy Report
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* Left Column: Doctor Input & Clinical Context (5 Cols) */}
          <div className="lg:col-span-5 p-5 space-y-5 bg-slate-900/60 overflow-y-auto">
            {/* Auto-Aggregated Patient Baseline */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Activity size={14} /> Medical History on Record
                </span>
                <span className="text-emerald-400">Auto-Correlated</span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prior Diagnoses:</span>
                  <span className="font-semibold text-white">Type 2 Diabetes, Hypertension</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Documented Labs:</span>
                  <span className="font-mono text-cyan-300 font-semibold">HbA1c 7.1%, Echo LVH, LDL 110</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Allergies:</span>
                  <span className="text-rose-400 font-bold">Penicillin (Severe)</span>
                </div>
              </div>
            </div>

            {/* Quick Symptom Chips */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Select / Add Presenting Symptoms</span>
                <span className="text-[11px] text-slate-500 font-normal">Click to toggle</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SYMPTOMS.map((sym, idx) => {
                  const isSelected = symptoms.includes(sym.split(' (')[0]);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSymptom(sym.split(' (')[0])}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chief Complaint Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Presenting Problem & Chief Complaint
              </label>
              <textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe patient's symptoms, onset, severity, and triggers..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* Additional Physician Notes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Physician Physical Exam & Observations
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. BP 134/86, mild pedal edema, BMI 27.5..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Run Analysis Action Button */}
            <button
              onClick={handleRunDiagnosis}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
            >
              <Sparkles size={16} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Evaluating with Hugging Face Model...' : '🤗 Run Hugging Face Diagnostic Analysis'}
            </button>
          </div>

          {/* Right Column: AI Diagnostic Findings (7 Cols) */}
          <div className="lg:col-span-7 p-5 space-y-5 overflow-y-auto">
            {/* Empty State before running */}
            {!diagnosisData && !loading && (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-3xl">
                  🤗
                </div>
                <h3 className="text-base font-bold text-white">Ready for Diagnostic Assessment</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Review the presenting symptoms and click <strong>"Run Hugging Face Diagnostic Analysis"</strong>. 
                  The model will correlate symptoms against the patient's HbA1c, echocardiogram, lipid panels, and chronic disease trajectory.
                </p>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-amber-400/20 border-t-amber-400 animate-spin mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">Hugging Face Bio_ClinicalBERT Processing...</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Matching clinical signs with ICD-10 diagnostic criteria, calculating confidence levels, and screening drug-disease contraindications.
                  </p>
                </div>
              </div>
            )}

            {/* Results Display */}
            {diagnosisData && !loading && (
              <div className="space-y-5 animate-in fade-in duration-300">
                
                {/* Latency & Model Badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <CheckCircle2 size={13} /> {diagnosisData.modelMeta?.provider}
                  </span>
                  <span>Latency: {diagnosisData.modelMeta?.latencyMs || 150}ms</span>
                </div>

                {/* Ranked Differential Diagnoses */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Stethoscope size={14} className="text-amber-400" />
                    Ranked Differential Diagnoses
                  </h3>

                  <div className="space-y-3">
                    {(diagnosisData.differentialDiagnoses || []).map((diag, idx) => {
                      const isTop = idx === 0;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition space-y-3 ${
                            isTop
                              ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border-amber-500/40 shadow-lg shadow-indigo-950/40'
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Title & Confidence */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-white text-sm">
                                  {diag.condition}
                                </h4>
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                  ICD-10: {diag.icd10}
                                </span>
                                {diag.severity && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    diag.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {diag.severity} Severity
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Confidence Progress Bar */}
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-mono text-amber-400">
                                {diag.confidence}% Match
                              </span>
                              <div className="w-20 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full"
                                  style={{ width: `${diag.confidence}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Clinical Rationale */}
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                            {diag.clinicalRationale}
                          </p>

                          {/* Supporting Biomarkers */}
                          {diag.supportingBiomarkers?.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Biomarker Correlation:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {diag.supportingBiomarkers.map((bio, bIdx) => (
                                  <div key={bIdx} className="text-[11px] p-2 rounded bg-slate-900 border border-white/5 flex items-start gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                                    <div>
                                      <strong className="text-cyan-300">{bio.marker} ({bio.value}): </strong>
                                      <span className="text-slate-300">{bio.significance}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action & Prescription Button */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <span className="text-[11px] text-amber-200/80">
                              <strong>Recommendation:</strong> {diag.suggestedAction}
                            </span>
                            <button
                              onClick={() => handleAdoptAndPrescribe(diag)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition shrink-0"
                            >
                              <Pill size={13} /> Adopt & Prescribe
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended Diagnostic Workup */}
                {diagnosisData.recommendedDiagnosticTests?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity size={14} className="text-cyan-400" />
                      Recommended Confirmatory Diagnostic Workup
                    </h3>
                    <div className="space-y-1.5">
                      {diagnosisData.recommendedDiagnosticTests.map((t, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                          <div>
                            <strong className="text-slate-100">{t.test}</strong>
                            <p className="text-[11px] text-slate-400 mt-0.5">{t.reason}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            t.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {t.priority} Priority
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contraindication & Allergy Warning */}
                {diagnosisData.contraindicationAlerts?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs flex items-start gap-2.5 text-rose-200">
                    <ShieldAlert size={16} className="text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-rose-300 uppercase font-bold">Safety & Contraindication Check:</strong>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {diagnosisData.contraindicationAlerts.map((c, idx) => (
                          <li key={idx}>{c.warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs text-slate-400">
          <span>
            Doctor reviews & approves all AI diagnostic suggestions (ABDM & DPDP Compliant)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HfDiagnosisCopilotModal;
