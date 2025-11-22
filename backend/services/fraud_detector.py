"""
Fraud Detector Service
Main service for fraud detection combining ML, Benford's Law, and rules
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import joblib
import os

class FraudDetector:
    """Main fraud detection service"""
    
    def __init__(self):
        self.model = None
        self.model_path = os.getenv("MODEL_PATH", "../models")
        self.threshold = float(os.getenv("MODEL_THRESHOLD", "0.5"))
        self.cache = {}
        self._load_model()
    
    def _load_model(self):
        """Load the XGBoost model"""
        try:
            model_file = os.path.join(self.model_path, "fraud_detector_xgboost.pkl")
            if os.path.exists(model_file):
                self.model = joblib.load(model_file)
                print(f"Model loaded from {model_file}")
            else:
                print("Warning: No trained model found. Using placeholder.")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def predict(self, features: Dict) -> Dict:
        """
        Make fraud prediction using ML model
        
        Args:
            features: Engineered features dict
            
        Returns:
            Dict with prediction results
        """
        try:
            if self.model is None:
                # Placeholder prediction logic
                # Use simple heuristics until real model is trained
                risk_indicators = [
                    features.get('claim_amount', 0) > 100000,
                    features.get('days_since_policy_inception', 365) < 30,
                    features.get('claim_frequency', 0) > 5,
                    features.get('provider_risk_score', 0) > 0.7
                ]
                
                fraud_probability = sum(risk_indicators) / len(risk_indicators)
                is_fraud = fraud_probability > self.threshold
                
                return {
                    'fraud_probability': fraud_probability,
                    'is_fraud': is_fraud,
                    'confidence': 0.75,
                    'model_version': 'placeholder_v1'
                }
            
            # Convert features to DataFrame for model
            feature_df = pd.DataFrame([features])
            
            # Get prediction
            fraud_prob = self.model.predict_proba(feature_df)[0][1]
            is_fraud = fraud_prob > self.threshold
            
            return {
                'fraud_probability': float(fraud_prob),
                'is_fraud': bool(is_fraud),
                'confidence': float(max(fraud_prob, 1 - fraud_prob)),
                'model_version': getattr(self.model, 'version', 'unknown')
            }
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            return {
                'fraud_probability': 0.0,
                'is_fraud': False,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def apply_rule_checks(self, claim_data: Dict) -> List[Dict]:
        """
        Apply rule-based fraud detection checks
        
        Returns:
            List of flagged rules with details
        """
        flags = []
        
        # Rule 1: High claim amount
        claim_amount = claim_data.get('claim_amount', 0)
        if claim_amount > 200000:
            flags.append({
                'rule_id': 'RULE_001',
                'rule_name': 'High Claim Amount',
                'severity': 'medium',
                'description': f'Claim amount (HKD {claim_amount:,.2f}) exceeds threshold',
                'threshold': 200000
            })
        
        # Rule 2: Quick claim after policy inception
        policy_date = claim_data.get('policy_inception_date')
        claim_date = claim_data.get('claim_date')
        if policy_date and claim_date:
            if isinstance(policy_date, str):
                policy_date = datetime.fromisoformat(policy_date.replace('Z', '+00:00'))
            if isinstance(claim_date, str):
                claim_date = datetime.fromisoformat(claim_date.replace('Z', '+00:00'))
            
            days_diff = (claim_date - policy_date).days
            if days_diff < 30:
                flags.append({
                    'rule_id': 'RULE_002',
                    'rule_name': 'Early Claim Submission',
                    'severity': 'high',
                    'description': f'Claim submitted {days_diff} days after policy inception',
                    'threshold': 30
                })
        
        # Rule 3: Weekend/holiday submission pattern
        if claim_date:
            if claim_date.weekday() >= 5:  # Saturday or Sunday
                flags.append({
                    'rule_id': 'RULE_003',
                    'rule_name': 'Weekend Submission',
                    'severity': 'low',
                    'description': 'Claim submitted on weekend',
                    'threshold': None
                })
        
        # Rule 4: Round number amount (potential fabrication)
        if claim_amount % 1000 == 0 and claim_amount > 10000:
            flags.append({
                'rule_id': 'RULE_004',
                'rule_name': 'Round Number Amount',
                'severity': 'low',
                'description': 'Claim amount is a round number, may indicate estimation',
                'threshold': None
            })
        
        # Rule 5: Duplicate provider pattern
        provider_id = claim_data.get('provider_id')
        if provider_id and self._check_provider_history(provider_id):
            flags.append({
                'rule_id': 'RULE_005',
                'rule_name': 'High-Risk Provider',
                'severity': 'critical',
                'description': 'Provider has history of fraudulent claims',
                'threshold': None
            })
        
        return flags
    
    def _check_provider_history(self, provider_id: str) -> bool:
        """Check if provider has suspicious history"""
        # TODO: Query database for provider history
        # Placeholder: flag providers with ID ending in '666' or '999'
        return provider_id.endswith(('666', '999', '000'))
    
    def calculate_risk_score(
        self,
        ml_result: Dict,
        benford_result: Dict,
        rule_flags: List[Dict]
    ) -> Dict:
        """
        Calculate overall risk score combining all detection methods
        
        Returns:
            Risk score dict with overall score, confidence, and components
        """
        # Component weights
        weights = {
            'ml': 0.5,
            'benford': 0.25,
            'rules': 0.25
        }
        
        # ML component (0-100)
        ml_score = ml_result.get('fraud_probability', 0) * 100
        ml_confidence = ml_result.get('confidence', 0.5)
        
        # Benford's Law component (0-100)
        benford_deviation = benford_result.get('deviation_score', 0)
        benford_score = min(benford_deviation * 100, 100)
        
        # Rule-based component (0-100)
        severity_scores = {'low': 25, 'medium': 50, 'high': 75, 'critical': 100}
        rule_scores = [severity_scores[flag['severity']] for flag in rule_flags]
        rule_score = max(rule_scores) if rule_scores else 0
        
        # Calculate weighted overall score
        overall_score = (
            weights['ml'] * ml_score +
            weights['benford'] * benford_score +
            weights['rules'] * rule_score
        )
        
        # Calculate confidence interval
        confidence = ml_confidence * 0.7 + (0.3 if rule_flags else 0)
        margin = (1 - confidence) * overall_score * 0.3
        confidence_interval = (
            max(0, overall_score - margin),
            min(100, overall_score + margin)
        )
        
        # Determine risk level
        if overall_score >= 75:
            risk_level = "critical"
        elif overall_score >= 50:
            risk_level = "high"
        elif overall_score >= 25:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            'overall_score': round(overall_score, 2),
            'confidence_interval': tuple(round(x, 2) for x in confidence_interval),
            'risk_level': risk_level,
            'components': {
                'ml_score': round(ml_score, 2),
                'benford_score': round(benford_score, 2),
                'rule_score': round(rule_score, 2)
            }
        }
    
    def get_feature_contributions(self, features: Dict) -> List[Dict]:
        """
        Get feature contributions to the prediction (SHAP-like)
        
        Returns:
            List of feature contributions
        """
        # TODO: Implement actual SHAP values when model is trained
        # Placeholder: return feature importances
        
        feature_importance = {
            'claim_amount': 0.25,
            'days_since_policy_inception': 0.20,
            'provider_risk_score': 0.18,
            'claim_frequency': 0.15,
            'treatment_code_risk': 0.12,
            'location_risk_score': 0.10
        }
        
        contributions = []
        for feature_name, importance in feature_importance.items():
            value = features.get(feature_name, 0)
            contribution = value * importance * 100  # Simplified
            
            contributions.append({
                'feature_name': feature_name.replace('_', ' ').title(),
                'value': round(value, 2),
                'contribution': round(contribution, 2),
                'importance': round(importance, 4)
            })
        
        # Sort by contribution magnitude
        contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        return contributions
    
    def get_global_feature_importance(self) -> Dict:
        """Get global feature importance from the model"""
        if self.model and hasattr(self.model, 'feature_importances_'):
            # Real model importance
            importance = self.model.feature_importances_
            feature_names = self.model.feature_names_in_
            
            return {
                'features': [
                    {'name': name, 'importance': float(imp)}
                    for name, imp in zip(feature_names, importance)
                ]
            }
        else:
            # Placeholder importance
            return {
                'features': [
                    {'name': 'Claim Amount', 'importance': 0.25},
                    {'name': 'Policy Tenure', 'importance': 0.20},
                    {'name': 'Provider Risk', 'importance': 0.18},
                    {'name': 'Claim Frequency', 'importance': 0.15},
                    {'name': 'Treatment Risk', 'importance': 0.12},
                    {'name': 'Location Risk', 'importance': 0.10}
                ]
            }
    
    async def analyze_network_connections(self, claim_data: Dict) -> Optional[Dict]:
        """
        Analyze network connections for fraud rings
        
        Returns:
            Network data if suspicious connections found
        """
        # TODO: Implement graph-based fraud ring detection
        provider_id = claim_data.get('provider_id')
        claimant_id = claim_data.get('claimant_id')
        
        # Placeholder: return None or simple network
        return None
    
    def generate_recommendations(
        self,
        risk_score: Dict,
        flags: List[Dict],
        benford_result: Dict
    ) -> List[str]:
        """Generate actionable recommendations for investigators"""
        recommendations = []
        
        if risk_score['overall_score'] >= 75:
            recommendations.append("🚨 URGENT: Initiate full investigation immediately")
            recommendations.append("Contact claimant for additional documentation")
        
        if risk_score['overall_score'] >= 50:
            recommendations.append("Verify provider credentials and license status")
            recommendations.append("Cross-reference with HKFI fraud database")
        
        if any(flag['rule_id'] == 'RULE_005' for flag in flags):
            recommendations.append("Review all recent claims from this provider")
        
        if benford_result.get('is_anomalous'):
            recommendations.append("Audit claim amount calculation methodology")
        
        if risk_score['overall_score'] < 25:
            recommendations.append("✅ Low risk - standard processing recommended")
        else:
            recommendations.append("Request additional supporting documents")
            recommendations.append("Consider physical inspection if applicable")
        
        return recommendations
    
    async def get_cached_analysis(self, claim_id: str) -> Optional[Dict]:
        """Retrieve cached analysis result"""
        return self.cache.get(claim_id)
    
    async def cache_analysis(self, claim_id: str, result: Dict):
        """Cache analysis result"""
        self.cache[claim_id] = result
    
    async def explain_prediction(self, claim_id: str) -> Optional[Dict]:
        """Get detailed explanation of prediction"""
        cached = await self.get_cached_analysis(claim_id)
        if not cached:
            return None
        
        # Generate human-readable explanation
        risk_score = cached.get('risk_score', {})
        overall = risk_score.get('overall_score', 0)
        components = risk_score.get('components', {})
        
        explanation = {
            'summary': self._generate_summary(overall, components),
            'details': self._generate_details(cached),
            'top_factors': cached.get('feature_contributions', [])[:5],
            'similar_cases': []  # TODO: Find similar historical cases
        }
        
        return explanation
    
    def _generate_summary(self, overall_score: float, components: Dict) -> str:
        """Generate human-readable summary"""
        if overall_score >= 75:
            return (
                f"This claim has been flagged as CRITICAL RISK with a score of {overall_score:.1f}/100. "
                "Multiple fraud indicators were detected across machine learning, statistical analysis, "
                "and rule-based checks. Immediate investigation is recommended."
            )
        elif overall_score >= 50:
            return (
                f"This claim shows HIGH RISK indicators with a score of {overall_score:.1f}/100. "
                "Several concerning patterns were identified that warrant further investigation."
            )
        elif overall_score >= 25:
            return (
                f"This claim has MEDIUM RISK with a score of {overall_score:.1f}/100. "
                "Some irregularities were detected but may have legitimate explanations."
            )
        else:
            return (
                f"This claim appears LOW RISK with a score of {overall_score:.1f}/100. "
                "No significant fraud indicators were detected."
            )
    
    def _generate_details(self, cached: Dict) -> str:
        """Generate detailed explanation"""
        details = []
        
        # ML component
        ml_pred = cached.get('ml_prediction', {})
        if ml_pred.get('fraud_probability', 0) > 0.5:
            details.append(
                f"Machine learning model detected {ml_pred['fraud_probability']*100:.1f}% "
                "probability of fraud based on historical patterns."
            )
        
        # Benford's Law
        benford = cached.get('benford_analysis', {})
        if benford.get('is_anomalous'):
            details.append(
                "Statistical analysis (Benford's Law) detected anomalies in claim amounts, "
                "suggesting possible manipulation."
            )
        
        # Rules
        flags = cached.get('rule_based_flags', [])
        if flags:
            details.append(
                f"Triggered {len(flags)} rule-based checks including: " +
                ", ".join(f['rule_name'] for f in flags[:3])
            )
        
        return " ".join(details) if details else "No significant concerns detected."
