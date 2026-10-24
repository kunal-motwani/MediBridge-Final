import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, ArrowLeft, Pill, Sparkles, Check, Stethoscope,
  AlertTriangle, FileText, Activity
} from 'lucide-react';
import HfDiagnosisCopilotModal from '../../components/HfDiagnosisCopilotModal';

const COMMON_DRUG_PRESETS = [
  { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', duration: '90', timing: 'after_meal', indication: 'Type 2 Diabetes' },
  { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', duration: '90', timing: 'morning', indication: 'Hypertension' },
  { name: 'Atorvastatin', dosage: '10 mg', frequency: 'Once daily (Bedtime)', duration: '90', timing: 'bedtime', indication: 'Dyslipidemia / ASCVD' },
  { name: 'Empagliflozin', dosage: '10 mg', frequency: 'Once daily', duration: '90', timing: 'morning', indication: 'T2D + Renal/Cardio' },
  { name: 'Pantoprazole', dosage: '40 mg', frequency: 'Once daily', duration: '30', timing: 'empty_stomach', indication: 'Gastric protection' }
];

const WritePrescription = () => {
  const { healthId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [diagnosis, setDiagnosis] = useState('');
  const [icd10, setIcd10] = useState('');
  const [advice, setAdvice] = useState('Maintain low sodium diet, 30 min daily aerobic walking, monitor fasting blood glucose weekly.');
  const [medicines, setMedicines] = useState([
    { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', duration: '90', instructions: 'After meals' },
    { name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', duration: '90', instructions: 'In the morning' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [showHfCopilot, setShowHfCopilot] = useState(false);

  useEffect(() => {
    const diagParam = searchParams.get('diagnosis');
    const icdParam = searchParams.get('icd10');
    if (diagParam) {
      setDiagnosis(diagParam);
      if (icdParam) setIcd10(icdParam);
      toast.success(`Adopted diagnosis: ${diagParam}`);
    } else {
      setDiagnosis('Type 2 Diabetes Mellitus with Mild Hypertensive Heart Disease');
      setIcd10('E11.65');
    }
  }, [searchParams]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const addPresetMedicine = (preset) => {
    setMedicines([...medicines, {
      name: preset.name,
      dosage: preset.dosage,
      frequency: preset.frequency,
      duration: preset.duration,
      instructions: preset.timing || 'As directed'
    }]);
    toast.success(`Added ${preset.name} ${preset.dosage}`);
  };

  const removeMedicine = (index) => {
    if (medicines.length <= 1) {
      toast.error('Prescription must include at least one medicine');
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (i, field, val) => {
    const newMeds = [...medicines];
    newMeds[i][field] = val;
    setMedicines(newMeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      toast.error('Please specify a clinical diagnosis');
      return;
    }

    try {
      setSubmitting(true);
      await doctorService.writePrescription(healthId, {
        diagnosis: [diagnosis + (icd10 ? ` [${icd10}]` : '')],
        medicines,
        advice,
        hospitalName: 'Apollo Multispecialty Hospital',
        doctorName: 'Dr. Aarav Sharma'
      });
      toast.success('Official digital prescription signed & issued!');
      navigate(`/doctor/patient/${healthId}/records`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(`/doctor/patient/${healthId}/records`)}
            className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Patient Records
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Issue Digital Prescription</h1>
            <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-bold">
              {healthId}
            </span>
          </div>
        </div>

        {/* Hugging Face Copilot Launch Button */}
        <button
          type="button"
          onClick={() => setShowHfCopilot(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-orange-500/20"
        >
          <span className="text-base">🤗</span> HF Diagnostic Copilot
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        {/* Diagnosis & ICD-10 Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope size={18} className="text-blue-600" />
              Clinical Diagnosis & Classification
            </h2>
            <button
              type="button"
              onClick={() => setShowHfCopilot(true)}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
            >
              Suggest with Hugging Face Model →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Primary Diagnosis
              </label>
              <input
                type="text"
                placeholder="e.g. Type 2 Diabetes Mellitus with Hyperglycemia"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-900 bg-slate-50/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                ICD-10 Code
              </label>
              <input
                type="text"
                placeholder="e.g. E11.65"
                value={icd10}
                onChange={(e) => setIcd10(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono font-bold text-slate-800 bg-slate-50/50"
              />
            </div>
          </div>
        </div>

        {/* Quick Medication Templates */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Evidence-Based Quick Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_DRUG_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => addPresetMedicine(p)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-medium transition shadow-xs flex items-center gap-1"
              >
                <Plus size={12} className="text-blue-500" />
                <span>{p.name} {p.dosage}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Medicines List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill size={18} className="text-emerald-600" />
                Prescribed Pharmacotherapy ({medicines.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={addMedicine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((m, i) => (
              <div
                key={i}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3 hover:border-slate-300 transition"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                      Drug Name
                    </label>
                    <input
                      placeholder="e.g. Metformin"
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={m.name}
                      onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                      Dosage
                    </label>
                    <input
                      placeholder="500 mg"
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={m.dosage}
                      onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                      Frequency
                    </label>
                    <input
                      placeholder="Twice daily"
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={m.frequency}
                      onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase mb-0.5 block">
                      Days
                    </label>
                    <input
                      placeholder="90"
                      type="number"
                      className="w-full border border-slate-200 bg-white p-2 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={m.duration}
                      onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                      required
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => removeMedicine(i)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove medicine"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <input
                    placeholder="Instructions / Timing (e.g. Take with or immediately after meals)"
                    className="w-full border border-slate-200/80 bg-white px-3 py-1.5 rounded-lg text-xs text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={m.instructions || ''}
                    onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Advice & Lifestyle Guidance */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Clinical Advice, Dietary Guidelines & Follow-Up Plan
          </label>
          <textarea
            rows={3}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans"
            placeholder="Advice for patient..."
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Digitally signed with Doctor Credentials (ABDM Consent Logged)
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Signing Prescription...' : 'Issue & Sign Prescription'}
          </button>
        </div>
      </form>

      {/* Hugging Face Diagnostic Copilot Modal */}
      <HfDiagnosisCopilotModal
        isOpen={showHfCopilot}
        onClose={() => setShowHfCopilot(false)}
        healthId={healthId}
      />
    </div>
  );
};

export default WritePrescription;
