# 🧭 MediBridge: 4-Minute Judge Demo Walkthrough

This guide provides hackathon judges, evaluators, and reviewers with a step-by-step clickpath to experience every major capability of MediBridge in under 4 minutes.

---

## ⚡ Fast Setup (If Not Already Running)

1. Double-click `start_all.bat` (or run `./start_all.sh` on Mac/Linux).
2. Wait 5 seconds for services to initialize:
   - **Client**: `http://localhost:5173`
   - **Backend**: `http://localhost:5000`
   - **Ambient Scribe**: `http://localhost:8000`
3. Verify all systems with:
   ```bash
   python scripts/verify_platform.py
   ```

---

## 🎬 Step-by-Step Clinical Demo Flow

### Phase 1: Doctor Login & Zero-Trust Patient Access (1 Minute)
1. Open your browser and navigate to: **[http://localhost:5173/login](http://localhost:5173/login)**
2. Sign in with Doctor Credentials:
   - **Email**: `doctor@demo.com`
   - **Password**: `password123`
3. Click **"Find Patient"** on the left sidebar.
4. Click the prominent green card: **"Select Demo Patient: Rahul Sharma (MB-2026-487139, PIN: 1234)"**.
5. Observe how Dr. Sharma is immediately granted access to Rahul's authorized clinical vault without friction.

---

### Phase 2: Grok AI Medical Summarizer (1 Minute)
1. You are now on Rahul Sharma's records page: `http://localhost:5173/doctor/patient/MB-2026-487139/records`.
2. Notice the **Grok AI Clinical Summarizer** card at the top:
   - **Executive Clinical Trajectory**: Read the 2-sentence clinical summary of Rahul's diabetes and hypertension control.
   - Click the **"Prescriptions & Medicines"** tab: View active medications (*Metformin 500mg*, *Amlodipine 5mg*) and historical courses (*Azithromycin 500mg* from prior bronchitis).
   - Click the **"Lab Reports & Trends"** tab: Inspect the structured metrics (*HbA1c: 7.1% Improved*, *Cholesterol 185 Normal*, *Echocardiogram Concentric LVH*).
   - Click the **"Allergies & Safety"** tab: Notice the bold red warning: `CRITICAL: Documented Penicillin Allergy`.
   - Click **"Copy Summary"**: The complete clinical synthesis is copied to your clipboard ready for EHR notes!

---

### Phase 3: Hugging Face Clinical Diagnostic Copilot & Prescription (1 Minute)
1. In the top action bar of the records page, click the orange button: **"🤗 HF Diagnostic Copilot"**.
2. A clinical decision support modal appears:
   - Notice Rahul's chronic conditions, lab values, and allergies are **automatically correlated**.
   - Under presenting symptoms, click the symptom chips:
     - `Increased Thirst (Polydipsia)`
     - `Frequent Urination (Nocturia)`
     - `Blurred Vision`
     - `Morning Dizziness`
   - Click **"🤗 Run Hugging Face Diagnostic Analysis"**.
3. In under 2 seconds, `Bio_ClinicalBERT` renders:
   - **Top Differential Diagnosis**: *Uncontrolled Type 2 Diabetes Mellitus with Osmotic Diuresis* (`ICD-10: E11.9`) with a **95% Match bar**.
   - **Biomarker Correlation**: Shows how HbA1c 7.1% and concentric LVH directly justify the finding.
   - **Confirmatory Workup**: Recommends *7-Day CGM* and *24h Ambulatory BP Monitoring*.
4. Click the green button: **"Adopt & Prescribe"** on the top diagnosis.
5. You are redirected to **Issue Digital Prescription** with the diagnosis and ICD-10 code automatically pre-filled!
6. Click the quick drug preset **"+ Atorvastatin 10 mg"** and click **"Issue & Sign Prescription"**.

---

### Phase 4: Ambient AI Scribe (45 Seconds)
1. From the sidebar or records page, click **"AI Clinical Scribe"**.
2. Click **"Start Voice Dictation"** to test live Groq Whisper Large-v3 speech-to-text.
3. Speak into your microphone (e.g. *"Patient reports elevated blood sugars after dinner, blood pressure is 134 over 86"*).
4. Watch the sub-second transcript stream in real time and populate the clinical encounter!

---

### Phase 5: Patient Privacy & Emergency QR (30 Seconds)
1. Log out from the top right user menu.
2. Sign in with Patient Credentials:
   - **Email**: `patient@demo.com`
   - **Password**: `password123`
3. Click **"Medical Records"** on the sidebar:
   - Click **"✨ Grok AI Summary"** to see how the patient views their own plain-English health explanation.
   - Click the privacy badge on any record to toggle between `Standard`, `Sensitive`, or `Masked`.
4. Click **"Emergency Profile"** on the sidebar:
   - View the scannable **Life-Saving Emergency QR Code** displaying blood group (O+), severe Penicillin allergy, and emergency contacts for first responders!

---

### Summary Checklist for Judges

- [x] Zero-Trust Consent gating works flawlessly without random ID lockouts.
- [x] Grok AI parses prescriptions, medicines taken, and lab trends in ~2 seconds.
- [x] Hugging Face Copilot correlates symptoms with lab findings and ICD-10 codes.
- [x] 1-Click diagnostic adoption smoothly populates digital prescriptions.
- [x] Groq Whisper Large-v3 transcribes consultation speech in sub-second latency.
- [x] Patient maintains complete ABDM/DPDP control over data masking and emergency QR.
