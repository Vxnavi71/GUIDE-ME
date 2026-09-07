from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.api.deps import get_current_user
from app.models.entities import User
from app.schemas.schemas import EmergencyContactCreate, EmergencyContactResponse
from app.repositories import SafetyRepository, AuditRepository

router = APIRouter(prefix="/safety", tags=["Safety Center"])


@router.get("/emergency-contacts", response_model=List[EmergencyContactResponse])
async def list_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = SafetyRepository(db)
    return await repo.list_emergency_contacts(current_user.id)


@router.post("/emergency-contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
async def add_emergency_contact(
    payload: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = SafetyRepository(db)
    contact = await repo.add_emergency_contact(
        user_id=current_user.id,
        name=payload.name,
        relationship=payload.relationship,
        phone_number=payload.phone_number,
        email=payload.email,
        notify_on_distress=payload.notify_on_distress,
    )
    audit = AuditRepository(db)
    await audit.log_action(current_user.id, "ADD_EMERGENCY_CONTACT", "emergency_contacts")
    return contact


@router.post("/trigger-alert")
async def trigger_emergency_alert(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    repo = SafetyRepository(db)
    event = await repo.log_safety_event(
        user_id=current_user.id,
        severity="critical",
        event_type="manual_sos_trigger",
        details={"initiated_by": "user_ui_button"},
        support_displayed=[
            "Tele-MANAS (14416 / 1800-891-4416)",
            "KIRAN (1800-599-0019)",
            "Vandrevala Foundation (+91 9999 666 555)",
            "National Emergency (112)",
            "AASRA (+91 98204 66726)",
            "NIMHANS (080-46110007)",
        ],
    )
    return {
        "status": "alert_recorded",
        "escalation_status": "Medical Assistance Required",
        "emergency_hotlines": [
            {"region": "India (Govt of India 24/7)", "service": "Tele-MANAS Mental Health Helpline", "contact": "Call 14416 or 1800-891-4416 (Toll-Free, 20+ Languages)"},
            {"region": "India (Ministry of Social Justice)", "service": "KIRAN Mental Health Rehabilitation", "contact": "Call 1800-599-0019 (24/7 Toll-Free)"},
            {"region": "India (24/7 Crisis Support)", "service": "Vandrevala Foundation Helpline", "contact": "Call +91 9999 666 555"},
            {"region": "India (National Emergency)", "service": "All-in-One Emergency Services", "contact": "Call 112 (Ambulance, Police, Fire)"},
            {"region": "India (Suicide Prevention)", "service": "AASRA 24/7 Helpline", "contact": "Call +91 98204 66726"},
            {"region": "India (Premier Mental Health)", "service": "NIMHANS Helpline", "contact": "Call 080-46110007"},
        ],
        "immediate_action": "Medical Assistance Required. Please connect with one of the emergency services above or reach out to a trusted doctor, hospital, or loved one immediately. You are not alone.",
    }
