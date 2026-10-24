# 🏛️ MediBridge: Technical Architecture Specification

> **ABDM & DPDP Compliant Zero-Trust Health Data Exchange, Ambient Scribe & Diagnostic Copilot**

---

## 1. System Overview

MediBridge is designed as a modular, privacy-preserving healthcare operating platform. It aligns with the **Ayushman Bharat Digital Mission (ABDM)** specification for Health Information Users (HIU) and Health Information Providers (HIP), as well as India's **Digital Personal Data Protection Act (DPDP 2023)**.

```
+-------------------------------------------------------------------------+
|                         CLIENT PRESENTATION TIER                        |
|                                                                         |
|  [Doctor Portal]           [Patient Health Vault]     [Ambient Scribe]  |
|  - Patient Search          - ABDM Health ID           - Whisper Voice   |
|  - Grok AI Summarizer      - Granular Consent Matrix  - Indic Diarizer  |
|  - HF Diagnostic Copilot   - Emergency Public QR      - SOAP Note Gen   |
|  - Digital Prescription    - Medical Crowdfunding     - Safety Locks    |
+------------------------------------+------------------------------------+
                                     │
                     REST API & Bearer JWT Sessions
                                     ▼
+-------------------------------------------------------------------------+
|                         APPLICATION GATEWAY TIER                        |
|                                                                         |
|  - Helmet Security Headers         - Cookie Parser & CORS               |
|  - Express 4.x Microservices       - Global ApiError Handler            |
+------------------------------------+------------------------------------+
                                     │
                                     ▼
+-------------------------------------------------------------------------+
|                       ZERO-TRUST CONSENT GATEWAY                        |
|                                                                         |
|  - accessMiddleware (Enforces Patient Consent Policies)                 |
|  - Granular Masking Filter (Standard, Sensitive, Confidential, Masked)  |
|  - 4-Digit Master PIN Challenge & 30-Day TTL Session Enforcement        |
+------------------------------------+------------------------------------+
                                     │
          ┌──────────────────────────┴──────────────────────────┐
          ▼                                                     ▼
+----------------------------------+  +----------------------------------+
|      CLINICAL AI & ML ENGINES    |  |     PERSISTENCE & DATA STORAGE   |
|                                  |  |                                  |
| 1. Grok / Groq Fast Summarizer   |  | 1. In-Memory MongoDB Engine      |
|    - openai/gpt-oss-120b         |  |    - Zero-setup local boot       |
|    - qwen/qwen3.8-27b            |  |    - Persistent MongoDB URI opt  |
| 2. Hugging Face Copilot          |  | 2. Document & Image Storage      |
|    - Bio_ClinicalBERT            |  |    - Cloudinary Authenticated    |
|    - ICD-10 Classification Engine|  |    - Local Diagnostic Fallback   |
| 3. Ambient Scribe Pipeline       |  | 3. Tamper-Proof Audit Logging    |
|    - Groq Whisper Large-v3       |  |    - AccessLog tracking          |
|    - Indic Language Token Lock   |  |    - ConsentGrant state history  |
+----------------------------------+  +----------------------------------+
```

---

## 2. Zero-Trust Consent State Machine

Under DPDP 2023 and ABDM standards, health data cannot be shared without explicit patient consent.

### Consent Lifecycle
1. **Consent Initialization**: Doctor requests patient access via their universal Health ID (`MB-2026-487139`).
2. **Patient Authentication**: Patient enters their 4-digit Master PIN (`1234`) or grants consent via the patient dashboard.
3. **Session Provisioning**: A cryptographically signed `AccessSession` document is stored with:
   - `doctorId`: MongoDB ObjectId of the authenticated physician.
   - `patientId`: MongoDB ObjectId of the consenting patient.
   - `scopeType`: `all` vs `selective` (allowed categories: lab_report, imaging, discharge_summary).
   - `excludeSensitive`: Boolean flag withholding psychiatric or strictly confidential files.
   - `expiresAt`: 30-day Time-To-Live (TTL).
4. **Dynamic Query Enforcement**: When `GET /api/v1/doctors/patients/:healthId/records` is queried, `accessMiddleware` injects privacy constraints directly into the MongoDB query:
   ```javascript
   const query = { userId: patient._id };
   if (session.scopeType === 'selective') {
     query.category = { $in: session.allowedCategories };
   }
   if (session.excludeSensitive) {
     query.sensitivity = { $nin: ['sensitive', 'strictly_confidential'] };
     query.isMaskedByPatient = { $ne: true };
   }
   ```
