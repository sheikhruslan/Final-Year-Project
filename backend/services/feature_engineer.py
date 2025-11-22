"""
Feature Engineering Service
Extracts and engineers features from raw claim data for ML models
"""

from typing import Dict, List
from datetime import datetime, timedelta
import numpy as np

class FeatureEngineer:
    """Extract and engineer features from claim data"""
    
    # High-risk treatment codes (placeholder - would come from domain experts)
    HIGH_RISK_TREATMENTS = [
        'T001', 'T045', 'T089', 'T123', 'T456'
    ]
    
    # High-risk locations (placeholder - would be based on historical data)
    HIGH_RISK_DISTRICTS = [
        'Yau Tsim Mong', 'Sham Shui Po', 'Islands'
    ]
    
    def __init__(self):
        self.feature_cache = {}
    
    def extract_features(self, claim_data: Dict) -> Dict:
        """
        Extract and engineer features from raw claim data
        
        Args:
            claim_data: Raw claim information
            
        Returns:
            Dict of engineered features ready for ML model
        """
        features = {}
        
        # Basic claim features
        features.update(self._extract_basic_features(claim_data))
        
        # Temporal features
        features.update(self._extract_temporal_features(claim_data))
        
        # Provider features
        features.update(self._extract_provider_features(claim_data))
        
        # Claimant features
        features.update(self._extract_claimant_features(claim_data))
        
        # Treatment features
        features.update(self._extract_treatment_features(claim_data))
        
        # Location features
        features.update(self._extract_location_features(claim_data))
        
        # Behavioral features
        features.update(self._extract_behavioral_features(claim_data))
        
        # Statistical features
        features.update(self._extract_statistical_features(claim_data))
        
        return features
    
    def _extract_basic_features(self, claim_data: Dict) -> Dict:
        """Extract basic claim information"""
        return {
            'claim_amount': float(claim_data.get('claim_amount', 0)),
            'claim_amount_log': np.log1p(float(claim_data.get('claim_amount', 0))),
            'is_round_amount': float(claim_data.get('claim_amount', 0)) % 1000 == 0,
            'has_documents': int(bool(claim_data.get('documents'))),
            'document_count': len(claim_data.get('documents', []))
        }
    
    def _extract_temporal_features(self, claim_data: Dict) -> Dict:
        """Extract time-based features"""
        features = {}
        
        claim_date = claim_data.get('claim_date')
        policy_date = claim_data.get('policy_inception_date')
        
        if claim_date:
            if isinstance(claim_date, str):
                claim_date = datetime.fromisoformat(claim_date.replace('Z', '+00:00'))
            
            # Day of week (0=Monday, 6=Sunday)
            features['claim_day_of_week'] = claim_date.weekday()
            features['is_weekend'] = int(claim_date.weekday() >= 5)
            
            # Month
            features['claim_month'] = claim_date.month
            
            # Time since policy inception
            if policy_date:
                if isinstance(policy_date, str):
                    policy_date = datetime.fromisoformat(policy_date.replace('Z', '+00:00'))
                
                days_diff = (claim_date - policy_date).days
                features['days_since_policy_inception'] = days_diff
                features['within_first_month'] = int(days_diff < 30)
                features['within_first_week'] = int(days_diff < 7)
                features['policy_age_months'] = days_diff / 30.0
        
        return features
    
    def _extract_provider_features(self, claim_data: Dict) -> Dict:
        """Extract provider-related features"""
        features = {}
        
        provider_id = claim_data.get('provider_id', '')
        
        # Provider risk score (would be based on historical data)
        features['provider_risk_score'] = self._calculate_provider_risk(provider_id)
        
        # Provider claim history
        features['provider_total_claims'] = self._get_provider_claim_count(provider_id)
        features['provider_fraud_rate'] = self._get_provider_fraud_rate(provider_id)
        
        return features
    
    def _extract_claimant_features(self, claim_data: Dict) -> Dict:
        """Extract claimant-related features"""
        features = {}
        
        claimant_id = claim_data.get('claimant_id', '')
        
        # Claim frequency
        features['claim_frequency'] = self._get_claimant_claim_frequency(claimant_id)
        
        # Historical claim amount statistics
        historical_amounts = self._get_claimant_historical_amounts(claimant_id)
        if historical_amounts:
            features['avg_historical_claim_amount'] = np.mean(historical_amounts)
            features['max_historical_claim_amount'] = np.max(historical_amounts)
            features['claim_amount_deviation'] = abs(
                claim_data.get('claim_amount', 0) - np.mean(historical_amounts)
            ) / (np.std(historical_amounts) + 1)
        else:
            features['avg_historical_claim_amount'] = 0
            features['max_historical_claim_amount'] = 0
            features['claim_amount_deviation'] = 0
        
        # First-time claimant
        features['is_first_claim'] = int(len(historical_amounts) == 0)
        
        return features
    
    def _extract_treatment_features(self, claim_data: Dict) -> Dict:
        """Extract treatment-related features"""
        features = {}
        
        treatment_code = claim_data.get('treatment_code', '')
        diagnosis_code = claim_data.get('diagnosis_code', '')
        
        # Risk indicators based on treatment type
        features['is_high_risk_treatment'] = int(treatment_code in self.HIGH_RISK_TREATMENTS)
        
        # Treatment code features (simplified)
        features['treatment_code_frequency'] = self._get_treatment_frequency(treatment_code)
        features['treatment_avg_amount'] = self._get_treatment_avg_amount(treatment_code)
        
        # Diagnosis-treatment alignment
        features['diagnosis_treatment_match'] = self._check_diagnosis_treatment_match(
            diagnosis_code, treatment_code
        )
        
        return features
    
    def _extract_location_features(self, claim_data: Dict) -> Dict:
        """Extract location-based features"""
        features = {}
        
        location = claim_data.get('location', {})
        district = location.get('district', '') if isinstance(location, dict) else ''
        
        # Location risk
        features['is_high_risk_location'] = int(district in self.HIGH_RISK_DISTRICTS)
        features['location_risk_score'] = self._calculate_location_risk(district)
        
        # Distance-based features (if coordinates available)
        if isinstance(location, dict) and 'latitude' in location and 'longitude' in location:
            features['provider_claimant_distance'] = self._calculate_distance(
                location, claim_data.get('provider_location', {})
            )
        else:
            features['provider_claimant_distance'] = 0
        
        return features
    
    def _extract_behavioral_features(self, claim_data: Dict) -> Dict:
        """Extract behavioral pattern features"""
        features = {}
        
        # Submission patterns
        features['has_rush_submission'] = int(self._check_rush_submission(claim_data))
        
        # Multiple claims pattern
        features['concurrent_claims'] = self._get_concurrent_claims_count(
            claim_data.get('claimant_id', ''),
            claim_data.get('claim_date')
        )
        
        # Broker involvement
        broker_id = claim_data.get('broker_id')
        if broker_id:
            features['has_broker'] = 1
            features['broker_risk_score'] = self._calculate_broker_risk(broker_id)
        else:
            features['has_broker'] = 0
            features['broker_risk_score'] = 0
        
        return features
    
    def _extract_statistical_features(self, claim_data: Dict) -> Dict:
        """Extract statistical anomaly features"""
        features = {}
        
        claim_amount = claim_data.get('claim_amount', 0)
        
        # Z-score compared to historical distribution
        features['amount_z_score'] = self._calculate_amount_zscore(claim_amount)
        
        # Percentile rank
        features['amount_percentile'] = self._calculate_amount_percentile(claim_amount)
        
        return features
    
    # Helper methods (with placeholder logic - would use real data in production)
    
    def _calculate_provider_risk(self, provider_id: str) -> float:
        """Calculate provider risk score based on history"""
        # Placeholder: use hash of provider ID
        risk = (hash(provider_id) % 100) / 100.0
        return round(risk, 4)
    
    def _get_provider_claim_count(self, provider_id: str) -> int:
        """Get total claims from provider"""
        # Placeholder
        return (hash(provider_id) % 500) + 10
    
    def _get_provider_fraud_rate(self, provider_id: str) -> float:
        """Get historical fraud rate for provider"""
        # Placeholder
        rate = (hash(provider_id) % 20) / 100.0
        return round(rate, 4)
    
    def _get_claimant_claim_frequency(self, claimant_id: str) -> int:
        """Get claim frequency for claimant"""
        # Placeholder
        return (hash(claimant_id) % 10)
    
    def _get_claimant_historical_amounts(self, claimant_id: str) -> List[float]:
        """Get historical claim amounts for claimant"""
        # Placeholder: return empty list for new claimants
        frequency = self._get_claimant_claim_frequency(claimant_id)
        if frequency == 0:
            return []
        return [5000 + (hash(claimant_id + str(i)) % 50000) for i in range(frequency)]
    
    def _get_treatment_frequency(self, treatment_code: str) -> int:
        """Get frequency of treatment code"""
        # Placeholder
        return (hash(treatment_code) % 1000) + 50
    
    def _get_treatment_avg_amount(self, treatment_code: str) -> float:
        """Get average amount for treatment code"""
        # Placeholder
        return 10000 + (hash(treatment_code) % 100000)
    
    def _check_diagnosis_treatment_match(self, diagnosis: str, treatment: str) -> float:
        """Check if diagnosis matches treatment (0-1 score)"""
        # Placeholder: simple hash-based matching
        return 0.8 if hash(diagnosis) % 10 < 8 else 0.3
    
    def _calculate_location_risk(self, district: str) -> float:
        """Calculate location risk score"""
        if district in self.HIGH_RISK_DISTRICTS:
            return 0.75
        return (hash(district) % 50) / 100.0
    
    def _calculate_distance(self, loc1: Dict, loc2: Dict) -> float:
        """Calculate distance between two locations (simplified)"""
        if not loc1 or not loc2:
            return 0.0
        
        # Simple Euclidean distance (not accurate for lat/long)
        lat1 = loc1.get('latitude', 0)
        lon1 = loc1.get('longitude', 0)
        lat2 = loc2.get('latitude', 0)
        lon2 = loc2.get('longitude', 0)
        
        return np.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2) * 111  # ~km
    
    def _check_rush_submission(self, claim_data: Dict) -> bool:
        """Check if claim was submitted in rush"""
        # Placeholder: check if submitted on weekend or late at night
        claim_date = claim_data.get('claim_date')
        if isinstance(claim_date, str):
            claim_date = datetime.fromisoformat(claim_date.replace('Z', '+00:00'))
        
        if claim_date:
            return claim_date.weekday() >= 5 or claim_date.hour >= 22 or claim_date.hour <= 6
        return False
    
    def _get_concurrent_claims_count(self, claimant_id: str, claim_date) -> int:
        """Get number of concurrent claims"""
        # Placeholder
        return (hash(claimant_id) % 3)
    
    def _calculate_broker_risk(self, broker_id: str) -> float:
        """Calculate broker risk score"""
        # Placeholder
        return (hash(broker_id) % 100) / 100.0
    
    def _calculate_amount_zscore(self, amount: float) -> float:
        """Calculate z-score for claim amount"""
        # Placeholder: assume mean=30000, std=25000
        mean = 30000
        std = 25000
        return (amount - mean) / std
    
    def _calculate_amount_percentile(self, amount: float) -> float:
        """Calculate percentile rank of amount"""
        # Placeholder: simple transformation
        return min(amount / 200000 * 100, 100)
