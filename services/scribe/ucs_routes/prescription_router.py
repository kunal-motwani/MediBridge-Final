# evidencescribe_multilingual-master/ucs_routes/prescription_router.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from bson import ObjectId

from ..utils.auth import get_current_user  # auth dependency
from ..utils.database import get_db

router = APIRouter()

# Pydantic models for response
class Prescription(BaseModel):
    id: str
    patient_id: str
    medication: str
    dosage: str
    frequency: str
    status: str

# Helper to convert Mongo document to model
def _doc_to_presc(doc) -> Prescription:
    return Prescription(
        id=str(doc.get("_id")),
        patient_id=str(doc.get("patient_id")),
        medication=doc.get("medication", ""),
        dosage=doc.get("dosage", ""),
        frequency=doc.get("frequency", ""),
        status=doc.get("status", ""),
    )

@router.get("/", response_model=List[Prescription])
async def get_my_prescriptions(user=Depends(get_current_user)):
    """Return all prescriptions belonging to the authenticated patient."""
    db = get_db()
    cursor = db.prescriptions.find({"patient_id": ObjectId(user["id"])})
    return [_doc_to_presc(doc) for doc in cursor]

@router.get("/active", response_model=List[Prescription])
async def get_active_prescriptions(user=Depends(get_current_user)):
    """Return only active (e.g., not completed) prescriptions for the patient."""
    db = get_db()
    cursor = db.prescriptions.find({"patient_id": ObjectId(user["id"]), "status": "active"})
    return [_doc_to_presc(doc) for doc in cursor]

@router.get("/{presc_id}", response_model=Prescription)
async def get_prescription_by_id(presc_id: str, user=Depends(get_current_user)):
    db = get_db()
    doc = db.prescriptions.find_one({"_id": ObjectId(presc_id), "patient_id": ObjectId(user["id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return _doc_to_presc(doc)

@router.put("/{presc_id}/complete", response_model=Prescription)
async def mark_complete(presc_id: str, user=Depends(get_current_user)):
    db = get_db()
    result = db.prescriptions.update_one(
        {"_id": ObjectId(presc_id), "patient_id": ObjectId(user["id"])},
        {"$set": {"status": "completed"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Prescription not found")
    doc = db.prescriptions.find_one({"_id": ObjectId(presc_id)})
    return _doc_to_presc(doc)