5. **Instant Revocation**: At any time, the patient can revoke consent from `/access-log`, terminating the session immediately.

---

## 3. Dual-Tier Clinical Artificial Intelligence

### Tier A: Grok / Groq Fast AI Clinical Summarizer
- **Purpose**: Digest voluminous EHR histories (prescriptions, discharge summaries, lab tests) into an actionable executive summary in under 2 seconds.
- **Service**: [`server/src/services/aiSummarizerService.js`](file:///C:/Users/DELL/Downloads/city%20aiiii/MediBridge-Final/server/src/services/aiSummarizerService.js)
- **Model Execution**:
  - Primary: `openai/gpt-oss-120b` on Groq Cloud Inference (~250 tokens/sec).
  - Secondary: `qwen/qwen3.8-27b` fast fallback.
  - Offline Engine: Deterministic clinical rule extractor mapping drug timings, lab baseline changes, and Penicillin allergy contraindications.

### Tier B: Hugging Face Clinical Diagnostic Decision Support
- **Purpose**: Correlate presenting complaints with abnormal biomarkers to calculate differential diagnoses.
- **Service**: [`server/src/services/hfDiagnosticService.js`](file:///C:/Users/DELL/Downloads/city%20aiiii/MediBridge-Final/server/src/services/hfDiagnosticService.js)
- **Model Pipeline**:
  - Model: `emilyalsentzer/Bio_ClinicalBERT` / Open-Weights Medical LLM.
  - Ontological Mapping: Maps natural language conditions to official **ICD-10 codes** (e.g. `E11.9`, `I11.9`, `E78.2`).
  - Output Structure: Differential diagnoses ranked by confidence match bar (50% to 98%), supporting biomarker alignment, and recommended diagnostic workups.

### Tier C: Ambient Clinical Scribe
- **Service**: [`services/scribe/app.py`](file:///C:/Users/DELL/Downloads/city%20aiiii/MediBridge-Final/services/scribe/app.py) (FastAPI on Port 8000).
- **Speech-to-Text**: Groq Cloud `whisper-large-v3` (<1s transcription latency).
- **Indic Language Diarization**: Supports English, Hindi, Hinglish, Marathi, Bengali, Tamil, Telugu with exact token-locking on drug dosages and numeric vitals to eliminate hallucination risk.

---

## 4. API Endpoints Specification

### Authentication & Consent
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | JWT Authentication (Doctor & Patient) |
| `GET` | `/api/v1/health` | Service health status check |
| `POST` | `/api/v1/doctors/patients/access` | Verify patient PIN & activate AccessSession |
| `GET` | `/api/v1/doctors/patients/:healthId/session-status` | Check consent validity |

### Clinical Records & AI Intelligence
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/doctors/patients/:healthId/records` | Fetch zero-trust filtered medical records |
| `GET` | `/api/v1/doctors/patients/:healthId/ai-summary` | Generate Grok clinical history summary |
| `POST` | `/api/v1/doctors/patients/:healthId/suggest-diagnosis` | Run Hugging Face Diagnostic Copilot |
| `GET` | `/api/v1/doctors/patients/:healthId/prescriptions` | Retrieve previous prescriptions |
| `POST` | `/api/v1/doctors/patients/:healthId/prescriptions` | Issue digitally signed prescription |
| `GET` | `/api/v1/records/ai-summary` | Patient's own health & lab summary |

---

## 5. Security & Threat Modeling

1. **Authentication**: Signed HTTP-only cookies and Bearer tokens utilizing dual-secret JWT rotation.
2. **Data Minimization**: In compliant mode, file URLs and cloud public IDs are stripped from API responses unless a specific authenticated file download token is verified.
3. **Penicillin & Adverse Drug Reaction Safety**: Documented allergies in the patient's Emergency Profile trigger hard validation warnings in both the prescription writer and the diagnostic copilot, preventing inadvertent beta-lactam prescription.
4. **Draw.io Architectural Diagram**: View the complete interactive schema in [`docs/medibridge_flowchart.drawio`](file:///C:/Users/DELL/Downloads/city%20aiiii/MediBridge-Final/docs/medibridge_flowchart.drawio).
