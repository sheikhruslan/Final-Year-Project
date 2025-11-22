"""
Claims API Routes
Handle claim submission, processing, and retrieval
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from services.ocr_service import OCRService
from services.claim_processor import ClaimProcessor

router = APIRouter()

# Pydantic Models
class ClaimData(BaseModel):
    """Structured claim data"""
    claim_id: Optional[str] = None
    policy_number: str
    claimant_name: str
    claimant_id: str
    provider_name: str
    provider_id: str
    claim_amount: float
    claim_date: datetime
    policy_inception_date: datetime
    treatment_code: str
    diagnosis_code: str
    hospital_name: Optional[str] = None
    location: Optional[dict] = None
    documents: Optional[List[str]] = None

class ClaimResponse(BaseModel):
    """Response after claim submission"""
    claim_id: str
    status: str
    message: str
    extracted_data: Optional[dict] = None

class ClaimList(BaseModel):
    """List of claims"""
    claims: List[dict]
    total: int
    page: int
    page_size: int

# Initialize services
ocr_service = OCRService()
claim_processor = ClaimProcessor()

@router.post("/upload", response_model=ClaimResponse)
async def upload_claim_document(file: UploadFile = File(...)):
    """
    Upload a claim document (PDF, image, or DOCX) for OCR processing
    Extracts structured data from the document
    """
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx']
        file_ext = '.' + file.filename.split('.')[-1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed: {allowed_extensions}"
            )
        
        # Read file content
        content = await file.read()
        
        # Perform OCR extraction
        extracted_data = await ocr_service.extract_claim_data(content, file_ext)
        
        # Generate claim ID
        claim_id = str(uuid.uuid4())
        extracted_data['claim_id'] = claim_id
        
        # Store extracted data (would normally save to database)
        await claim_processor.store_claim(claim_id, extracted_data)
        
        return ClaimResponse(
            claim_id=claim_id,
            status="extracted",
            message="Document processed successfully",
            extracted_data=extracted_data
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.post("/submit", response_model=ClaimResponse)
async def submit_claim(claim: ClaimData):
    """
    Submit structured claim data directly (manual entry or pre-processed)
    """
    try:
        # Generate claim ID if not provided
        if not claim.claim_id:
            claim.claim_id = str(uuid.uuid4())
        
        # Store claim
        await claim_processor.store_claim(claim.claim_id, claim.dict())
        
        return ClaimResponse(
            claim_id=claim.claim_id,
            status="submitted",
            message="Claim submitted successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting claim: {str(e)}")

@router.get("/{claim_id}")
async def get_claim(claim_id: str):
    """
    Retrieve claim details by ID
    """
    try:
        claim = await claim_processor.get_claim(claim_id)
        
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return claim
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving claim: {str(e)}")

@router.get("/", response_model=ClaimList)
async def list_claims(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    risk_level: Optional[str] = None
):
    """
    List all claims with pagination and filtering
    """
    try:
        claims, total = await claim_processor.list_claims(
            page=page,
            page_size=page_size,
            status=status,
            risk_level=risk_level
        )
        
        return ClaimList(
            claims=claims,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing claims: {str(e)}")

@router.delete("/{claim_id}")
async def delete_claim(claim_id: str):
    """
    Delete a claim by ID
    """
    try:
        success = await claim_processor.delete_claim(claim_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        return {"message": "Claim deleted successfully", "claim_id": claim_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting claim: {str(e)}")
