from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CustomerInfoSchema(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=3)
    phone: str = Field(default="+91 98452 11984")
    address: Optional[str] = "Plot 42, Anna Nagar, Chennai, Tamil Nadu"


class ClaimCreateRequest(BaseModel):
    claimId: Optional[str] = None
    customer: CustomerInfoSchema
    policyNumber: str = Field(..., min_length=3)
    policyCoverage: str = "Comprehensive Private Car Gold"
    policyStatus: str = "Active"
    policyLimit: float = 500000.0
    vehicleNumber: str = Field(..., min_length=4)
    vehicleModel: str = "2023 Hyundai Creta SX (O)"
    accidentDate: str = Field(..., min_length=8)
    accidentLocation: str = Field(..., min_length=3)
    claimType: str = "Vehicle Collision"
    incidentDescription: str = Field(..., min_length=10)
    claimedAmount: float = Field(..., gt=0)
    deductible: float = 5000.0


class ClaimUpdateRequest(BaseModel):
    status: Optional[str] = None
    currentAgent: Optional[str] = None
    estimatedAmount: Optional[float] = None
    approvedAmount: Optional[float] = None
    fraudRisk: Optional[float] = None
    overallConfidence: Optional[float] = None
    risk: Optional[str] = None
    agentResults: Optional[Dict[str, Any]] = None
    orchestratorNotes: Optional[Dict[str, Any]] = None
    settlement: Optional[Dict[str, Any]] = None
    humanReviewNotes: Optional[Dict[str, Any]] = None


class DocumentMetadataUpload(BaseModel):
    name: str
    doc_type: str = "Policy"
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    ocr_confidence: float = 0.96


class ImageMetadataUpload(BaseModel):
    angle: str = "Front View"
    quality: str = "Good"
    vision_confidence: float = 0.94
    damage_detected: List[Dict[str, Any]] = Field(default_factory=list)
