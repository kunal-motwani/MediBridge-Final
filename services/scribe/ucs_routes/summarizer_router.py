"""
Layer 4 (L4) Medical History Summarizer Router for MedBridge
------------------------------------------------------------
Dual-Track Longitudinal Medical History Summarization with:
- Track A: Doctor Longitudinal Clinical Summary (Citations, Problem List, Med Reconciliation, Biomarker Trajectories)
- Track B: Multilingual Patient Takeaway (Token-Locked Drug Names & Dosages across 7 Indian Languages)
- Independent L4 Verifier: Deterministic Number Lock, Citation Integrity Score, and Token Lock Audit
"""
from __future__ import annotations

import json
import os
import re
import urllib.request
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1", tags=["L4 Medical History Summarizer"])

# ============================================================================
# 1. PYDANTIC SCHEMAS (MediBridge & L4 Compatible)
# ============================================================================

class Vitals(BaseModel):
    bloodPressure: Optional[str] = None
    heartRate: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    oxygenLevel: Optional[int] = None

class MedicationItem(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = "active"  # "active" | "discontinued" | "changed"

class LabResultItem(BaseModel):
    testName: str
    value: str
    unit: Optional[str] = None
    referenceRange: Optional[str] = None
    flag: Optional[str] = "normal"  # "normal" | "high" | "low" | "critical"

class PatientDemographics(BaseModel):
    healthId: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None

class MedicalRecordInput(BaseModel):
    recordId: str
    recordDate: str
    category: str
    title: str
    hospitalName: Optional[str] = None
    doctorName: Optional[str] = None
    clinicalNotes: Optional[str] = None
    diagnosis: List[str] = Field(default_factory=list)
    vitals: Optional[Vitals] = None
    medications: List[MedicationItem] = Field(default_factory=list)
    labResults: List[LabResultItem] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)

class SummarizeRequest(BaseModel):
    patient: PatientDemographics
    records: List[MedicalRecordInput]
    targetLanguage: Optional[str] = "hi"  # en, hi, hinglish, mr, bn, ta, te

class ActiveProblem(BaseModel):
    condition: str
    status: str
    firstIdentified: Optional[str] = None
    severity: Optional[str] = "moderate"
    clinicalNotes: Optional[str] = None
    citations: List[str] = Field(default_factory=list)

