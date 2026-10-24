import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorService } from '../../services/doctorService';
import FileUpload from '../../components/ui/FileUpload';
import { Mic, Square, Sparkles, ArrowLeft, Stethoscope, Upload, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const SCRIBE_BASE_URL = 'http://localhost:8000';

const AddRecord = () => {
  const { healthId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'General', 
    clinicalNotes: '' 
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Voice Transcribe states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      toast.success('Voice dictation started. Speak clinical notes clearly...');
    } catch (err) {
      toast.error('Could not access microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleAudioFileUpload = async (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    await transcribeAudio(uploadedFile);
  };

  const transcribeAudio = async (blob) => {
    setTranscribing(true);
    const toastId = toast.loading('Transcribing via Groq Whisper Large-v3...');
    try {
      // 1. Create Scribe session
      const sRes = await fetch(`${SCRIBE_BASE_URL}/api/session`, { method: 'POST' });
      if (!sRes.ok) throw new Error('Scribe server on port 8000 is not reachable.');
      const sData = await sRes.json();
      const sid = sData.id;

      // 2. Give consent
      await fetch(`${SCRIBE_BASE_URL}/api/session/${sid}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent: true })
      });

      // 3. Upload audio
      const form = new FormData();
      form.append('file', blob, 'dictation.webm');
      const upRes = await fetch(`${SCRIBE_BASE_URL}/api/session/${sid}/audio`, {
        method: 'POST',
        body: form
      });
      if (!upRes.ok) throw new Error('Audio upload failed.');

      // 4. Run pipeline
      const runRes = await fetch(`${SCRIBE_BASE_URL}/api/session/${sid}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      if (!runRes.ok) throw new Error('Pipeline trigger failed.');

      // 5. Poll for completion
      let transcribedText = '';
      for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const st = await (await fetch(`${SCRIBE_BASE_URL}/api/session/${sid}/status`)).json();
        if (st.state === 'done') {
          const rv = await (await fetch(`${SCRIBE_BASE_URL}/api/session/${sid}/review`)).json();
          // Extract sentences or words
          if (rv.sentences && rv.sentences.length > 0) {
            transcribedText = rv.sentences.map(s => s.text).join(' ');
          } else if (rv.words && rv.words.length > 0) {
            transcribedText = rv.words.map(w => w.text).join(' ');
          }
          break;
        } else if (st.state === 'error') {
          throw new Error(st.error || 'Transcription failed.');
        }
      }

      if (transcribedText) {
        setFormData(prev => ({
          ...prev,
          clinicalNotes: prev.clinicalNotes 
            ? `${prev.clinicalNotes}\n\n${transcribedText}` 
            : transcribedText,
          title: prev.title || 'Voice Consultation Record'
        }));
        toast.success('Clinical dictation transcribed successfully!', { id: toastId });
      } else {
        toast.error('No speech detected in audio.', { id: toastId });
      }
    } catch (err) {
      console.error('Transcription error:', err);
      toast.error('Transcription error: ' + err.message, { id: toastId });
    } finally {
      setTranscribing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (file) data.append('file', file);
    try {
      await doctorService.addRecord(healthId, data);
      toast.success('Record added successfully');
      navigate(`/doctor/patient/${healthId}/records`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back button & Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/doctor/patient/${healthId}/records`)}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Patient Records
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Add Patient Medical Record</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Health ID: <span className="font-mono font-bold text-slate-700">{healthId}</span>
            </p>
          </div>

          <Link
            to={`/doctor/patient/${healthId}/scribe`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Open Ambient Scribe Studio</span>
          </Link>
        </div>
      </div>

      {/* Scribe Studio Info Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200/80 p-4 rounded-2xl flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-teal-900">Need automatic bilingual SOAP notes with quotes?</h4>
            <p className="text-xs text-teal-700 mt-0.5">
              Use MediBridge Ambient Scribe for multi-speaker recognition, evidence badges, and 7 Indic language translations.
            </p>
          </div>
        </div>
        <Link
          to={`/doctor/patient/${healthId}/scribe`}
          className="shrink-0 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition"
        >
          Try Scribe
        </Link>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div>
          <label className="block mb-1.5 text-sm font-bold text-slate-700">Record Title</label>
          <input
            type="text"
            className="w-full border border-slate-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g., Cardiology Follow-up, Chest Examination"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-slate-700">Category</label>
            <select
              className="w-full border border-slate-300 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="General">General Consultation</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Lab Reports">Lab Reports</option>
              <option value="Prescription">Prescription & Plan</option>
              <option value="Discharge Summary">Discharge Summary</option>
            </select>
          </div>
        </div>

        {/* AI Voice Transcriber Module */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Groq Whisper Large-v3 Voice Transcribe
            </span>
            {isRecording && (
              <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                REC {formatTimer(recordingSeconds)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                disabled={transcribing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                <Mic size={15} /> Dictate Clinical Notes
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
              >
                <Square size={14} className="text-rose-400 fill-rose-400" /> Stop & Transcribe
              </button>
            )}

            <label className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition">
              <Upload size={14} className="text-slate-500" />
              <span>Transcribe Audio File</span>
              <input
                type="file"
                className="hidden"
                accept="audio/*,.wav,.mp3,.webm,.m4a"
                onChange={handleAudioFileUpload}
                disabled={isRecording || transcribing}
              />
            </label>

            {transcribing && (
              <span className="text-xs font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                Processing speech via Groq Whisper...
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-bold text-slate-700">Clinical Notes</label>
            <span className="text-xs text-slate-400">Type or dictate using microphone above</span>
          </div>
          <textarea
            className="w-full border border-slate-300 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-sans leading-relaxed"
            rows="6"
            placeholder="Document symptoms, examination vitals, diagnosis, and treatment recommendations..."
            value={formData.clinicalNotes}
            onChange={e => setFormData({ ...formData, clinicalNotes: e.target.value })}
            required
          ></textarea>
        </div>

        <div>
          <label className="block mb-1.5 text-sm font-bold text-slate-700">Attach Supporting File (Optional)</label>
          <FileUpload onFileSelect={setFile} selectedFile={file} />
        </div>

        <button
          type="submit"
          disabled={submitting || isRecording || transcribing}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-sm shadow-md transition"
        >
          {submitting ? 'Saving Patient Record...' : 'Save Patient Record'}
        </button>
      </form>
    </div>
  );
};

export default AddRecord;
