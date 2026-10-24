#!/usr/bin/env python3
"""
MediBridge 2.0 - Automated End-to-End Platform Verification Suite
Used by hackathon judges and evaluators to test all microservices in seconds.
"""

import sys
import time
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on all systems
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BACKEND_URL = "http://localhost:5000/api/v1"
CLIENT_URL = "http://localhost:5173"
SCRIBE_URL = "http://localhost:8000"

DEMO_DOCTOR = {"email": "doctor@demo.com", "password": "password123"}
DEMO_PATIENT_ID = "MB-2026-487139"

results = []

def record_test(name, passed, details=""):
    results.append({"name": name, "passed": passed, "details": details})
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"[{status}] {name}")
    if details:
        print(f"        {details}")

def test_service_reachability(url, name):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MediBridge-Tester"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            record_test(f"{name} Online Check", resp.status in [200, 304, 404], f"Status: {resp.status} on {url}")
            return True
    except Exception as e:
        record_test(f"{name} Online Check", False, f"Could not reach {url}: {str(e)[:60]}")
        return False

def test_doctor_login_and_records():
    token = None
    try:
        data = json.dumps(DEMO_DOCTOR).encode("utf-8")
        req = urllib.request.Request(f"{BACKEND_URL}/auth/login", headers={"Content-Type": "application/json"}, data=data)
        with urllib.request.urlopen(req, timeout=5) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            token = res.get("data", {}).get("accessToken") or res.get("data", {}).get("token")
            record_test("Doctor Authentication", True, "Successfully logged in as doctor@demo.com")
    except Exception as e:
        record_test("Doctor Authentication", False, str(e))
        return None

    try:
        rec_req = urllib.request.Request(
            f"{BACKEND_URL}/doctors/patients/{DEMO_PATIENT_ID}/records",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(rec_req, timeout=5) as resp:
            rec_res = json.loads(resp.read().decode("utf-8"))
            records = rec_res.get("data", [])
            record_test(
                "Zero-Trust Patient Records Access",
                len(records) > 0,
                f"Retrieved {len(records)} medical records for {DEMO_PATIENT_ID} without 403 blocks"
            )
    except Exception as e:
        record_test("Zero-Trust Patient Records Access", False, str(e))

    return token

def test_grok_ai_summary(token):
    if not token:
        record_test("Grok Clinical Summarizer", False, "Skipped due to missing token")
        return

    try:
        start = time.time()
        req = urllib.request.Request(
            f"{BACKEND_URL}/doctors/patients/{DEMO_PATIENT_ID}/ai-summary",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8")).get("data", {})
            latency = int((time.time() - start) * 1000)
            has_summary = bool(data.get("executiveSummary"))
            meds_count = len(data.get("medicationsSummary", {}).get("active", []))
            record_test(
                "Grok / Groq Fast AI Clinical Summarizer",
                has_summary and meds_count > 0,
                f"Model: {data.get('meta', {}).get('model', 'Groq L4')} | {meds_count} active medications | Latency: {latency}ms"
            )
    except Exception as e:
        record_test("Grok / Groq Fast AI Clinical Summarizer", False, str(e))

def test_hf_diagnostic_copilot(token):
    if not token:
        record_test("Hugging Face Diagnostic Copilot", False, "Skipped due to missing token")
        return

    try:
        start = time.time()
        payload = json.dumps({
            "symptoms": "Polydipsia, polyuria, blurred vision, morning dizziness",
            "customNotes": "Sedentary lifestyle and stress"
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{BACKEND_URL}/doctors/patients/{DEMO_PATIENT_ID}/suggest-diagnosis",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            data=payload
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8")).get("data", {})
            latency = int((time.time() - start) * 1000)
            diagnoses = data.get("differentialDiagnoses", [])
            has_diag = len(diagnoses) > 0
            top_diag = diagnoses[0].get("condition", "N/A") if has_diag else "None"
            confidence = diagnoses[0].get("confidence", 0) if has_diag else 0
            record_test(
                "Hugging Face Clinical Diagnostic Copilot",
                has_diag,
                f"Model: {data.get('modelMeta', {}).get('model', 'Bio_ClinicalBERT')} | Top: {top_diag} ({confidence}% Match) | Latency: {latency}ms"
            )
    except Exception as e:
        record_test("Hugging Face Clinical Diagnostic Copilot", False, str(e))

def main():
    print("=" * 70)
    print("   MEDIBRIDGE 2.0 - AUTOMATED HACKATHON VERIFICATION SUITE")
    print("=" * 70)
    print()

    # 1. Services Reachability
    test_service_reachability(CLIENT_URL, "Vite Frontend (Port 5173)")
    test_service_reachability(f"{BACKEND_URL}/health", "Node.js Backend (Port 5000)")
    test_service_reachability(SCRIBE_URL, "FastAPI Ambient Scribe (Port 8000)")
    print()

    # 2. Functional & AI Pipelines
    token = test_doctor_login_and_records()
    test_grok_ai_summary(token)
    test_hf_diagnostic_copilot(token)

    print()
    print("=" * 70)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    print(f"VERIFICATION SCORE: {passed_count}/{total_count} CHECKS PASSED")
    if passed_count == total_count:
        print("🌟 STATUS: ALL SYSTEMS OPERATIONAL FOR HACKATHON SUBMISSION & DEMO!")
    else:
        print("⚠️ STATUS: SOME CHECKS FAILED. Review service logs.")
    print("=" * 70)

if __name__ == "__main__":
    main()