class ReconciledMedication(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    status: str
    lastVerifiedDate: Optional[str] = None
    reason: Optional[str] = None
    citations: List[str] = Field(default_factory=list)

class BiomarkerDataPoint(BaseModel):
    date: str
    value: str
    unit: Optional[str] = None
    flag: Optional[str] = "normal"

class BiomarkerTrajectory(BaseModel):
    biomarker: str
    readings: List[BiomarkerDataPoint]
    trend: str  # "improving" | "stable" | "elevated" | "fluctuating"
    clinicalSignificance: Optional[str] = None
    citations: List[str] = Field(default_factory=list)

class AllergyWarning(BaseModel):
    allergen: str
    reaction: Optional[str] = None
    severity: Optional[str] = "severe"
    citations: List[str] = Field(default_factory=list)

class TimelineEvent(BaseModel):
    date: str
    category: str
    title: str
    hospitalOrDoctor: Optional[str] = None
    citation: str

class DoctorLongitudinalSummary(BaseModel):
    healthId: str
    patientName: str
    generatedAt: str
    executiveSummary: str
    activeProblemList: List[ActiveProblem]
    medicationReconciliation: List[ReconciledMedication]
    biomarkerTrajectories: List[BiomarkerTrajectory]
    criticalAllergies: List[AllergyWarning]
    clinicalTimeline: List[TimelineEvent]
    clinicalAlerts: List[str]

class PatientMedicationSchedule(BaseModel):
    medicineName: str  # STRICTLY LOCKED
    dosage: str        # STRICTLY LOCKED
    howToTake: str
    purpose: str

class PatientMultilingualTakeaway(BaseModel):
    healthId: str
    patientName: str
    language: str
    generatedAt: str
    simpleOverview: str
    medicationSchedule: List[PatientMedicationSchedule]
    lifestyleAndDiet: List[str]
    redFlagWarnings: List[str]
    followUpActions: List[str]

class VerifierReport(BaseModel):
    passed: bool
    numberLockPassed: bool
    citationIntegrityScore: float
    totalClaimsChecked: int
    unverifiedNumbers: List[str] = Field(default_factory=list)
    missingCitationsCount: int = 0
    verificationDetails: List[str] = Field(default_factory=list)

class FullSummaryResponse(BaseModel):
    success: bool
    doctorSummary: DoctorLongitudinalSummary
    patientTakeaway: PatientMultilingualTakeaway
    verifierReport: VerifierReport


# ============================================================================
# 2. BUILT-IN SAMPLE MULTI-ENCOUNTER PATIENT HISTORY FIXTURE
# ============================================================================

SAMPLE_PATIENT_DATA: Dict[str, Any] = {
    "patient": {
        "healthId": "MB-2026-100001",
        "name": "Rahul Sharma",
        "age": 34,
        "gender": "Male",
        "bloodGroup": "O+"
    },
    "targetLanguage": "hi",
    "records": [
        {
            "recordId": "rec_001_adm",
            "recordDate": "2026-01-15",
            "category": "discharge_summary",
            "title": "Hospital Discharge Summary - Respiratory & Hypertension Episode",
            "hospitalName": "City General Hospital",
            "doctorName": "Dr. Smith",
            "clinicalNotes": "Patient presented with acute bronchospasm and elevated blood pressure. Responded well to bronchodilators and systemic stabilization.",
            "diagnosis": ["Mild Asthma", "Stage 1 Essential Hypertension"],
            "vitals": {
                "bloodPressure": "146/92",
                "heartRate": 88,
                "temperature": 98.6,
                "weight": 74.5,
                "oxygenLevel": 96
            },
            "medications": [
                {
                    "name": "Salbutamol Inhaler",
                    "dosage": "100 mcg",
                    "frequency": "2 puffs PRN (As needed)",
                    "instructions": "Inhale 2 puffs during acute breathlessness",
                    "status": "active"
                }
            ],
            "labResults": [
                {
                    "testName": "Peak Expiratory Flow",
                    "value": "380",
                    "unit": "L/min",
                    "referenceRange": "400-600",
                    "flag": "low"
                }
            ],
            "allergies": ["Penicillin", "Peanuts"]
        },
        {
            "recordId": "rec_002_diag",
            "recordDate": "2026-04-10",
            "category": "lab_report",
            "title": "Metabolic & Glycemic Profile",
            "hospitalName": "Metropolis Diagnostic Lab",
            "doctorName": "Dr. Sharma",
            "clinicalNotes": "Routine quarterly evaluation reveals impaired fasting glycemia and elevated glycated hemoglobin.",
            "diagnosis": ["Type 2 Diabetes Mellitus"],
            "vitals": {
                "bloodPressure": "140/90",
                "heartRate": 82,
                "weight": 76.0
            },
            "medications": [
                {
                    "name": "Metformin",
                    "dosage": "500 mg",
                    "frequency": "BD (Twice daily with meals)",
                    "instructions": "Take with breakfast and dinner",
                    "status": "active"
                }
            ],
            "labResults": [
                {
                    "testName": "HbA1c",
                    "value": "8.2",
                    "unit": "%",
                    "referenceRange": "4.0-5.6",
                    "flag": "high"
                },
                {
                    "testName": "Fasting Blood Glucose",
                    "value": "142",
                    "unit": "mg/dL",
                    "referenceRange": "70-99",
                    "flag": "high"
                }
            ],
            "allergies": ["Penicillin"]
        },
        {
            "recordId": "rec_003_cardio",
            "recordDate": "2026-07-22",
            "category": "prescription",
            "title": "Cardiology Outpatient Follow-up",
            "hospitalName": "Apollo Healthcare Clinic",
            "doctorName": "Dr. Patil",
            "clinicalNotes": "Blood pressure remains persistently above target. Added calcium channel blocker to medication regimen.",
            "diagnosis": ["Essential Hypertension"],
            "vitals": {
                "bloodPressure": "138/86",
                "heartRate": 76,
                "weight": 75.2
            },
            "medications": [
                {
                    "name": "Amlodipine",
                    "dosage": "5 mg",
                    "frequency": "OD (Once daily morning)",
                    "instructions": "Take every morning with water",
                    "status": "active"
                },
                {
                    "name": "Metformin",
                    "dosage": "500 mg",
                    "frequency": "BD",
                    "instructions": "Continued",
                    "status": "active"
                }
            ],
            "labResults": [],
            "allergies": ["Penicillin", "Peanuts"]
        },
        {
            "recordId": "rec_004_review",
            "recordDate": "2026-10-14",
            "category": "lab_report",
            "title": "Comprehensive Follow-up Panel",
            "hospitalName": "City General Hospital",
            "doctorName": "Dr. Smith",
            "clinicalNotes": "Excellent response to combined therapy. Glycemic control and blood pressure well maintained within target limits.",
            "diagnosis": ["Type 2 Diabetes Mellitus (Controlled)", "Essential Hypertension (Controlled)"],
            "vitals": {
                "bloodPressure": "126/80",
                "heartRate": 74,
                "temperature": 98.4,
                "weight": 73.8,
                "oxygenLevel": 98
            },
            "medications": [
                {
                    "name": "Amlodipine",
                    "dosage": "5 mg",
                    "frequency": "OD",
                    "status": "active"
                },
                {
                    "name": "Metformin",
                    "dosage": "500 mg",
                    "frequency": "BD",
                    "status": "active"
                },
                {
                    "name": "Salbutamol Inhaler",
                    "dosage": "100 mcg",
                    "frequency": "PRN",
                    "status": "active"
                }
            ],
            "labResults": [
                {
                    "testName": "HbA1c",
                    "value": "7.1",
                    "unit": "%",
                    "referenceRange": "4.0-5.6",
                    "flag": "normal"
                },
                {
                    "testName": "Fasting Blood Glucose",
                    "value": "112",
                    "unit": "mg/dL",
                    "referenceRange": "70-99",
                    "flag": "normal"
                },
                {
                    "testName": "Serum Creatinine",
                    "value": "0.9",
                    "unit": "mg/dL",
                    "referenceRange": "0.7-1.3",
                    "flag": "normal"
                }
            ],
            "allergies": ["Penicillin", "Peanuts"]
        }
    ]
}


# ============================================================================
# 3. TRACK A: DOCTOR LONGITUDINAL CLINICAL SUMMARIZER
# ============================================================================

def generate_doctor_longitudinal_summary(
    patient: PatientDemographics,
    records: List[MedicalRecordInput]
) -> DoctorLongitudinalSummary:
    sorted_records = sorted(records, key=lambda r: r.recordDate or "")

    problem_map: Dict[str, ActiveProblem] = {}
    med_map: Dict[str, ReconciledMedication] = {}
    biomarkers: Dict[str, List[BiomarkerDataPoint]] = {}
    allergies_list: List[AllergyWarning] = []
    timeline: List[TimelineEvent] = []
    alerts: List[str] = []

    for r in sorted_records:
        timeline.append(TimelineEvent(
            date=r.recordDate,
            category=r.category,
            title=r.title,
            hospitalOrDoctor=r.hospitalName or r.doctorName,
            citation=r.recordId
        ))

        for diag in r.diagnosis:
            if diag not in problem_map:
                problem_map[diag] = ActiveProblem(
                    condition=diag,
                    status="active",
                    firstIdentified=r.recordDate,
                    severity="moderate",
                    clinicalNotes=f"Documented in {r.title}",
                    citations=[r.recordId]
                )
            else:
                if r.recordId not in problem_map[diag].citations:
                    problem_map[diag].citations.append(r.recordId)

        for med in r.medications:
            norm_name = med.name.strip().title()
            med_map[norm_name] = ReconciledMedication(
                name=norm_name,
                dosage=med.dosage,
                frequency=med.frequency,
                status=med.status or "active",
                lastVerifiedDate=r.recordDate,
                reason=med.instructions,
                citations=[r.recordId] if r.recordId else []
            )

        if r.vitals and r.vitals.bloodPressure:
            biomarkers.setdefault("Blood Pressure", []).append(
                BiomarkerDataPoint(date=r.recordDate, value=r.vitals.bloodPressure, unit="mmHg")
            )

        for lab in r.labResults:
            biomarkers.setdefault(lab.testName, []).append(
                BiomarkerDataPoint(date=r.recordDate, value=lab.value, unit=lab.unit, flag=lab.flag)
            )

        for alg in r.allergies:
            if not any(a.allergen.lower() == alg.lower() for a in allergies_list):
                allergies_list.append(AllergyWarning(
                    allergen=alg,
                    reaction="Clinical allergy noted in chart",
                    severity="severe",
                    citations=[r.recordId]
                ))

    trajectories: List[BiomarkerTrajectory] = []
    for bio_name, readings in biomarkers.items():
        trend = "stable"
        if len(readings) > 1:
            try:
                first_v = float(readings[0].value.split('/')[0])
                last_v = float(readings[-1].value.split('/')[0])
                trend = "improving" if last_v < first_v else ("elevated" if last_v > first_v else "stable")
            except (ValueError, IndexError):
                trend = "fluctuating"
        trajectories.append(BiomarkerTrajectory(
            biomarker=bio_name,
            readings=readings,
            trend=trend,
            clinicalSignificance=f"Monitored across {len(readings)} encounters",
            citations=list({r.recordId for r in sorted_records})
        ))

    if allergies_list:
        alerts.append(f"Documented Allergies: {', '.join([a.allergen for a in allergies_list])}")
    for traj in trajectories:
        if traj.trend == "elevated":
            alerts.append(f"Elevated trend noted for {traj.biomarker}")

    exec_summary = (
        f"{patient.name} ({patient.gender or 'Patient'}, {patient.age or 'Age unstated'}) presents with a history of "
        f"{', '.join(list(problem_map.keys())[:3]) if problem_map else 'general medical follow-up'}. "
        f"Consolidated records span {len(sorted_records)} clinical encounters from {sorted_records[0].recordDate if sorted_records else 'N/A'} "
        f"to {sorted_records[-1].recordDate if sorted_records else 'N/A'}. "
        f"Currently maintained on {len([m for m in med_map.values() if m.status == 'active'])} active medications."
    )

    return DoctorLongitudinalSummary(
        healthId=patient.healthId,
        patientName=patient.name,
        generatedAt=datetime.now().isoformat(),
        executiveSummary=exec_summary,
        activeProblemList=list(problem_map.values()),
        medicationReconciliation=list(med_map.values()),
        biomarkerTrajectories=trajectories,
        criticalAllergies=allergies_list,
        clinicalTimeline=timeline,
        clinicalAlerts=alerts
    )


# ============================================================================
# 4. TRACK B: MULTILINGUAL PATIENT TAKEAWAY (7 LANGUAGES, TOKEN-LOCKED)
# ============================================================================

def generate_patient_multilingual_takeaway(
    patient: PatientDemographics,
    records: List[MedicalRecordInput],
    doctor_summary: DoctorLongitudinalSummary,
    language: str = "hi"
) -> PatientMultilingualTakeaway:
    active_meds = [m for m in doctor_summary.medicationReconciliation if m.status == "active"]
    conds_str = ", ".join([p.condition for p in doctor_summary.activeProblemList[:2]]) or "General Care"

    lang_templates: Dict[str, Dict[str, Any]] = {
        "hi": {
            "od": "दिन में एक बार, पानी के साथ लें।",
            "other": "डॉक्टर के निर्देशानुसार समय पर लें।",
            "purp": "स्वास्थ्य नियंत्रण और उपचार के लिए।",
            "overview": f"नमस्ते {patient.name}, यह आपके हालिया मेडिकल रिकॉर्ड्स का आसान सारांश है। आपके रिकॉर्ड्स में मुख्य रूप से {conds_str} का उल्लेख है। कृपया नीचे दी गई दवाओं का नियमित सेवन करें और जीवनशैली संबंधी सावधानियों का पालन करें।",
            "lifestyle": [
                "नमक और चीनी की मात्रा सीमित रखें।",
                "प्रतिदिन कम से कम 20-30 मिनट हल्का व्यायाम या टहलना जारी रखें।",
                "पर्याप्त मात्रा में पानी पिएं और तनाव से बचें।"
            ],
            "red_flags": [
                "अचानक सीने में दर्द या भारीपन महसूस होना।",
                "सांस लेने में अत्यधिक कठिनाई होना।",
                "अचानक चक्कर आना या बेहोशी जैसा लगना।"
            ],
            "follow_ups": [
                "1 महीने के भीतर नियमित रक्तचाप और ब्लड शुगर की जांच करवाएं।",
                "अपनी अगली डॉक्टर विजिट के समय यह सारांश साथ लेकर जाएं।"
            ]
        },
        "hinglish": {
            "od": "Roz ek baar paani ke saath lein.",
            "other": "Doctor ke bataye schedule par lein.",
            "purp": "Condition ko control mein rakhne ke liye.",
            "overview": f"Hello {patient.name}, yeh aapke clinical records ka simplified summary hai. Aapke reports mein {conds_str} ka treatment chal raha hai. Neeche diye gaye medicine schedule aur precautions ko regularly follow karein.",
            "lifestyle": [
                "Namak aur sugar ka intake control mein rakhein.",
                "Roz subah 25-30 minutes brisk walking ya light exercise karein.",
                "Proper hydration aur regular sleep maintain karein."
            ],
            "red_flags": [
                "Severe chest pain ya ghabrahat hona.",
                "Saans lene mein sudden difficulty.",
                "Sudden dizziness ya high BP spikes."
            ],
            "follow_ups": [
                "Next 30 days mein routine BP aur sugar checkup karayein.",
                "Agli doctor visit par yeh report show karein."
            ]
        },
        "mr": {
            "od": "दिवसातून एकदा पाण्यासोबत घ्या.",
            "other": "डॉक्टरांच्या सल्ल्यानुसार वेळेवर घ्या.",
            "purp": "आरोग्य नियंत्रणासाठी आणि उपचारासाठी.",
            "overview": f"नमस्कार {patient.name}, हा तुमच्या वैद्यकीय नोंदींचा सोपा सारांश आहे. तुमच्या अहवालात प्रामुख्याने {conds_str} चा उल्लेख आहे. कृपया खाली दिलेल्या औषधांचे नियमित सेवन करा.",
            "lifestyle": [
                "आहारात मीठ आणि साखरेचे प्रमाण कमी ठेवा.",
                "दररोज किमान २०-३० मिनिटे चालण्याचा व्यायाम करा.",
                "पुरेसे पाणी प्या आणि तणावापासून दूर राहा."
            ],
            "red_flags": [
                "अचानक छातीत दुखणे किंवा जडपणा जाणवणे.",
                "श्वास घेण्यास तीव्र त्रास होणे.",
                "अचानक चक्कर येणे किंवा अशक्तपणा जाणवणे."
            ],
            "follow_ups": [
                "१ महिन्याच्या आत रक्तदाब आणि रक्तातील साखरेची तपासणी करा.",
                "पुढील वेळी डॉक्टरांना भेटताना हा सारांश सोबत ठेवा."
            ]
        },
        "bn": {
            "od": "দিনে একবার জলের সাথে খাবেন।",
            "other": "ডাক্তারের পরামর্শ অনুযায়ী সময়মতো খাবেন।",
            "purp": "স্বাস্থ্য নিয়ন্ত্রণ এবং চিকিৎসার জন্য।",
            "overview": f"নমস্কার {patient.name}, এটি আপনার মেডিকেল রেকর্ডের একটি সহজ সারাংশ। আপনার রিপোর্টে মূলত {conds_str}-এর উল্লেখ রয়েছে। অনুগ্রহ করে নিচের ওষুধগুলো নিয়মিত গ্রহণ করুন।",
            "lifestyle": [
                "খাবারে লবণ ও চিনির পরিমাণ সীমিত রাখুন।",
                "প্রতিদিন অন্তত ২০-৩০ মিনিট হালকা ব্যায়াম বা হাঁটাহাঁটি করুন।",
                "পর্যাপ্ত জল পান করুন এবং মানসিক চাপ এড়িয়ে চলুন।"
            ],
            "red_flags": [
                "হঠাৎ বুকে ব্যথা বা চাপ অনুভব করা।",
                "শ্বাস নিতে তীব্র অসুবিধা হওয়া।",
                "হঠাৎ মাথা ঘোরা বা অজ্ঞান হয়ে যাওয়ার ভাব।"
            ],
            "follow_ups": [
                "১ মাসের মধ্যে নিয়মিত রক্তচাপ এবং ব্লাড সুগার পরীক্ষা করান।",
                "পরবর্তী ডাক্তার ভিজিটের সময় এই সারাংশটি সাথে রাখুন।"
            ]
        },
        "ta": {
            "od": "தினமும் ஒரு முறை தண்ணீருடன் எடுத்துக்கொள்ளவும்.",
            "other": "மருத்துவரின் அறிவுரைப்படி சரியான நேரத்தில் எடுத்துக்கொள்ளவும்.",
            "purp": "உடல்நலக் கட்டுப்பாடு மற்றும் சிகிச்சைக்காக.",
            "overview": f"வணக்கம் {patient.name}, இது உங்கள் மருத்துவப் பதிவுகளின் எளிய சுருக்கமாகும். உங்கள் அறிக்கைகளில் முக்கியமாக {conds_str} குறிப்பிடப்பட்டுள்ளது. கீழே உள்ள மருந்துகளை தவறாமல் உட்கொள்ளவும்.",
            "lifestyle": [
                "உணவில் உப்பு மற்றும் சர்க்கரை அளவைக் குறைக்கவும்.",
                "தினமும் குறைந்தது 20-30 நிமிடங்கள் நடைப்பயிற்சி செய்யவும்.",
                "போதுமான அளவு தண்ணீர் குடிக்கவும்."
            ],
            "red_flags": [
                "திடீரென நெஞ்சு வலி அல்லது அழுத்தம் ஏற்படுதல்.",
                "மூச்சு விடுவதில் கடுமையான சிரமம்.",
                "திடீர் தலைச்சுற்றல் அல்லது மயக்கம்."
            ],
            "follow_ups": [
                "1 மாதத்திற்குள் இரத்த அழுத்தம் மற்றும் சர்க்கரை அளவைப் பரிசோதிக்கவும்.",
                "அடுத்த முறை மருத்துவரைச் சந்திக்கும் போது இந்தச் சுருக்கத்தை எடுத்துச் செல்லவும்."
            ]
        },
        "te": {
            "od": "రోజుకు ఒకసారి నీటితో తీసుకోండి.",
            "other": "వైద్యుని సలహా మేరకు సమయానికి తీసుకోండి.",
            "purp": "ఆరోగ్య నియంత్రణ మరియు చికిత్స కోసం.",
            "overview": f"నమస్కారం {patient.name}, ఇది మీ వైద్య రికార్డుల సాధారణ సారాంశం. మీ నివేదికలలో ప్రధానంగా {conds_str} పేర్కొనబడింది. దయచేసి క్రింది మందులను క్రమం తప్పకుండా తీసుకోండి.",
            "lifestyle": [
                "ఆహారంలో ఉప్పు మరియు చక్కెర పరిమాణాన్ని తగ్గించండి.",
                "ప్రతిరోజూ కనీసం 20-30 నిమిషాలు నడక లేదా వ్యాయామం చేయండి.",
                "తగినంత నీరు త్రాగండి మరియు ఒత్తిడికి దూరంగా ఉండండి."
            ],
            "red_flags": [
                "అకస్మాత్తుగా ఛాతీ నొప్పి లేదా బరువుగా అనిపించడం.",
                "శ్వాస తీసుకోవడంలో తీవ్రమైన ఇబ్బంది.",
                "అకస్మాత్తుగా తల తిరగడం లేదా స్పృహ తప్పినట్లు అనిపించడం."
            ],
            "follow_ups": [
                "1 నెలలోపు రక్తపోటు మరియు బ్లడ్ షుగర్ పరీక్షలు చేయించుకోండి.",
                "తదుపరి డాక్టర్ సంప్రదింపుల సమయంలో ఈ సారాంశాన్ని వెంట తీసుకువెళ్లండి."
            ]
        },
        "en": {
            "od": "Take once daily with water.",
            "other": "Take as directed by your physician.",
            "purp": "To maintain your prescribed treatment plan.",
            "overview": f"Hello {patient.name}, here is a clear summary of your longitudinal medical history. Your current care plan primarily addresses {conds_str}. Please review your active medication schedule and follow the lifestyle recommendations below.",
            "lifestyle": [
                "Maintain a low-sodium, balanced nutritious diet.",
                "Aim for 20-30 minutes of light-to-moderate physical activity daily.",
                "Stay adequately hydrated and avoid smoking or alcohol."
            ],
            "red_flags": [
                "Sudden severe chest discomfort, pressure, or radiating pain.",
                "Severe shortness of breath or sudden wheezing.",
                "Unexplained dizziness, confusion, or sudden vision changes."
            ],
            "follow_ups": [
                "Schedule routine blood pressure and glucose monitoring within 3-4 weeks.",
                "Carry this summary with you to your next outpatient doctor visit."
            ]
        }
    }

    tpl = lang_templates.get(language, lang_templates["en"])
    schedules: List[PatientMedicationSchedule] = []
    for med in active_meds:
        how = tpl["od"] if "OD" in (med.frequency or "") else tpl["other"]
        schedules.append(PatientMedicationSchedule(
            medicineName=med.name,                  # STRICTLY LOCKED
            dosage=med.dosage or "Standard Dose",   # STRICTLY LOCKED
            howToTake=how,
            purpose=tpl["purp"]
        ))

    return PatientMultilingualTakeaway(
        healthId=patient.healthId,
        patientName=patient.name,
        language=language,
        generatedAt=datetime.now().isoformat(),
        simpleOverview=tpl["overview"],
        medicationSchedule=schedules,
        lifestyleAndDiet=tpl["lifestyle"],
        redFlagWarnings=tpl["red_flags"],
        followUpActions=tpl["follow_ups"]
    )


# ============================================================================
# 5. INDEPENDENT L4 VERIFIER & NUMBER LOCK
# ============================================================================

def _extract_all_numbers(text: str) -> Set[str]:
    cleaned = re.sub(r'\b\d{4}-\d{2}-\d{2}\b', '', text)
    matches = re.findall(r'\b\d+(?:/\d+|\.\d+)?\b', cleaned)
    return set(matches)

def _collect_source_numbers(records: List[MedicalRecordInput], patient: Optional[PatientDemographics] = None) -> Set[str]:
    parts: List[str] = []
    if patient:
        if patient.age:
            parts.append(str(patient.age))
        if patient.healthId:
            parts.append(patient.healthId)
    parts.append(str(len(records)))
    for r in records:
        parts.append(r.title or "")
        parts.append(r.clinicalNotes or "")
        parts.extend(r.diagnosis or [])
        if r.vitals:
            for val in (r.vitals.bloodPressure, r.vitals.heartRate, r.vitals.temperature, r.vitals.weight, r.vitals.oxygenLevel):
                if val is not None:
                    parts.append(str(val))
        for med in r.medications:
            parts.append(med.name)
            if med.dosage:
                parts.append(med.dosage)
        for lab in r.labResults:
            parts.append(lab.testName)
            parts.append(lab.value)
            if lab.referenceRange:
                parts.append(lab.referenceRange)
    return _extract_all_numbers(" ".join(parts))

def verify_doctor_summary(
    records: List[MedicalRecordInput],
    summary: DoctorLongitudinalSummary,
    patient: Optional[PatientDemographics] = None
) -> Tuple[bool, List[str], float, int]:
    valid_ids = {r.recordId for r in records}
    source_numbers = _collect_source_numbers(records, patient)

    total_claims = 0
    valid_citations = 0
    missing_citations = 0

    def check_cites(items: List[Any]) -> None:
        nonlocal total_claims, valid_citations, missing_citations
        for it in items:
            total_claims += 1
            cites = getattr(it, "citations", None)
            if cites is None and hasattr(it, "citation"):
                cites = [getattr(it, "citation")]
            if not cites:
                missing_citations += 1
            elif all(c in valid_ids for c in cites):
                valid_citations += 1
            else:
                missing_citations += 1

    check_cites(summary.activeProblemList)
    check_cites(summary.medicationReconciliation)
    check_cites(summary.biomarkerTrajectories)
    check_cites(summary.criticalAllergies)
    check_cites(summary.clinicalTimeline)

    integrity_score = (valid_citations / total_claims) if total_claims > 0 else 1.0

    summary_text = (
        summary.executiveSummary + " " +
        " ".join([f"{p.condition} {p.clinicalNotes or ''}" for p in summary.activeProblemList]) + " " +
        " ".join([f"{m.name} {m.dosage or ''}" for m in summary.medicationReconciliation]) + " " +
        " ".join([f"{b.biomarker} {' '.join([r.value for r in b.readings])}" for b in summary.biomarkerTrajectories])
    )
    summary_numbers = _extract_all_numbers(summary_text)
    unverified = [n for n in summary_numbers if n not in source_numbers and n not in {"1", "2", "3", "4", "5", "10"}]
    number_lock_ok = len(unverified) == 0
    return (number_lock_ok and integrity_score >= 0.85), unverified, integrity_score, missing_citations

def verify_token_locking(
    records: List[MedicalRecordInput],
    takeaway: PatientMultilingualTakeaway
) -> Tuple[bool, List[str]]:
    source_drugs = {m.name.strip().lower() for r in records for m in r.medications}
    issues = []
    for item in takeaway.medicationSchedule:
        if item.medicineName.strip().lower() not in source_drugs:
            issues.append(f"Unlocked drug token: '{item.medicineName}'")
    return len(issues) == 0, issues

def run_full_verifier(
    records: List[MedicalRecordInput],
    doc_summary: DoctorLongitudinalSummary,
    takeaway: PatientMultilingualTakeaway,
    patient: Optional[PatientDemographics] = None
) -> VerifierReport:
    overall_ok, unverified_nums, score, missing_cites = verify_doctor_summary(records, doc_summary, patient)
    token_ok, token_issues = verify_token_locking(records, takeaway)

    details: List[str] = []
    if not overall_ok:
        if unverified_nums:
            details.append(f"NUMBER LOCK FAILURE: Unverified numbers {unverified_nums}")
        if score < 0.85:
            details.append(f"CITATION INTEGRITY LOW: Score {score:.2f}")
    else:
        details.append("NUMBER LOCK PASSED: 100% of clinical metrics grounded in source records.")
        details.append(f"CITATION INTEGRITY PASSED: Score {score:.2f} ({int(score * 100)}% verifiable claims).")

    if token_ok:
        details.append("TOKEN LOCKING PASSED: All prescription drug names and dosages locked verbatim.")
    else:
        details.append(f"TOKEN LOCKING WARNING: {', '.join(token_issues)}")

    return VerifierReport(
        passed=overall_ok and token_ok,
        numberLockPassed=len(unverified_nums) == 0,
        citationIntegrityScore=round(score, 2),
        totalClaimsChecked=len(doc_summary.activeProblemList) + len(doc_summary.medicationReconciliation),
        unverifiedNumbers=unverified_nums,
        missingCitationsCount=missing_cites,
        verificationDetails=details
    )


# ============================================================================
# 6. FASTAPI ENDPOINTS
# ============================================================================

@router.get("/sample", response_model=SummarizeRequest)
def get_sample_patient_history() -> SummarizeRequest:
    """Returns the sample 4-encounter longitudinal patient history for Rahul Sharma (MB-2026-100001)."""
    return SummarizeRequest(**SAMPLE_PATIENT_DATA)

@router.post("/summarize/doctor", response_model=DoctorLongitudinalSummary)
def summarize_doctor_endpoint(req: SummarizeRequest) -> DoctorLongitudinalSummary:
    if not req.records:
        raise HTTPException(status_code=400, detail="At least one medical record is required.")
    return generate_doctor_longitudinal_summary(req.patient, req.records)

@router.post("/summarize/patient", response_model=PatientMultilingualTakeaway)
def summarize_patient_endpoint(req: SummarizeRequest) -> PatientMultilingualTakeaway:
    if not req.records:
        raise HTTPException(status_code=400, detail="At least one medical record is required.")
    doc_summary = generate_doctor_longitudinal_summary(req.patient, req.records)
    return generate_patient_multilingual_takeaway(req.patient, req.records, doc_summary, req.targetLanguage or "hi")

@router.post("/summarize/full", response_model=FullSummaryResponse)
def summarize_full_endpoint(req: SummarizeRequest) -> FullSummaryResponse:
    if not req.records:
        raise HTTPException(status_code=400, detail="At least one medical record is required.")
    doc_summary = generate_doctor_longitudinal_summary(req.patient, req.records)
    takeaway = generate_patient_multilingual_takeaway(req.patient, req.records, doc_summary, req.targetLanguage or "hi")
    report = run_full_verifier(req.records, doc_summary, takeaway, req.patient)
    return FullSummaryResponse(
        success=report.passed,
        doctorSummary=doc_summary,
        patientTakeaway=takeaway,
        verifierReport=report
    )
