import React, { useState, useEffect } from 'react';
import {
  Sparkles, Pill, Activity, ShieldAlert, CheckCircle2, AlertTriangle,
  RefreshCw, Copy, ChevronDown, ChevronUp, FileText, Heart, Clock,
  Stethoscope, User, HelpCircle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const GrokMedicalSummaryCard = ({ summaryData, onRefresh, loading, healthId }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'meds' | 'labs' | 'safety' | 'patient'
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    if (!summaryData) return;
    const textToCopy = `=== MEDIBRIDGE GROK CLINICAL SUMMARY ===
Patient Health ID: ${healthId || 'N/A'}
Generated: ${new Date(summaryData.meta?.generatedAt || Date.now()).toLocaleString()}
Model: ${summaryData.meta?.model || 'Grok / Groq Fast AI'}

EXECUTIVE SUMMARY:
${summaryData.executiveSummary || 'N/A'}

ACTIVE MEDICATIONS & PRESCRIPTIONS:
${(summaryData.medicationsSummary?.active || []).map(m => `- ${m.name} ${m.dose || ''}: ${m.frequency || ''} (${m.indication || ''}) - ${m.instructions || ''}`).join('\n')}

PAST MEDICINES:
${(summaryData.medicationsSummary?.past || []).map(m => `- ${m.name} ${m.dose || ''} for ${m.indication || ''} [${m.status || 'Past'}]`).join('\n')}

KEY LAB FINDINGS:
${(summaryData.labReportsAnalysis || []).map(l => `- ${l.test}: ${l.value} (${l.status}) -> ${l.insight}`).join('\n')}

SAFETY & ALLERGIES:
Allergies: ${(summaryData.safetyAlerts?.allergies || []).join(', ')}
Interactions: ${(summaryData.safetyAlerts?.drugInteractions || []).map(i => `${(i.drugs || []).join(' + ')}: ${i.interaction}`).join('; ')}

DOCTOR RECOMMENDATIONS:
${Array.isArray(summaryData.doctorRecommendations) ? summaryData.doctorRecommendations.join('\n') : summaryData.doctorRecommendations || 'N/A'}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Clinical summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('normal') || s.includes('optimal') || s.includes('preserved')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (s.includes('improved')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (s.includes('borderline') || s.includes('slightly') || s.includes('attention')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-2xl shadow-xl border border-indigo-500/20 text-white overflow-hidden transition-all duration-300">
      {/* Top AI Header */}
      <div className="p-5 sm:p-6 border-b border-indigo-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Grok AI Clinical Summarizer
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                {summaryData?.meta?.model || 'Grok / Groq L4'}
              </span>
            </div>
            <p className="text-xs text-indigo-200/70 mt-0.5">
              Automated synthesis of previous prescriptions, laboratory panels & medication regimens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {summaryData && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition border border-white/10"
              title="Copy clinical summary to clipboard"
            >
              <Copy size={13} />
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-900/40 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analyzing...' : (summaryData ? 'Re-Analyze' : 'Generate Summary')}
          </button>

          {summaryData && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
              title={collapsed ? 'Expand Summary' : 'Collapse Summary'}
            >
              {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">Synthesizing Patient Medical History...</h3>
            <p className="text-xs text-indigo-200/60 max-w-md mx-auto mt-1">
              Grok is correlating lab reports, parsing past prescriptions, cross-referencing documented allergies, and calculating drug interactions.
            </p>
          </div>
        </div>
      )}

      {/* Initial Empty Callout */}
      {!summaryData && !loading && (
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/40 border border-indigo-700/30 flex items-center justify-center mx-auto mb-3 text-cyan-300">
            <Stethoscope size={24} />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No AI Summary Generated Yet</h3>
          <p className="text-xs text-indigo-200/70 max-w-lg mx-auto mb-4">
            Click <strong>"Generate Summary"</strong> to run Grok against the patient's prescriptions, lab panels, and hospital discharge notes.
          </p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition"
          >
            <Sparkles size={14} /> Generate Grok Clinical Synthesis
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {summaryData && !loading && !collapsed && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Executive Overview Card */}
          <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/30 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-cyan-300 mt-0.5 shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                  Executive Clinical Trajectory
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">
                  {summaryData.executiveSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Complete Overview', icon: FileText },
              { id: 'meds', label: 'Prescriptions & Medicines', icon: Pill },
              { id: 'labs', label: 'Lab Reports & Trends', icon: Activity },
              { id: 'safety', label: 'Allergies & Safety', icon: ShieldAlert },
              { id: 'patient', label: 'Plain Language Explanation', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: MEDICATIONS & PRESCRIPTIONS */}
          {(activeTab === 'all' || activeTab === 'meds') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pill size={16} className="text-emerald-400" />
                  Prescriptions & Medication Regimens
                </h3>
                <span className="text-[11px] text-slate-400">
                  {summaryData.medicationsSummary?.active?.length || 0} Active • {summaryData.medicationsSummary?.past?.length || 0} Historical
                </span>
              </div>

              {/* Active Medicines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(summaryData.medicationsSummary?.active || []).map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{med.name}</h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {med.dose || med.dosage}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400/90 font-medium mt-0.5">
                          Indication: {med.indication}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1 bg-slate-950/40 p-2 rounded-lg border border-white/5">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Schedule:</span>
                        <strong className="text-slate-200">{med.frequency}</strong>
                      </div>
                      {med.instructions && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Timing:</span>
                          <span className="text-slate-200 italic">{med.instructions}</span>
                        </div>
                      )}
                      {med.duration && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Course:</span>
                          <span className="text-slate-200">{med.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Past / Discontinued Medicines */}
              {summaryData.medicationsSummary?.past?.length > 0 && (
                <div className="bg-slate-900/50 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Previous / Completed Courses
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summaryData.medicationsSummary.past.map((past, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-200">{past.name} {past.dose}</strong>
                          <p className="text-[11px] text-slate-400">{past.indication}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {past.status || 'Completed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adherence notes */}
              {summaryData.medicationsSummary?.adherenceNotes && (
                <p className="text-xs text-indigo-300/80 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/40 flex items-center gap-2">
                  <Clock size={13} className="shrink-0 text-cyan-400" />
                  <span><strong>Adherence Guidance:</strong> {summaryData.medicationsSummary.adherenceNotes}</span>
                </p>
              )}
            </div>
          )}

          {/* TAB 2: LAB REPORTS & BIOMARKERS */}
          {(activeTab === 'all' || activeTab === 'labs') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  Diagnostic Labs & Biomarker Analysis
                </h3>
                <span className="text-[11px] text-slate-400">
                  {summaryData.labReportsAnalysis?.length || 0} Parameters Monitored
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(summaryData.labReportsAnalysis || []).map((lab, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{lab.test}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getStatusBadge(lab.status)}`}>
                        {lab.status}
                      </span>
                    </div>

                    <div className="text-lg font-black text-white font-mono tracking-tight">
                      {lab.value}
                    </div>

                    <p className="text-[11px] text-slate-300 leading-snug">
                      {lab.insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SAFETY, ALLERGIES & DRUG INTERACTIONS */}
          {(activeTab === 'all' || activeTab === 'safety') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-400" />
                  Clinical Safety, Allergies & Drug Interactions
                </h3>
              </div>

              {/* Allergy Alert Banner */}
              {summaryData.safetyAlerts?.allergies?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 mt-0.5 shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Critical Allergy Warnings
                    </h4>
                    <ul className="text-xs text-rose-100 mt-1 space-y-1 list-disc list-inside">
                      {summaryData.safetyAlerts.allergies.map((allergy, idx) => (
                        <li key={idx} className="font-semibold">{allergy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Drug-Drug Interactions */}
              {summaryData.safetyAlerts?.drugInteractions?.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Pharmacological Interaction Assessment
                  </h4>
                  <div className="space-y-2">
                    {summaryData.safetyAlerts.drugInteractions.map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-cyan-300">{(item.drugs || []).join(' + ')}</strong>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.interaction}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.severity === 'High' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.severity || 'Low'} Risk
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DOCTOR CLINICAL RECOMMENDATIONS */}
          {(activeTab === 'all' || activeTab === 'labs') && summaryData.doctorRecommendations && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300">
                <Stethoscope size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Attending Physician Action Items
                </h4>
              </div>
              <div className="text-xs text-slate-200 leading-relaxed font-sans">
                {Array.isArray(summaryData.doctorRecommendations) ? (
                  <ul className="list-disc list-inside space-y-1">
                    {summaryData.doctorRecommendations.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{summaryData.doctorRecommendations}</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PATIENT-FRIENDLY PLAIN LANGUAGE EXPLANATION */}
          {(activeTab === 'all' || activeTab === 'patient') && summaryData.patientPlainLanguage && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300">
                <Heart size={16} />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Plain-Language Patient Overview
                </h4>
              </div>
              <p className="text-xs text-emerald-100/90 leading-relaxed italic">
                "{summaryData.patientPlainLanguage}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GrokMedicalSummaryCard;
