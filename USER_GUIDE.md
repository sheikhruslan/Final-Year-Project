# User Guide: Hong Kong Insurance Fraud Detection System

## Table of Contents
1. [System Overview](#system-overview)
2. [Dashboard](#dashboard)
3. [Claims Management](#claims-management)
4. [Claim Analysis](#claim-analysis)
5. [Document Upload](#document-upload)
6. [AI Assistant](#ai-assistant)
7. [Understanding Results](#understanding-results)

---

## System Overview

The Hong Kong Insurance Fraud Detection System is an AI-powered platform designed to automatically detect fraudulent insurance claims using:

- **Machine Learning**: XGBoost model trained on historical fraud patterns
- **Statistical Analysis**: Benford's Law for detecting manipulated amounts
- **Rule-Based Detection**: Configurable business rules for known fraud indicators
- **Network Analysis**: Identifying fraud rings and suspicious connections
- **AI Assistant**: Natural language interface for queries and analysis

---

## Dashboard

**Access**: http://localhost:3000/dashboard

### Key Metrics

The dashboard displays four primary metrics:

1. **Total Claims**: Number of claims processed
2. **Flagged Claims**: Claims identified as potentially fraudulent
3. **Detection Rate**: Percentage of claims flagged (Flagged / Total × 100)
4. **Amount at Risk**: Total monetary value of flagged claims in HK$

### Visualizations

**Claims Trend Chart**
- Shows daily/weekly/monthly claims volume
- Blue line: Total claims submitted
- Red line: Fraudulent claims detected
- Use this to identify spikes or patterns

**Risk Distribution Pie Chart**
- Green: Low risk claims (0-24 score)
- Yellow: Medium risk (25-49)
- Orange: High risk (50-74)
- Red: Critical risk (75-100)

**Average Risk Score Trend**
- Bar chart showing fraud detection over time
- Helps identify temporal patterns

### Using the Dashboard

- **Monitor in real-time**: Dashboard updates automatically
- **Date filtering**: Select date ranges for focused analysis
- **Drill-down**: Click on metrics to see detailed breakdowns

---

## Claims Management

**Access**: http://localhost:3000/claims

### Viewing Claims

The claims list displays all processed claims with:
- **Claim ID**: Unique identifier
- **Claimant**: Name of the person making the claim
- **Provider**: Healthcare provider/hospital
- **Amount**: Claim amount in HK$
- **Date**: Claim submission date
- **Risk Level**: Color-coded risk assessment
- **Status**: Processing status (Pending/Reviewed/Approved/Rejected)

### Filtering Claims

Use the filter dropdowns to narrow down claims:

**By Status**:
- Pending: Awaiting review
- Reviewed: Analysis complete
- Approved: Claim approved for payment
- Rejected: Claim denied (likely fraudulent)

**By Risk Level**:
- Low: Safe to approve
- Medium: Requires light review
- High: Requires thorough investigation
- Critical: Immediate investigation needed

### Sorting and Pagination

- **Sorting**: Click column headers to sort
- **Pagination**: Navigate through pages using bottom controls
- **Items per page**: Adjust from 10 to 100 claims per page

### Viewing Details

Click the **eye icon** (👁️) to view full analysis for any claim.

---

## Claim Analysis

**Access**: Click on any claim from the Claims List

### Risk Score Section

**Overall Score (0-100)**
- 0-24: ✅ Low Risk - Standard processing
- 25-49: ⚡ Medium Risk - Light review recommended
- 50-74: ⚠️ High Risk - Thorough investigation required
- 75-100: 🚨 Critical Risk - Immediate action needed

**Confidence Interval**
- Shows the range of uncertainty in the prediction
- Narrower range = more confident prediction
- Example: "72.5 - 85.3" means the system is confident the risk is in this range

### Component Breakdown

The system combines three detection methods:

**1. Machine Learning (ML) Score**
- Based on patterns learned from historical data
- Considers: amount, timing, provider history, claimant behavior
- Weight: 50% of final score

**2. Benford's Law Score**
- Statistical test for manipulated numbers
- Natural data follows Benford's distribution
- Fabricated data deviates from expected pattern
- Weight: 25% of final score

**3. Rule-Based Score**
- Triggered by specific business rules
- Examples: Early claims, round amounts, high-risk providers
- Weight: 25% of final score

### Claim Details

View essential information:
- Claimant name and ID
- Provider name and ID
- Claim amount in HK$
- Claim submission date
- Policy inception date
- Treatment/diagnosis codes
- Geographic location (district)

### Flagged Rules

Lists specific rules that were triggered:

**Severity Levels**:
- 🔴 **Critical**: Requires immediate investigation
- 🟠 **High**: Strong fraud indicator
- 🟡 **Medium**: Potential concern
- 🟢 **Low**: Minor irregularity

**Common Rules**:
- RULE_001: High Claim Amount (>HK$200,000)
- RULE_002: Early Claim (submitted <30 days after policy start)
- RULE_003: Weekend Submission (unusual timing)
- RULE_004: Round Number Amount (suggests estimation)
- RULE_005: High-Risk Provider (history of fraud)

### Top Risk Factors

Shows which features contributed most to the risk score:

**Feature Contributions**:
- **Claim Amount**: How much the amount influenced the score
- **Days Since Policy**: Time between policy start and claim
- **Provider Risk**: Historical fraud rate of the provider
- **Claim Frequency**: How often claimant has filed claims
- **Treatment Code**: Risk associated with the procedure
- **Location Risk**: Geographic fraud patterns

Each factor shows:
- Current value
- Contribution to risk score
- Overall importance in the model

### Investigator Recommendations

AI-generated action items based on the analysis:

**Critical Risk (75-100)**:
- 🚨 Initiate full investigation immediately
- Contact claimant for additional documentation
- Verify provider credentials and license

**High Risk (50-74)**:
- Review all recent claims from this provider
- Cross-reference with HKFI fraud database
- Request supporting medical records

**Medium Risk (25-49)**:
- Request additional supporting documents
- Verify treatment was actually provided
- Check for duplicate claims

**Low Risk (0-24)**:
- ✅ Standard processing recommended
- No additional review required

### Actions

**Re-analyze Button**: Trigger fresh analysis with updated data

**Generate Report Button**: Create PDF report for documentation

---

## Document Upload

**Access**: http://localhost:3000/upload

### Uploading Claims

1. **Drag and drop** a file into the upload area
   - OR click to browse and select a file

2. **Supported Formats**:
   - PDF documents (.pdf)
   - Images (.png, .jpg, .jpeg)
   - Word documents (.docx)
   - Maximum size: 10MB

3. **Processing**:
   - System performs OCR (Optical Character Recognition)
   - Extracts structured data from the document
   - Displays extracted information for verification

### Extracted Information

The system automatically extracts:
- Policy number
- Claimant name and ID
- Provider name and ID
- Claim amount
- Treatment code
- Diagnosis code
- Hospital/clinic name
- Location (district)
- Claim date

**Extraction Confidence**:
- Shows how confident the OCR system is
- >90%: Very reliable
- 70-90%: Good, but verify key fields
- <70%: Manual verification recommended

### Next Steps

After extraction:
1. **Review** the extracted data for accuracy
2. **Edit** any incorrect fields (future feature)
3. **Click "Analyze Claim"** to run fraud detection
4. **Or "Clear"** to start over

---

## AI Assistant

**Access**: http://localhost:3000/chat

### What the AI Can Do

The AI assistant helps with:

**1. Data Queries**
- "How many claims were flagged today?"
- "What's the average claim amount?"
- "Show me high-risk claims from last week"

**2. Visualizations**
- "Generate a chart of fraud trends"
- "Plot risk score distribution"
- "Show me provider fraud rates"

**3. Explanations**
- "Explain how Benford's Law works"
- "Why was claim CLM12345678 flagged?"
- "What are the top risk factors?"

**4. Analysis**
- "Analyze claim CLM12345678"
- "Compare this month to last month"
- "Find similar fraud patterns"

### Using the Chat

1. **Type your question** in the input box
2. **Press Enter** or click the send button
3. **Wait for response** - typically 2-5 seconds
4. **Follow up** with additional questions

**Quick Suggestions**:
Click any of the suggestion chips below the input box:
- "Analyze claim CLM12345678"
- "Show fraud trends"
- "Top risk factors"

### Tips for Better Results

**Be Specific**:
❌ "Show me data"
✅ "Show me high-risk claims from the last 30 days"

**Use Claim IDs**:
❌ "Check that claim"
✅ "Analyze claim CLM12345678"

**Ask Follow-ups**:
"Tell me more about that"
"Can you generate a chart?"
"Why was this flagged?"

### Code Generation

The AI can generate Python code for custom analysis:

**Example Request**:
"Generate a chart showing monthly fraud counts"

**AI Response**:
- Provides explanation
- Shows Python code
- Can execute the code to generate visualization

---

## Understanding Results

### How Fraud Detection Works

**Multi-Layered Approach**:

The system uses three independent methods that work together:

**1. Machine Learning (XGBoost)**
- Trained on 10,000+ historical claims
- Learns complex patterns humans might miss
- Considers 20+ features simultaneously
- Predicts fraud probability (0-1)

**2. Benford's Law Analysis**
- Mathematical law about digit distribution
- In natural data, "1" appears ~30% as first digit
- Fraudsters create uniform or rounded numbers
- Measures deviation from expected distribution

**3. Rule-Based Checks**
- Expert-defined business rules
- Based on known fraud tactics
- Examples:
  - Claim submitted 1 day after policy starts
  - Amount is exactly HK$50,000 (too round)
  - Provider has 80% fraud rate historically

### Risk Score Calculation

**Formula**:
```
Overall Score = (ML Score × 50%) + (Benford Score × 25%) + (Rule Score × 25%)
```

**Example**:
- ML predicts 85% fraud → ML Score = 85
- Benford deviation is moderate → Benford Score = 60
- 2 high-severity rules triggered → Rule Score = 75

Overall = (85 × 0.5) + (60 × 0.25) + (75 × 0.25) = **76.25** (Critical)

### Confidence Intervals

Shows uncertainty in predictions:

**Narrow Interval (e.g., 73.5 - 78.5)**:
- High confidence
- Strong evidence
- Reliable prediction

**Wide Interval (e.g., 55.0 - 85.0)**:
- Lower confidence
- Mixed signals
- Requires human judgment

### When to Trust the System

**High Trust (Automate)**:
- Low risk score (0-24) + narrow confidence
- No rules triggered
- Normal Benford's distribution

**Medium Trust (Review)**:
- Medium risk (25-49)
- Some minor flags
- Moderate Benford deviation

**Low Trust (Investigate)**:
- High/Critical risk (50-100)
- Multiple rule violations
- Strong Benford anomaly

**Always Investigate**:
- Critical risk (75-100)
- Multiple critical rules
- Large claim amounts (>HK$200K)

### False Positives

The system may flag legitimate claims if:
- Claim is unusually large but valid
- Timing coincidentally seems suspicious
- Provider is new/unestablished
- Data entry errors caused anomalies

**What to Do**:
1. Review flagged rules carefully
2. Check supporting documentation
3. Verify with claimant/provider if needed
4. Override system decision with justification

### Performance Metrics

**Detection Rate**: ~12-15%
- Percentage of claims flagged
- Industry standard: 10-15%

**Accuracy**: ~85-90% (with trained model)
- How often predictions are correct
- Improves with more training data

**False Positive Rate**: ~5-10%
- Legitimate claims wrongly flagged
- Balanced to catch fraud while minimizing errors

---

## Best Practices

### For Investigators

1. **Always review high-risk claims manually**
2. **Don't ignore low-risk claims completely** - spot check regularly
3. **Document your decisions** - override system when appropriate
4. **Provide feedback** - help improve the model
5. **Stay updated** - new fraud patterns emerge constantly

### For Administrators

1. **Monitor dashboard daily** - watch for unusual patterns
2. **Review provider statistics** - identify high-risk providers
3. **Update rules regularly** - adapt to new fraud tactics
4. **Train staff** - ensure everyone understands the system
5. **Audit decisions** - review both approvals and rejections

### For Data Quality

1. **Ensure accurate OCR** - verify extracted data
2. **Maintain clean records** - update provider/claimant info
3. **Label training data** - mark confirmed fraud/legitimate
4. **Monitor data drift** - claim patterns change over time
5. **Regular retraining** - update ML model quarterly

---

## Keyboard Shortcuts

- **Dashboard**: Home key
- **Claims List**: Ctrl+L
- **Upload**: Ctrl+U
- **AI Chat**: Ctrl+K
- **Search Claims**: Ctrl+F (on claims page)

---

## Need Help?

### Common Questions

**Q: Why was a legitimate claim flagged?**
A: Review the flagged rules. It may be a coincidental pattern. Use your judgment to override.

**Q: Can I adjust the risk thresholds?**
A: Yes, administrators can configure thresholds in the backend settings.

**Q: How often should I retrain the model?**
A: Recommended every 3-6 months, or when fraud patterns change significantly.

**Q: What if OCR extraction is wrong?**
A: You can manually edit fields before analysis (future feature), or reprocess the document.

**Q: Is my data secure?**
A: Yes, all data is encrypted and stored locally. No external data sharing except HKFI API.

---

## Glossary

**Benford's Law**: Statistical phenomenon about digit distribution in natural data

**Confidence Interval**: Range showing prediction uncertainty

**Feature**: Data point used by ML model (e.g., claim amount, timing)

**Feature Contribution**: How much a feature influenced the prediction

**Feature Importance**: How useful a feature is overall in the model

**False Positive**: Legitimate claim incorrectly flagged as fraud

**False Negative**: Fraudulent claim incorrectly marked as legitimate

**OCR**: Optical Character Recognition - extracting text from images

**Risk Score**: 0-100 number indicating fraud likelihood

**SHAP Values**: Explanation technique showing feature contributions

**XGBoost**: Machine learning algorithm (eXtreme Gradient Boosting)

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**For**: Insurance Investigators, Hong Kong Market
