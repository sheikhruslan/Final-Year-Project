"""
Analysis API Routes
Handles fraud detection analysis, risk scoring, and detailed assessments
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from services.fraud_detector import FraudDetector
from services.feature_engineer import FeatureEngineer
from services.benford_analyzer import BenfordAnalyzer

router = APIRouter()

# Pydantic Models
class AnalysisRequest(BaseModel):
    """Request for fraud analysis"""
    claim_id: str
    force_reanalysis: bool = False

class RiskScore(BaseModel):
    """Risk assessment score"""
    overall_score: float  # 0-100
    confidence_interval: tuple[float, float]
    risk_level: str  # "low", "medium", "high", "critical"
    components: Dict[str, float]

class FeatureContribution(BaseModel):
    """Individual feature contribution to prediction"""
    feature_name: str
    value: float
    contribution: float
    importance: float

class AnalysisResult(BaseModel):
    """Complete analysis result"""
    claim_id: str
    timestamp: datetime
    risk_score: RiskScore
    ml_prediction: Dict
    benford_analysis: Dict
    rule_based_flags: List[Dict]
    feature_contributions: List[FeatureContribution]
    network_connections: Optional[Dict] = None
    recommendations: List[str]

# Initialize services
fraud_detector = FraudDetector()
feature_engineer = FeatureEngineer()
benford_analyzer = BenfordAnalyzer()

@router.post("/analyze", response_model=AnalysisResult)
async def analyze_claim(request: AnalysisRequest):
    """
    Perform comprehensive fraud analysis on a claim
    Combines ML, Benford's Law, and rule-based detection
    """
    try:
        # Get claim data
        from services.claim_processor import ClaimProcessor
        claim_processor = ClaimProcessor()
        claim_data = await claim_processor.get_claim(request.claim_id)
        
        if not claim_data:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Check if analysis already exists and not forcing reanalysis
        existing_analysis = await fraud_detector.get_cached_analysis(request.claim_id)
        if existing_analysis and not request.force_reanalysis:
            return existing_analysis
        
        # Feature engineering
        features = feature_engineer.extract_features(claim_data)
        
        # ML-based prediction
        ml_result = fraud_detector.predict(features)
        
        # Benford's Law analysis
        benford_result = benford_analyzer.analyze(claim_data)
        
        # Rule-based checks
        rule_flags = fraud_detector.apply_rule_checks(claim_data)
        
        # Feature importance and contributions
        feature_contributions = fraud_detector.get_feature_contributions(features)
        
        # Network analysis (if applicable)
        network_data = await fraud_detector.analyze_network_connections(claim_data)
        
        # Calculate overall risk score
        risk_score = fraud_detector.calculate_risk_score(
            ml_result=ml_result,
            benford_result=benford_result,
            rule_flags=rule_flags
        )
        
        # Generate recommendations
        recommendations = fraud_detector.generate_recommendations(
            risk_score=risk_score,
            flags=rule_flags,
            benford_result=benford_result
        )
        
        # Compile result
        analysis_result = AnalysisResult(
            claim_id=request.claim_id,
            timestamp=datetime.now(),
            risk_score=risk_score,
            ml_prediction=ml_result,
            benford_analysis=benford_result,
            rule_based_flags=rule_flags,
            feature_contributions=feature_contributions,
            network_connections=network_data,
            recommendations=recommendations
        )
        
        # Cache result
        await fraud_detector.cache_analysis(request.claim_id, analysis_result)
        
        return analysis_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing claim: {str(e)}")

@router.get("/results/{claim_id}", response_model=AnalysisResult)
async def get_analysis_result(claim_id: str):
    """
    Retrieve existing analysis result for a claim
    """
    try:
        result = await fraud_detector.get_cached_analysis(claim_id)
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Analysis not found. Please run analysis first."
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analysis: {str(e)}")

@router.get("/batch-analyze")
async def batch_analyze_claims(claim_ids: List[str]):
    """
    Analyze multiple claims in batch
    """
    try:
        results = []
        errors = []
        
        for claim_id in claim_ids:
            try:
                request = AnalysisRequest(claim_id=claim_id)
                result = await analyze_claim(request)
                results.append(result)
            except Exception as e:
                errors.append({"claim_id": claim_id, "error": str(e)})
        
        return {
            "results": results,
            "errors": errors,
            "total": len(claim_ids),
            "successful": len(results),
            "failed": len(errors)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")

@router.get("/feature-importance")
async def get_feature_importance():
    """
    Get global feature importance from the ML model
    """
    try:
        importance = fraud_detector.get_global_feature_importance()
        return importance
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving feature importance: {str(e)}")

@router.post("/explain/{claim_id}")
async def explain_prediction(claim_id: str):
    """
    Get detailed explanation of why a claim was flagged
    Uses SHAP values and human-readable explanations
    """
    try:
        explanation = await fraud_detector.explain_prediction(claim_id)
        
        if not explanation:
            raise HTTPException(status_code=404, detail="Analysis not found for this claim")
        
        return explanation
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining prediction: {str(e)}")
