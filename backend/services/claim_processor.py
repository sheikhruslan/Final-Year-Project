"""
Claim Processor Service
Handles claim storage, retrieval, and management
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json
import os

class ClaimProcessor:
    """Service for processing and managing claims"""
    
    def __init__(self):
        # In-memory storage (use database in production)
        self.claims_db = {}
        self.storage_path = os.path.join(os.path.dirname(__file__), '../data/claims')
        os.makedirs(self.storage_path, exist_ok=True)
        self._load_claims()
    
    def _load_claims(self):
        """Load existing claims from storage"""
        try:
            if os.path.exists(os.path.join(self.storage_path, 'claims.json')):
                with open(os.path.join(self.storage_path, 'claims.json'), 'r') as f:
                    self.claims_db = json.load(f)
        except Exception as e:
            print(f"Error loading claims: {e}")
    
    def _save_claims(self):
        """Save claims to storage"""
        try:
            with open(os.path.join(self.storage_path, 'claims.json'), 'w') as f:
                json.dump(self.claims_db, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving claims: {e}")
    
    async def store_claim(self, claim_id: str, claim_data: Dict) -> bool:
        """
        Store a claim
        
        Args:
            claim_id: Unique claim identifier
            claim_data: Claim information
            
        Returns:
            True if successful
        """
        try:
            # Add metadata
            claim_data['claim_id'] = claim_id
            claim_data['created_at'] = datetime.now().isoformat()
            claim_data['updated_at'] = datetime.now().isoformat()
            claim_data['status'] = claim_data.get('status', 'pending')
            
            # Store in memory
            self.claims_db[claim_id] = claim_data
            
            # Persist to disk
            self._save_claims()
            
            return True
            
        except Exception as e:
            print(f"Error storing claim: {e}")
            return False
    
    async def get_claim(self, claim_id: str) -> Optional[Dict]:
        """
        Retrieve a claim by ID
        
        Args:
            claim_id: Claim identifier
            
        Returns:
            Claim data or None if not found
        """
        return self.claims_db.get(claim_id)
    
    async def list_claims(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        risk_level: Optional[str] = None
    ) -> Tuple[List[Dict], int]:
        """
        List claims with pagination and filtering
        
        Returns:
            (list_of_claims, total_count)
        """
        # Get all claims
        all_claims = list(self.claims_db.values())
        
        # Filter by status
        if status:
            all_claims = [c for c in all_claims if c.get('status') == status]
        
        # Filter by risk level
        if risk_level:
            all_claims = [c for c in all_claims if c.get('risk_level') == risk_level]
        
        # Sort by created_at (newest first)
        all_claims.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Paginate
        total = len(all_claims)
        start = (page - 1) * page_size
        end = start + page_size
        page_claims = all_claims[start:end]
        
        return page_claims, total
    
    async def delete_claim(self, claim_id: str) -> bool:
        """
        Delete a claim
        
        Returns:
            True if deleted, False if not found
        """
        if claim_id in self.claims_db:
            del self.claims_db[claim_id]
            self._save_claims()
            return True
        return False
    
    async def update_claim_status(self, claim_id: str, status: str) -> bool:
        """Update claim status"""
        if claim_id in self.claims_db:
            self.claims_db[claim_id]['status'] = status
            self.claims_db[claim_id]['updated_at'] = datetime.now().isoformat()
            self._save_claims()
            return True
        return False
