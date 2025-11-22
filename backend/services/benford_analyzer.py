"""
Benford's Law Analyzer
Statistical analysis for detecting fraud using Benford's Law
"""

import numpy as np
from scipy import stats
from typing import Dict, List
import re

class BenfordAnalyzer:
    """
    Benford's Law analysis for fraud detection
    
    Benford's Law states that in naturally occurring datasets,
    the leading digit is more likely to be small. Deviation from
    this pattern can indicate data manipulation.
    """
    
    # Expected distribution of leading digits according to Benford's Law
    BENFORD_DISTRIBUTION = {
        1: 0.301,
        2: 0.176,
        3: 0.125,
        4: 0.097,
        5: 0.079,
        6: 0.067,
        7: 0.058,
        8: 0.051,
        9: 0.046
    }
    
    def __init__(self, threshold: float = 0.05):
        """
        Args:
            threshold: P-value threshold for chi-square test (default 0.05)
        """
        self.threshold = threshold
    
    def analyze(self, claim_data: Dict) -> Dict:
        """
        Analyze claim data using Benford's Law
        
        Args:
            claim_data: Dictionary containing claim information
            
        Returns:
            Dict with analysis results
        """
        try:
            # Extract numerical fields to analyze
            amounts = self._extract_amounts(claim_data)
            
            if len(amounts) < 10:
                # Not enough data for meaningful Benford analysis
                return {
                    'is_anomalous': False,
                    'deviation_score': 0.0,
                    'p_value': 1.0,
                    'chi_square': 0.0,
                    'sample_size': len(amounts),
                    'message': 'Insufficient data for Benford analysis',
                    'digit_distribution': {}
                }
            
            # Get leading digits
            leading_digits = [self._get_leading_digit(amt) for amt in amounts]
            leading_digits = [d for d in leading_digits if d is not None]
            
            # Calculate observed distribution
            observed_dist = self._calculate_distribution(leading_digits)
            
            # Perform chi-square test
            chi_square, p_value = self._chi_square_test(observed_dist)
            
            # Calculate deviation score (0-1)
            deviation_score = self._calculate_deviation_score(observed_dist)
            
            # Determine if anomalous
            is_anomalous = p_value < self.threshold or deviation_score > 0.3
            
            return {
                'is_anomalous': is_anomalous,
                'deviation_score': round(deviation_score, 4),
                'p_value': round(p_value, 4),
                'chi_square': round(chi_square, 4),
                'sample_size': len(leading_digits),
                'message': self._generate_message(is_anomalous, deviation_score),
                'digit_distribution': {
                    'observed': observed_dist,
                    'expected': self.BENFORD_DISTRIBUTION
                }
            }
            
        except Exception as e:
            return {
                'is_anomalous': False,
                'deviation_score': 0.0,
                'error': str(e),
                'message': 'Error performing Benford analysis'
            }
    
    def _extract_amounts(self, claim_data: Dict) -> List[float]:
        """Extract numerical amounts from claim data"""
        amounts = []
        
        # Primary claim amount
        if 'claim_amount' in claim_data:
            amounts.append(float(claim_data['claim_amount']))
        
        # Sub-amounts if available (line items, etc.)
        if 'line_items' in claim_data:
            for item in claim_data['line_items']:
                if 'amount' in item:
                    amounts.append(float(item['amount']))
        
        # Historical claims for this claimant/provider
        if 'historical_amounts' in claim_data:
            amounts.extend([float(amt) for amt in claim_data['historical_amounts']])
        
        # Related amounts
        if 'related_amounts' in claim_data:
            amounts.extend([float(amt) for amt in claim_data['related_amounts']])
        
        # Filter out zero and negative amounts
        amounts = [amt for amt in amounts if amt > 0]
        
        return amounts
    
    def _get_leading_digit(self, number: float) -> int:
        """Extract the leading digit from a number"""
        try:
            # Convert to string and remove decimal point
            num_str = str(abs(number))
            # Find first non-zero digit
            for char in num_str:
                if char.isdigit() and char != '0':
                    return int(char)
            return None
        except:
            return None
    
    def _calculate_distribution(self, leading_digits: List[int]) -> Dict[int, float]:
        """Calculate the observed distribution of leading digits"""
        total = len(leading_digits)
        distribution = {}
        
        for digit in range(1, 10):
            count = leading_digits.count(digit)
            distribution[digit] = count / total if total > 0 else 0
        
        return distribution
    
    def _chi_square_test(self, observed_dist: Dict[int, float]) -> tuple:
        """
        Perform chi-square test comparing observed to Benford distribution
        
        Returns:
            (chi_square_statistic, p_value)
        """
        observed = [observed_dist.get(i, 0) for i in range(1, 10)]
        expected = [self.BENFORD_DISTRIBUTION[i] for i in range(1, 10)]
        
        # Convert to counts (multiply by 100 for better chi-square test)
        observed_counts = [o * 100 for o in observed]
        expected_counts = [e * 100 for e in expected]
        
        chi_square, p_value = stats.chisquare(observed_counts, expected_counts)
        
        return chi_square, p_value
    
    def _calculate_deviation_score(self, observed_dist: Dict[int, float]) -> float:
        """
        Calculate a deviation score (0-1) from Benford's distribution
        Uses Mean Absolute Deviation (MAD)
        """
        deviations = []
        
        for digit in range(1, 10):
            observed = observed_dist.get(digit, 0)
            expected = self.BENFORD_DISTRIBUTION[digit]
            deviations.append(abs(observed - expected))
        
        # Mean Absolute Deviation
        mad = np.mean(deviations)
        
        # Normalize to 0-1 scale (theoretical max MAD is ~0.22)
        normalized_score = min(mad / 0.22, 1.0)
        
        return normalized_score
    
    def _generate_message(self, is_anomalous: bool, deviation_score: float) -> str:
        """Generate human-readable message about the analysis"""
        if not is_anomalous:
            return "Amount distribution follows Benford's Law - no anomalies detected"
        
        if deviation_score > 0.5:
            return "CRITICAL: Significant deviation from Benford's Law detected - high probability of data manipulation"
        elif deviation_score > 0.3:
            return "WARNING: Notable deviation from Benford's Law - amounts may be fabricated or estimated"
        else:
            return "NOTICE: Minor deviation from Benford's Law detected - warrants further review"
    
    def visualize_distribution(self, claim_data: Dict) -> Dict:
        """
        Generate visualization data comparing observed vs expected distributions
        
        Returns:
            Dict with data ready for charting
        """
        amounts = self._extract_amounts(claim_data)
        leading_digits = [self._get_leading_digit(amt) for amt in amounts]
        leading_digits = [d for d in leading_digits if d is not None]
        
        observed_dist = self._calculate_distribution(leading_digits)
        
        chart_data = {
            'digits': list(range(1, 10)),
            'observed': [observed_dist.get(i, 0) * 100 for i in range(1, 10)],
            'expected': [self.BENFORD_DISTRIBUTION[i] * 100 for i in range(1, 10)],
            'labels': {
                'x': 'Leading Digit',
                'y': 'Frequency (%)',
                'title': "Benford's Law Analysis"
            }
        }
        
        return chart_data
