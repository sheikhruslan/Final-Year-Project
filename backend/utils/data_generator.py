"""
Synthetic Data Generator
Generates realistic insurance claim data for testing
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict
import json
import os

class DataGenerator:
    """Generate synthetic insurance claims for testing"""
    
    # Hong Kong districts
    DISTRICTS = [
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
    
    HOSPITALS = [
        "Queen Mary Hospital", "Princess Margaret Hospital", "Tuen Mun Hospital",
        "Prince of Wales Hospital", "Queen Elizabeth Hospital", "United Christian Hospital",
        "Pamela Youde Nethersole Eastern Hospital", "Kwong Wah Hospital",
        "Caritas Medical Centre", "North District Hospital"
    ]
    
    TREATMENTS = [
        ("T001", "General Consultation", 500, 2000),
        ("T045", "X-Ray Imaging", 800, 3000),
        ("T089", "Blood Test Panel", 600, 1500),
        ("T123", "Minor Surgery", 5000, 20000),
        ("T156", "Physiotherapy Session", 400, 1200),
        ("T234", "MRI Scan", 5000, 15000),
        ("T345", "Emergency Treatment", 3000, 25000),
        ("T456", "Specialist Consultation", 1000, 3500),
        ("T567", "Dental Procedure", 800, 5000),
        ("T678", "Hospitalization (per day)", 2000, 8000),
    ]
    
    FIRST_NAMES = ["Wing", "Ying", "Ming", "Fai", "Kit", "Siu", "Chi", "Wai", "Hei", "Lok"]
    LAST_NAMES = ["Chan", "Wong", "Leung", "Lam", "Ng", "Cheung", "Tsang", "Ho", "Yu", "Chow"]
    
    def __init__(self):
        random.seed(42)  # For reproducibility
    
    def generate_claims(self, num_claims: int = 100, fraud_rate: float = 0.15) -> List[Dict]:
        """
        Generate synthetic insurance claims
        
        Args:
            num_claims: Number of claims to generate
            fraud_rate: Percentage of claims that should be fraudulent
            
        Returns:
            List of claim dictionaries
        """
        claims = []
        num_fraudulent = int(num_claims * fraud_rate)
        
        for i in range(num_claims):
            is_fraud = i < num_fraudulent
            claim = self._generate_claim(i + 1, is_fraud)
            claims.append(claim)
        
        # Shuffle to mix fraudulent and legitimate
        random.shuffle(claims)
        
        return claims
    
    def _generate_claim(self, index: int, is_fraudulent: bool) -> Dict:
        """Generate a single claim"""
        
        # Random dates
        policy_date = datetime.now() - timedelta(days=random.randint(180, 1800))
        
        if is_fraudulent:
            # Fraudulent claims often submitted soon after policy inception
            claim_date = policy_date + timedelta(days=random.randint(1, 60))
        else:
            # Legitimate claims spread more evenly
            claim_date = policy_date + timedelta(days=random.randint(90, 1000))
        
        # Random location
        location = random.choice(self.DISTRICTS)
        
        # Random treatment
        treatment = random.choice(self.TREATMENTS)
        treatment_code, treatment_name, min_amount, max_amount = treatment
        
        if is_fraudulent:
            # Fraudulent claims tend to be higher and rounder
            base_amount = random.uniform(max_amount * 0.7, max_amount * 1.5)
            claim_amount = round(base_amount / 1000) * 1000  # Round to nearest thousand
        else:
            # Legitimate claims more varied
            claim_amount = round(random.uniform(min_amount, max_amount), 2)
        
        # Random names
        claimant_name = f"{random.choice(self.FIRST_NAMES)} {random.choice(self.LAST_NAMES)}"
        
        # Provider info
        provider_name = random.choice(self.HOSPITALS)
        
        if is_fraudulent:
            # Some fraudulent providers
            provider_id = f"PRV{random.choice([666, 999, 1000])}"
        else:
            provider_id = f"PRV{random.randint(1, 500):04d}"
        
        claim = {
            "claim_id": f"CLM{index:08d}",
            "policy_number": f"POL{random.randint(100000, 999999)}",
            "claimant_name": claimant_name,
            "claimant_id": f"HK{random.randint(1000000, 9999999)}",
            "provider_name": provider_name,
            "provider_id": provider_id,
            "claim_amount": claim_amount,
            "claim_date": claim_date.isoformat(),
            "policy_inception_date": policy_date.isoformat(),
            "treatment_code": treatment_code,
            "treatment_name": treatment_name,
            "diagnosis_code": f"D{random.randint(1, 999):03d}",
            "hospital_name": provider_name,
            "location": {
                "district": location["name"],
                "latitude": location["lat"],
                "longitude": location["lng"]
            },
            "is_fraudulent": is_fraudulent,  # Ground truth (would not be in real data)
            "fraud_type": self._get_fraud_type() if is_fraudulent else None
        }
        
        return claim
    
    def _get_fraud_type(self) -> str:
        """Get random fraud type"""
        fraud_types = [
            "Upcoding",
            "Billing for services not rendered",
            "Staged accident",
            "Duplicate claim",
            "Exaggerated claim amount"
        ]
        return random.choice(fraud_types)
    
    def save_to_file(self, claims: List[Dict], filename: str = "synthetic_claims.json"):
        """Save generated claims to JSON file"""
        output_dir = os.path.join(os.path.dirname(__file__), '../data')
        os.makedirs(output_dir, exist_ok=True)
        
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(claims, f, indent=2, default=str)
        
        print(f"Generated {len(claims)} claims saved to {filepath}")
        return filepath

# Script to generate sample data
if __name__ == "__main__":
    generator = DataGenerator()
    claims = generator.generate_claims(num_claims=500, fraud_rate=0.15)
    generator.save_to_file(claims)
    
    # Print statistics
    fraud_count = sum(1 for c in claims if c['is_fraudulent'])
    print(f"\nGenerated Claims Statistics:")
    print(f"Total Claims: {len(claims)}")
    print(f"Fraudulent: {fraud_count} ({fraud_count/len(claims)*100:.1f}%)")
    print(f"Legitimate: {len(claims) - fraud_count} ({(len(claims)-fraud_count)/len(claims)*100:.1f}%)")
