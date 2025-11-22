"""
Dashboard API Routes
Provides aggregated data and statistics for the dashboard UI
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta

router = APIRouter()

class DashboardStats(BaseModel):
    """Overall dashboard statistics"""
    total_claims: int
    flagged_claims: int
    total_amount: float
    flagged_amount: float
    detection_rate: float
    avg_risk_score: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int

class TrendData(BaseModel):
    """Time-series trend data"""
    date: str
    claims_count: int
    fraud_count: int
    total_amount: float

class ProviderStats(BaseModel):
    """Provider-level statistics"""
    provider_id: str
    provider_name: str
    total_claims: int
    flagged_claims: int
    avg_risk_score: float
    total_amount: float

class GeographicData(BaseModel):
    """Geographic fraud distribution"""
    region: str
    latitude: float
    longitude: float
    claims_count: int
    fraud_count: int
    avg_risk_score: float

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    Get overall dashboard statistics
    """
    try:
        # Default to last 30 days if no date range provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # TODO: Query from database
        # For now, return mock data
        stats = DashboardStats(
            total_claims=1524,
            flagged_claims=187,
            total_amount=45678900.50,
            flagged_amount=8234567.25,
            detection_rate=12.3,
            avg_risk_score=23.7,
            high_risk_count=42,
            medium_risk_count=89,
            low_risk_count=1393
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving stats: {str(e)}")

@router.get("/trends", response_model=List[TrendData])
async def get_trend_data(
    days: int = Query(30, ge=1, le=365),
    granularity: str = Query("day", pattern="^(day|week|month)$")
):
    """
    Get time-series trend data for claims and fraud detection
    """
    try:
        # TODO: Query from database and aggregate
        # Mock data for now
        trends = []
        end_date = datetime.now()
        
        for i in range(days):
            date = end_date - timedelta(days=days-i-1)
            trends.append(TrendData(
                date=date.strftime("%Y-%m-%d"),
                claims_count=50 + (i % 20),
                fraud_count=5 + (i % 3),
                total_amount=1500000 + (i * 10000)
            ))
        
        return trends
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving trends: {str(e)}")

@router.get("/providers", response_model=List[ProviderStats])
async def get_provider_statistics(
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("flagged_claims", pattern="^(flagged_claims|avg_risk_score|total_amount)$")
):
    """
    Get provider-level statistics sorted by risk indicators
    """
    try:
        # TODO: Query from database
        # Mock data
        providers = [
            ProviderStats(
                provider_id=f"PRV{i:04d}",
                provider_name=f"Healthcare Provider {i}",
                total_claims=120 + (i * 10),
                flagged_claims=15 + (i % 8),
                avg_risk_score=30.5 + (i % 40),
                total_amount=2500000 + (i * 100000)
            )
            for i in range(1, limit + 1)
        ]
        
        # Sort by requested field
        providers.sort(key=lambda x: getattr(x, sort_by), reverse=True)
        
        return providers
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving provider stats: {str(e)}")

@router.get("/geographic", response_model=List[GeographicData])
async def get_geographic_distribution():
    """
    Get geographic distribution of fraud claims across Hong Kong
    """
    try:
        # Hong Kong districts with coordinates
        # TODO: Query actual data from database
        districts = [
            {"name": "Central and Western", "lat": 22.2855, "lng": 114.1577},
            {"name": "Wan Chai", "lat": 22.2783, "lng": 114.1747},
            {"name": "Eastern", "lat": 22.2841, "lng": 114.2245},
            {"name": "Southern", "lat": 22.2461, "lng": 114.1625},
            {"name": "Yau Tsim Mong", "lat": 22.3193, "lng": 114.1694},
            {"name": "Sham Shui Po", "lat": 22.3304, "lng": 114.1625},
            {"name": "Kowloon City", "lat": 22.3301, "lng": 114.1916},
            {"name": "Wong Tai Sin", "lat": 22.3364, "lng": 114.1953},
            {"name": "Kwun Tong", "lat": 22.3120, "lng": 114.2264},
            {"name": "Tsuen Wan", "lat": 22.3688, "lng": 114.1138},
            {"name": "Tuen Mun", "lat": 22.3910, "lng": 113.9773},
            {"name": "Yuen Long", "lat": 22.4448, "lng": 114.0236},
            {"name": "North", "lat": 22.4946, "lng": 114.1381},
            {"name": "Tai Po", "lat": 22.4509, "lng": 114.1638},
            {"name": "Sha Tin", "lat": 22.3793, "lng": 114.1951},
            {"name": "Sai Kung", "lat": 22.3814, "lng": 114.2715},
            {"name": "Islands", "lat": 22.2644, "lng": 113.9462},
        ]
        
        geo_data = []
        for district in districts:
            geo_data.append(GeographicData(
                region=district["name"],
                latitude=district["lat"],
                longitude=district["lng"],
                claims_count=80 + hash(district["name"]) % 150,
                fraud_count=8 + hash(district["name"]) % 25,
                avg_risk_score=20.0 + (hash(district["name"]) % 60)
            ))
        
        return geo_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving geographic data: {str(e)}")

@router.get("/network-graph")
async def get_network_graph(claim_id: Optional[str] = None):
    """
    Get network graph data showing connections between entities
    Can be claim-specific or overall fraud rings
    """
    try:
        # TODO: Implement actual network analysis
        # Mock data showing provider-claimant-broker relationships
        
        if claim_id:
            # Specific claim network
            network = {
                "nodes": [
                    {"id": claim_id, "label": f"Claim {claim_id[:8]}", "type": "claim", "risk": 75},
                    {"id": "provider_1", "label": "Dr. Wong's Clinic", "type": "provider", "risk": 65},
                    {"id": "claimant_1", "label": "Patient A", "type": "claimant", "risk": 40},
                    {"id": "broker_1", "label": "Broker XYZ", "type": "broker", "risk": 80}
                ],
                "edges": [
                    {"source": claim_id, "target": "provider_1", "relationship": "submitted_to"},
                    {"source": claim_id, "target": "claimant_1", "relationship": "filed_by"},
                    {"source": "broker_1", "target": claim_id, "relationship": "facilitated"},
                ]
            }
        else:
            # Overall fraud ring network
            network = {
                "nodes": [
                    {"id": f"node_{i}", "label": f"Entity {i}", "type": ["provider", "claimant", "broker"][i % 3], "risk": 30 + (i * 7) % 70}
                    for i in range(20)
                ],
                "edges": [
                    {"source": f"node_{i}", "target": f"node_{(i+1) % 20}", "relationship": "connected"}
                    for i in range(30)
                ]
            }
        
        return network
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving network graph: {str(e)}")

@router.get("/recent-alerts")
async def get_recent_alerts(limit: int = Query(10, ge=1, le=50)):
    """
    Get recent high-risk alerts requiring immediate attention
    """
    try:
        # TODO: Query from database
        alerts = []
        for i in range(limit):
            alerts.append({
                "alert_id": f"ALT{i+1:05d}",
                "claim_id": f"CLM{i+1:08d}",
                "timestamp": (datetime.now() - timedelta(hours=i*2)).isoformat(),
                "risk_score": 85 + (i % 15),
                "risk_level": "critical" if i < 3 else "high",
                "reason": "Multiple suspicious indicators detected",
                "flagged_rules": ["RULE_001", "RULE_005", "BENFORD_ANOMALY"]
            })
        
        return alerts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving alerts: {str(e)}")
