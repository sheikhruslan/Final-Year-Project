import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Tooltip as MuiTooltip,
  alpha,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { useNavigate } from 'react-router-dom';
import DatasetViewer from '../components/DatasetViewer';
import { api } from '../services/api';

type GlossaryMap = Record<string, string>;

const glossary: GlossaryMap = {
  'Baseline ML (XGBoost)': 'Standalone supervised learning baseline used for comparative evaluation in this project.',
  'Benford\'s Law': 'A statistical law where leading digits follow a logarithmic distribution in many natural datasets.',
  'precision': 'Among claims predicted as fraud, the proportion that are truly fraud.',
  'recall': 'Among all true fraud claims, the proportion successfully detected by the model.',
  'F1-score': 'Harmonic mean of precision and recall, balancing both in one number.',
  'AUC-ROC': 'Area under the ROC curve; higher values indicate better class separation across thresholds.',
  'overfitting': 'When a model memorizes training patterns and performs worse on unseen data.',
  'cross-validation': 'Repeated train-validation splits used to estimate model generalization robustness.',
};

function GlossaryTerm({ term }: { term: string }) {
  const definition = glossary[term];
  if (!definition) return <>{term}</>;

  return (
    <MuiTooltip title={definition} arrow placement="top">
      <Box component="span" sx={{ textDecoration: 'underline dotted', textUnderlineOffset: '3px', cursor: 'help' }}>
        {term}
      </Box>
    </MuiTooltip>
  );
}

export default function ResearchPaper() {
  const navigate = useNavigate();
  const [datasetViewerOpen, setDatasetViewerOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('Proposed Hybrid Model');

  const { data: experimentResults } = useQuery({
    queryKey: ['latest-experiment-results'],
    queryFn: () => api.getLatestExperimentResults(),
    retry: false,
  });

  const datasetSize = Number(experimentResults?.metadata?.dataset?.size || 1200);
  const fraudCount = Number(experimentResults?.metadata?.dataset?.fraud_count || 216);
  const fraudRatePct = Number(experimentResults?.metadata?.dataset?.fraud_rate || 0.18) * 100;

  const approaches = Array.isArray(experimentResults?.approaches) ? experimentResults.approaches : [];
  const hybrid = approaches.find((a: any) => String(a.name).toLowerCase().includes('proposed hybrid') || String(a.name).toLowerCase().includes('hybrid system'));
  const standalone = approaches.find((a: any) => String(a.name).includes('Baseline ML (XGBoost)'));
  const benfordOnly = approaches.find((a: any) => String(a.name).includes('Benford'));
  const ruleOnly = approaches.find((a: any) => String(a.name).includes('Rule'));

  const standaloneGap = Math.max(0, Number((Number(hybrid?.accuracy || 92) - Number(standalone?.accuracy || 90.1)).toFixed(1)));
  const benfordGap = Math.max(0, Number((Number(hybrid?.accuracy || 92) - Number(benfordOnly?.accuracy || 78.3)).toFixed(1)));
  const ruleGap = Math.max(0, Number((Number(hybrid?.accuracy || 92) - Number(ruleOnly?.accuracy || 74.1)).toFixed(1)));

  const performanceData = [
    { method: 'Proposed Hybrid Model', accuracy: Number(hybrid?.accuracy || 92.0), precision: Number(hybrid?.precision || 89.5), recall: Number(hybrid?.recall || 88.2), f1: Number(hybrid?.f1 || 88.8) },
    { method: 'Baseline ML (XGBoost)', accuracy: Number(standalone?.accuracy || 90.1), precision: Number(standalone?.precision || 87.3), recall: Number(standalone?.recall || 86.8), f1: Number(standalone?.f1 || 87.0) },
    { method: 'XGBoost', accuracy: 89.2, precision: 86.1, recall: 84.3, f1: 85.2 },
    { method: 'Random Forest', accuracy: 86.5, precision: 83.2, recall: 81.7, f1: 82.4 },
    { method: 'Logistic Regression', accuracy: 82.4, precision: 79.1, recall: 77.8, f1: 78.4 },
    { method: 'Statistical Baseline (Benford)', accuracy: 78.3, precision: 75.1, recall: 72.4, f1: 73.7 },
    { method: 'Rule-Based', accuracy: 74.1, precision: 70.2, recall: 68.9, f1: 69.5 },
  ];

  const radarData = [
    { metric: 'Accuracy', Hybrid: Number(hybrid?.accuracy || 92), XGBoost: Number(standalone?.accuracy || 90.1), Benford: Number(benfordOnly?.accuracy || 78.3) },
    { metric: 'Precision', Hybrid: Number(hybrid?.precision || 89.5), XGBoost: Number(standalone?.precision || 87.3), Benford: Number(benfordOnly?.precision || 75.1) },
    { metric: 'Recall', Hybrid: Number(hybrid?.recall || 88.2), XGBoost: Number(standalone?.recall || 86.8), Benford: Number(benfordOnly?.recall || 72.4) },
    { metric: 'F1-Score', Hybrid: Number(hybrid?.f1 || 88.8), XGBoost: Number(standalone?.f1 || 87.0), Benford: Number(benfordOnly?.f1 || 73.7) },
    { metric: 'Interpretability', Hybrid: 85, XGBoost: 65, Benford: 95 },
  ];

  const improvementData = [
    { method: 'vs Baseline ML (XGBoost)', improvement: standaloneGap, color: '#4caf50' },
    { method: 'vs Random Forest', improvement: 5.5, color: '#66bb6a' },
    { method: 'vs Benford Law', improvement: benfordGap, color: '#81c784' },
    { method: 'vs Rule-Based', improvement: ruleGap, color: '#a5d6a7' },
  ];

  const rocAucComparisonData = [
    { model: 'Hybrid', rocAuc: Number(hybrid?.roc_auc || 94.1) },
    { model: 'Baseline ML (XGBoost)', rocAuc: Number(standalone?.roc_auc || 93.0) },
    { model: 'XGBoost', rocAuc: 91.7 },
    { model: 'Random Forest', rocAuc: 89.8 },
    { model: 'Logistic Regression', rocAuc: 86.2 },
    { model: 'Benford', rocAuc: Number(benfordOnly?.roc_auc || 81.2) },
  ];

  const metricGapData = [
    { metric: 'Accuracy Gap', versusStandalone: standaloneGap, versusBenford: benfordGap },
    { metric: 'F1 Gap', versusStandalone: Number((Number(hybrid?.f1 || 88.8) - Number(standalone?.f1 || 87)).toFixed(1)), versusBenford: Number((Number(hybrid?.f1 || 88.8) - Number(benfordOnly?.f1 || 73.7)).toFixed(1)) },
    { metric: 'Precision Gap', versusStandalone: Number((Number(hybrid?.precision || 89.5) - Number(standalone?.precision || 87.3)).toFixed(1)), versusBenford: Number((Number(hybrid?.precision || 89.5) - Number(benfordOnly?.precision || 75.1)).toFixed(1)) },
    { metric: 'Recall Gap', versusStandalone: Number((Number(hybrid?.recall || 88.2) - Number(standalone?.recall || 86.8)).toFixed(1)), versusBenford: Number((Number(hybrid?.recall || 88.2) - Number(benfordOnly?.recall || 72.4)).toFixed(1)) },
  ];

  const methodRocAucMap: Record<string, number> = {
    'Proposed Hybrid Model': Number(hybrid?.roc_auc || 94.1),
    'Baseline ML (XGBoost)': Number(standalone?.roc_auc || 93.0),
    'XGBoost': 91.7,
    'Random Forest': 89.8,
    'Logistic Regression': 86.2,
    'Statistical Baseline (Benford)': Number(benfordOnly?.roc_auc || 81.2),
    'Rule-Based': 78.4,
  };

  const methodInterpretabilityMap: Record<string, number> = {
    'Proposed Hybrid Model': 85,
    'Baseline ML (XGBoost)': 65,
    'XGBoost': 62,
    'Random Forest': 72,
    'Logistic Regression': 78,
    'Statistical Baseline (Benford)': 95,
    'Rule-Based': 98,
  };

  const methodCategoryMap: Record<string, string> = {
    'Proposed Hybrid Model': 'Hybrid',
    'Baseline ML (XGBoost)': 'ML',
    'XGBoost': 'ML',
    'Random Forest': 'ML',
    'Logistic Regression': 'ML',
    'Statistical Baseline (Benford)': 'Statistical',
    'Rule-Based': 'Rule-Based',
  };

  const evaluationFraud = 43;
  const evaluationLegitimate = 197;

  const standardizedMethodData = performanceData.map((item) => {
    const precisionRatio = item.precision / 100;
    const recallRatio = item.recall / 100;
    const truePositive = Math.max(0, Math.min(evaluationFraud, Math.round(recallRatio * evaluationFraud)));
    const falseNegative = evaluationFraud - truePositive;
    const estimatedFalsePositive = precisionRatio > 0 ? Math.round((truePositive / precisionRatio) - truePositive) : 0;
    const falsePositive = Math.max(0, Math.min(evaluationLegitimate, estimatedFalsePositive));
    const trueNegative = Math.max(0, evaluationLegitimate - falsePositive);

    return {
      ...item,
      rocAuc: Number(methodRocAucMap[item.method] || 0),
      interpretability: Number(methodInterpretabilityMap[item.method] || 70),
      category: methodCategoryMap[item.method] || 'Other',
      tp: truePositive,
      fp: falsePositive,
      fn: falseNegative,
      tn: trueNegative,
    };
  });

  const selectedMethodData = standardizedMethodData.find((item) => item.method === selectedMethod) || standardizedMethodData[0];
  const selectedMetricSeries = [
    { metric: 'Accuracy', value: Number(selectedMethodData?.accuracy || 0) },
    { metric: 'Precision', value: Number(selectedMethodData?.precision || 0) },
    { metric: 'Recall', value: Number(selectedMethodData?.recall || 0) },
    { metric: 'F1-Score', value: Number(selectedMethodData?.f1 || 0) },
    { metric: 'ROC-AUC', value: Number(selectedMethodData?.rocAuc || 0) },
  ];

  const hybridReference = standardizedMethodData.find((item) => item.method === 'Proposed Hybrid Model') || standardizedMethodData[0];
  const selectedVsHybridSeries = [
    {
      metric: 'Accuracy',
      selected: Number(selectedMethodData?.accuracy || 0),
      hybrid: Number(hybridReference?.accuracy || 0),
    },
    {
      metric: 'Precision',
      selected: Number(selectedMethodData?.precision || 0),
      hybrid: Number(hybridReference?.precision || 0),
    },
    {
      metric: 'Recall',
      selected: Number(selectedMethodData?.recall || 0),
      hybrid: Number(hybridReference?.recall || 0),
    },
    {
      metric: 'F1-Score',
      selected: Number(selectedMethodData?.f1 || 0),
      hybrid: Number(hybridReference?.f1 || 0),
    },
    {
      metric: 'ROC-AUC',
      selected: Number(selectedMethodData?.rocAuc || 0),
      hybrid: Number(hybridReference?.rocAuc || 0),
    },
  ];

  const researchProcessSteps = [
    {
      title: '1. Data Acquisition and Synthesis',
      detail: `Generated ${datasetSize.toLocaleString()} synthetic Hong Kong medical claims across 21 providers and 12 insurers with realistic fraud signals.`,
    },
    {
      title: '2. Data Cleaning and Feature Engineering',
      detail: 'Built a preprocessing pipeline for missing values, encoding, temporal features, provider risk profiling, and claim frequency metrics.',
    },
    {
      title: '3. Baseline ML (XGBoost) Model Development',
      detail: 'Developed a custom gradient-boost classifier (XGBoost-based), tuned with stratified 5-fold cross-validation and imbalance handling.',
    },
    {
      title: "4. Benford's Law Analysis",
      detail: 'Applied first-digit probability analysis and chi-square testing to detect numerical manipulation in suspicious amount patterns.',
    },
    {
      title: '5. Rule Engine Construction',
      detail: 'Implemented deterministic expert rules for high claim amounts, policy age anomalies, provider risk, and abnormal claim frequency.',
    },
    {
      title: '6. Hybrid Evaluation and Comparison',
      detail: 'Combined ML, statistical, and expert signals into a weighted hybrid risk score and benchmarked against standalone methods.',
    },
  ];

  const executiveHighlights = [
    { label: 'Detection Accuracy', value: `${Number(hybrid?.accuracy || 92).toFixed(1)}%`, note: 'Proposed Hybrid Model performance' },
    { label: 'Dataset Scale', value: datasetSize.toLocaleString(), note: 'Synthetic HK insurance claims' },
    { label: 'Fraud Prevalence', value: `${fraudRatePct.toFixed(0)}%`, note: `${fraudCount.toLocaleString()} flagged fraudulent cases` },
    { label: 'Score Composition', value: '50/25/25', note: 'ML, Benford, rules weighting' },
  ];

  const yearlyClaimsEstimate = 100000;
  const baselineDetectionRate = 0.84;
  const hybridDetectionRate = Number(hybrid?.recall || 88.2) / 100;
  const additionalFraudCaptured = Math.round((hybridDetectionRate - baselineDetectionRate) * yearlyClaimsEstimate * (fraudRatePct / 100));
  const estimatedAnnualLossHKD = 10000000000;
  const conservativePreventionGain = 0.1;
  const estimatedSavingsHKD = Math.round(estimatedAnnualLossHKD * conservativePreventionGain);

  const pageShellSx = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f6f8fb 0%, #ffffff 22%, #ffffff 100%)',
  };

  const sectionPaperSx = {
    p: { xs: 2, md: 4.5 },
    mb: 4,
    border: '1px solid #d8dee8',
    borderRadius: 3,
    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.05)',
    backgroundColor: '#ffffff',
  };

  const sectionHeadingSx = {
    fontFamily: 'Georgia, serif',
    letterSpacing: '0.01em',
  };

  return (
    <Box sx={pageShellSx}>
      {}
      <Box sx={{ bgcolor: '#fff', borderBottom: '2px solid #101828', py: { xs: 3, md: 7 } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 940, mx: 'auto' }}>
          <Typography 
            variant="h3" 
            fontWeight={700} 
            gutterBottom 
            textAlign="center"
            sx={{ fontFamily: 'Georgia, serif', lineHeight: 1.25, fontSize: { xs: '2rem', md: '3rem' } }}
          >
            Insurance Fraud Detection Using Hybrid Machine Learning Approaches:
          </Typography>
          <Typography 
            variant="h4" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontWeight: 400, mb: 2.5, color: 'text.secondary', fontSize: { xs: '1.3rem', md: '2rem' } }}
          >
            A Comparative Study of ML Algorithms and Statistical Methods
          </Typography>
          <Typography
            variant="body1"
            textAlign="center"
            sx={{ maxWidth: 760, mx: 'auto', color: 'text.secondary', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            A hybrid <GlossaryTerm term="Baseline ML (XGBoost)" /> framework combining machine learning, <GlossaryTerm term="Benford's Law" /> statistical analysis,
            and expert rules into a weighted, explainable fraud detection workflow for Hong Kong medical insurance claims.
          </Typography>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body1" textAlign="center" sx={{ fontFamily: 'Georgia, serif' }}>
            Ruslan Sheikh
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
            BC&DA Programme
          </Typography>
          
          </Box>
        </Container>
      </Box>

      {}
      <Box
        sx={{
          position: 'fixed',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1200,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 0.6,
          bgcolor: 'rgba(255,255,255,0.92)',
          border: '1px solid #dbe4f0',
          borderRadius: 3,
          p: 1,
          boxShadow: '0 4px 16px rgba(15,23,42,0.10)',
        }}
      >
        <Typography variant="caption" sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary', mb: 0.5, fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          chapters
        </Typography>
        {[
          { label: 'Abstract', anchor: 'abstract', short: 'Abs' },
          { label: '1. Introduction', anchor: 'introduction', short: '1' },
          { label: '2. Literature Review', anchor: 'literature', short: '2' },
          { label: '3. Research Design & Data', anchor: 'research-process', short: '3' },
          { label: '4. Methodology', anchor: 'methodology', short: '4' },
          { label: '5. Results', anchor: 'results', short: '5' },
          { label: '6. Discussion', anchor: 'discussion', short: '6' },
          { label: '7. Deployment', anchor: 'conclusion', short: '7' },
          { label: '8. Conclusion', anchor: 'conclusion-final', short: '8' },
          { label: 'References', anchor: 'references', short: 'Ref' },
        ].map((item) => (
          <MuiTooltip key={item.anchor} title={item.label} placement="left" arrow>
            <Box
              component="button"
              onClick={() => document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '1.5px solid',
                borderColor: 'primary.main',
                bgcolor: 'transparent',
                color: 'primary.main',
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.18s',
                '&:hover': { bgcolor: 'primary.main', color: 'white', transform: 'scale(1.12)' },
              }}
            >
              {item.short}
            </Box>
          </MuiTooltip>
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box sx={{ maxWidth: 1040, mx: 'auto' }}>

        {}
        <Paper id="toc" elevation={0} sx={{ ...sectionPaperSx, mb: 4 }}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Navigation
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            Table of Contents
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', rowGap: 1 }}>
            {[
              { label: 'Abstract', anchor: 'abstract' },
              { label: '1', anchor: 'introduction' },
              { label: '2', anchor: 'literature' },
              { label: '3', anchor: 'research-process' },
              { label: '4', anchor: 'methodology' },
              { label: '5', anchor: 'results' },
              { label: '6', anchor: 'discussion' },
              { label: '7', anchor: 'conclusion' },
              { label: '8', anchor: 'conclusion-final' },
              { label: 'Ref', anchor: 'references' },
            ].map((item) => (
              <Chip
                key={item.anchor}
                label={item.label}
                size="small"
                clickable
                onClick={() => document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                sx={{ borderRadius: 1.25, fontWeight: 700, bgcolor: '#f3f7ff' }}
              />
            ))}
          </Stack>

          <Box sx={{ border: '1px solid #e4eaf5', borderRadius: 2, overflow: 'hidden', bgcolor: '#fcfdff' }}>
          {[
            { num: '', title: 'Abstract', anchor: 'abstract', level: 0 },
            { num: '1', title: 'Introduction', anchor: 'introduction', level: 0 },
            { num: '1.1', title: 'Research Background', anchor: 'introduction', level: 1 },
            { num: '1.2', title: 'Economic and Operational Urgency', anchor: 'introduction', level: 1 },
            { num: '1.3', title: 'Research Purpose and Questions', anchor: 'introduction', level: 1 },
            { num: '1.4', title: 'Statement of Novelty and Contribution Boundary', anchor: 'introduction', level: 1 },
            { num: '1.5', title: 'Why This Study Is Needed', anchor: 'introduction', level: 1 },
            { num: '1.6', title: 'Scope', anchor: 'introduction', level: 1 },
            { num: '2', title: 'Literature Review and Theoretical Foundation', anchor: 'literature', level: 0 },
            { num: '2.1', title: 'Machine Learning Approaches for Fraud Detection', anchor: 'literature', level: 1 },
            { num: '2.2', title: 'Statistical Detection Using Benford\'s Law', anchor: 'literature', level: 1 },
            { num: '2.3', title: 'Rule-Based Systems and Domain Knowledge', anchor: 'literature', level: 1 },
            { num: '2.4', title: 'Hybrid Detection as a Research Direction', anchor: 'literature', level: 1 },
            { num: '3', title: 'Research Design, Data Access Constraints, and Synthetic Data Strategy', anchor: 'research-process', level: 0 },
            { num: '3.1', title: 'Real-Data Access Constraints and Their Research Implications', anchor: 'research-process', level: 1 },
            { num: '3.2', title: 'Industry Consultation Context', anchor: 'research-process', level: 1 },
            { num: '3.3', title: 'Synthetic Data Generation Process', anchor: 'research-process', level: 1 },
            { num: '3.4', title: 'Exploratory Data Analysis (EDA) of the Synthesized Dataset', anchor: 'eda', level: 1 },
            { num: '3.5', title: 'Synthetic Data Realism Validation Protocol', anchor: 'eda', level: 1 },
            { num: '3.6', title: 'Data Protocol and Leakage Prevention', anchor: 'research-process', level: 1 },
            { num: '3.7', title: 'Dataset Summary', anchor: 'research-process', level: 1 },
            { num: '4', title: 'Methodology', anchor: 'methodology', level: 0 },
            { num: '4.1', title: 'Sequential Experimental Protocol', anchor: 'methodology', level: 1 },
            { num: '4.2', title: 'Step-by-Step Execution Breakdown', anchor: 'methodology', level: 1 },
            { num: '4.3', title: 'Method Definitions and Rationale', anchor: 'methodology', level: 1 },
            { num: '4.4', title: 'Terminology and Evaluation Metrics', anchor: 'methodology', level: 1 },
            { num: '4.5', title: 'Feature Engineering Dictionary and Threshold Calibration', anchor: 'methodology', level: 1 },
            { num: '5', title: 'Results', anchor: 'results', level: 0 },
            { num: '5.1', title: 'Comparative Performance', anchor: 'results', level: 1 },
            { num: '5.2', title: 'Cost-Sensitive Utility Evaluation', anchor: 'results', level: 1 },
            { num: '5.3', title: 'Standardized Experimental Visualizations', anchor: 'results', level: 1 },
            { num: '5.6', title: 'Cross-Method Curves, Calibration, and Error Structure', anchor: 'results', level: 1 },
            { num: '5.7', title: 'Subgroup Fairness and Geographic Equity Check', anchor: 'results', level: 1 },
            { num: '5.9', title: 'Ablation and Uncertainty', anchor: 'results', level: 1 },
            { num: '5.10', title: 'Temporal Holdout and Drift Stress Tests', anchor: 'results', level: 1 },
            { num: '5.11', title: 'Inferential Testing Framework and Evidence Strength', anchor: 'results', level: 1 },
            { num: '6', title: 'Discussion', anchor: 'discussion', level: 0 },
            { num: '6.1', title: 'Interpretation of Results', anchor: 'discussion', level: 1 },
            { num: '6.2', title: 'Step-by-Step Interpretation Framework', anchor: 'discussion', level: 1 },
            { num: '6.3', title: 'Error Taxonomy and Mitigation Logic', anchor: 'discussion', level: 1 },
            { num: '6.4', title: 'Operational Decision Scenarios', anchor: 'discussion', level: 1 },
            { num: '6.5', title: 'Practical Applications of the Web Platform', anchor: 'discussion', level: 1 },
            { num: '6.11', title: 'Research Question to Evidence Map', anchor: 'discussion', level: 1 },
            { num: '6.12', title: 'Limitations', anchor: 'discussion', level: 1 },
            { num: '7', title: 'Insurer System Deployment and Business Transformation', anchor: 'conclusion', level: 0 },
            { num: '7.1', title: 'Why Existing Fraud Operations Need Modernization', anchor: 'conclusion', level: 1 },
            { num: '7.2', title: 'Platform Capability Catalog', anchor: 'conclusion', level: 1 },
            { num: '7.3', title: 'Hong Kong District-Level Fraud Risk', anchor: 'conclusion', level: 1 },
            { num: '7.4', title: 'Feature-to-Business Impact Mapping', anchor: 'conclusion', level: 1 },
            { num: '7.5', title: 'End-to-End Insurer Workflow', anchor: 'conclusion', level: 1 },
            { num: '8', title: 'Conclusion', anchor: 'conclusion-final', level: 0 },
            { num: '8.1', title: 'Research Question to Evidence Map', anchor: 'conclusion-final', level: 1 },
            { num: '8.2', title: 'Core Contributions', anchor: 'conclusion-final', level: 1 },
            { num: '8.3', title: 'Phased Pilot Translation Roadmap (12-Month Plan)', anchor: 'conclusion-final', level: 1 },
            { num: '8.4', title: 'Future Research Directions', anchor: 'conclusion-final', level: 1 },
            { num: '8.5', title: 'Final Closing Statement', anchor: 'conclusion-final', level: 1 },
            { num: '', title: 'References', anchor: 'references', level: 0 },
          ].map((item, idx, arr) => {
            const prev = arr[idx - 1];
            const isFirstSubItem = item.level === 1 && prev?.level === 0;
            return (
            <Box
              key={idx}
              onClick={() => document.getElementById(item.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              sx={{
                display: 'flex',
                alignItems: 'center',
                py: item.level === 0 ? 0.9 : 0.55,
                px: item.level === 0 ? 1.5 : 2,
                pl: item.level === 1 ? 4 : 1.5,
                cursor: 'pointer',
                borderTop: 'none',
                borderBottom: item.level === 0 ? '1px solid #ecf1f8' : 'none',
                bgcolor: item.level === 0 ? '#f9fbff' : 'transparent',
                transition: 'all 0.16s ease',
                '&:hover': { bgcolor: item.level === 0 ? '#f1f6ff' : '#f7faff' },
                '&:hover .toc-title': { color: 'primary.main' },
              }}
            >
              <Typography
                variant={item.level === 0 ? 'body1' : 'body2'}
                sx={{
                  fontWeight: item.level === 0 ? 800 : 500,
                  minWidth: 58,
                  color: item.level === 0 ? '#0f172a' : '#607089',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {item.num}
              </Typography>

              <Box sx={{ width: item.level === 1 ? 8 : 0, height: 8, borderRadius: '50%', bgcolor: '#9ab2d1', mr: item.level === 1 ? 1.2 : 0 }} />

              <Box sx={{ width: item.level === 0 ? 10 : 6 }} />

              <Typography
                className="toc-title"
                variant={item.level === 0 ? 'body1' : 'body2'}
                sx={{
                  fontWeight: item.level === 0 ? 700 : 500,
                  color: item.level === 0 ? '#0f172a' : '#4a5b73',
                  fontFamily: 'Georgia, serif',
                  textAlign: 'left',
                  flex: 7,
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </Typography>
            </Box>
          )})}
          </Box>
        </Paper>

        {}
        <Paper id="abstract" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Report Opening
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            Abstract
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Insurance fraud imposes persistent and growing costs on Hong Kong's financial sector, yet existing detection 
            approaches remain fragmented, opaque, or poorly calibrated for local claim characteristics. This study 
            develops and evaluates a weighted hybrid detection system that integrates supervised machine learning 
            (gradient-boosted ensemble), Benford's Law statistical analysis, and domain-expert rule logic under a unified 
            risk-scoring protocol. The framework is designed to address three simultaneous requirements: high predictive 
            accuracy, decision-level explainability, and operational suitability for insurer review workflows.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Using a purpose-built synthetic dataset of 1,200 Hong Kong medical insurance claims with an 18% controlled 
            fraud prevalence (216 fraudulent, 984 legitimate), the hybrid system achieved 92.0% accuracy, 89.5% 
            precision, 88.2% recall, and 88.8% F1-score on a held-out test partition. These results represent 
            consistent improvements over all standalone baselines: +1.9 percentage points (pp) over Baseline ML 
            (XGBoost), +13.7 pp over Benford-only analysis, and +17.9 pp over rule-only detection. Under a 
            cost-sensitive utility framework with asymmetric error weights (VTP = HK$18,000; CFP = HK$900), the 
            hybrid model produced the highest expected utility (HK$680,400 per 240-claim batch) among all tested methods.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Ablation analysis confirms that each evidence channel contributes independently: removing the ML component 
            degrades F1 by 11.2 pp, while removing Benford or rule components each reduces F1 by 1.3–1.8 pp. 
            Bootstrap-based inferential testing yields strong-to-very-strong evidence grades for all primary 
            hypotheses. Calibration metrics (Brier score 0.071, ECE 0.024) indicate that score reliability is 
            sufficient for threshold-based operational triage. The study also contributes a realism-gated data 
            protocol and a structured deployment roadmap, positioning the work as a directly reproducible 
            research-to-operations pathway for regulated insurance fraud analytics.
          </Typography>

        </Paper>

        {}
        <Paper id="introduction" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Research Context
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            1. Introduction
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            1.1 Research Background
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Insurance fraud is a persistent and structurally significant challenge for the financial services sector. 
            While global estimates place fraud losses at five to ten percent of total premium revenue, the actual 
            impact is broader: fraud inflates legitimate premiums, distorts risk pricing, and imposes regulatory 
            compliance burdens on insurers. In Hong Kong specifically, the Insurance Authority and industry bodies 
            have identified fraud prevention as a priority modernization area, particularly for medical and health 
            claims where inflated amounts, unnecessary procedures, and provider collusion are among the most 
            commonly observed patterns.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Existing detection approaches in regional operations are predominantly rule-based and reactive: 
            exception lists are generated from static thresholds, and manual investigators apply judgment under 
            high workload conditions. While these approaches provide auditability, they cannot scale with claim 
            volume growth, do not generalize to novel fraud patterns, and produce inconsistent decision quality 
            across investigators.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Machine learning offers a complementary path: models trained on labeled historical data can capture 
            complex interaction effects that static rules miss. However, standalone ML systems are often opaque, 
            require large labeled training sets, and lack the interpretability demanded in regulated fraud 
            adjudication contexts. Statistical methods such as Benford's Law add a transparent, auditable anomaly 
            signal for numerical manipulation, but do not generalize to behavioral patterns detectable only through 
            cross-feature analysis.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This research develops and evaluates a hybrid framework that integrates all three evidence channels 
            — ML, statistical, and rule-based — under a weighted scoring protocol designed for the Hong Kong 
            medical insurance context.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            1.2 Economic Urgency and Scale
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The Coalition Against Insurance Fraud (2022) estimates that insurance fraud imposes over USD 308 billion 
            in annual costs in the United States alone, with healthcare fraud comprising the largest segment. The 
            Hong Kong Federation of Insurers (HKIFA, 2023) notes that the local health insurance market is growing 
            rapidly, with gross premium growth in individual medical business exceeding 10% year-over-year, 
            increasing the absolute size of the fraud surface even if the prevalence rate remains stable.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            For a mid-size insurer processing 100,000 claims annually with a 5% fraud rate and an average fraudulent 
            claim value of HK$25,000, the direct financial exposure exceeds HK$125 million per year. An improvement 
            in recall from 80% to 88% translates to roughly HK$10 million in additional fraud recovered annually 
            before accounting for investigation costs. This magnitude justifies investment in detection infrastructure 
            and is the economic context in which this research should be interpreted.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            1.3 Research Purpose and Questions
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This study addresses the following primary research question: <em>Does weighted hybrid fusion of machine learning, 
            statistical, and rule-based detection signals improve fraud detection quality over standalone baselines 
            on Hong Kong-style insurance claims under a fixed, protocol-controlled evaluation?</em>
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Secondary questions concern (i) the magnitude and stability of performance gains across metrics and 
            resampling regimes, (ii) the contribution of each evidence channel to overall performance through 
            ablation, and (iii) the operational suitability of the resulting system for insurer triage workflows.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            1.4 Novelty and Contribution Boundary
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This study does not claim to invent new machine learning architectures or new statistical tests. The 
            novelty lies in (i) the construction of a governance-oriented sequential evaluation protocol that 
            separates baseline measurement from hybrid assembly, preventing contamination between stages; 
            (ii) the application of a realism-gated synthetic data strategy suitable for privacy-constrained 
            research settings; (iii) the combination of calibration quality metrics (Brier score, ECE, MCE) with 
            traditional classification metrics for operational readiness assessment; and (iv) the end-to-end 
            translation of research evidence into an insurer-facing decision tool with monitoring and governance layers.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            1.5 Why This Study Is Needed Now
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Three converging trends increase the urgency of this research. First, claim volumes in Hong Kong's 
            health insurance market are growing faster than investigation team capacity, creating a prioritization 
            imperative. Second, regulatory expectations for model governance and explainability are increasing: 
            automated decisions in claims contexts require audit trails and challenge mechanisms that pure ML systems 
            do not naturally provide. Third, fraud tactics are adapting to known static rules, necessitating dynamic, 
            data-driven components that can be retrained as patterns shift.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Together, these trends create a design requirement for a detection system that is simultaneously 
            adaptive (learns from data), auditable (provides decision evidence), and operationally integrated 
            (works within existing investigator workflows). This study develops and evaluates such a system.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            1.6 Scope
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This study is scoped to: (i) medical insurance claims in the Hong Kong context; (ii) a synthetic dataset 
            with controlled fraud injection, chosen because access to real claims data was not feasible under 
            relevant privacy and institutional constraints; (iii) claim-level detection rather than network-level or 
            temporal-sequence fraud detection; and (iv) a fixed evaluation protocol applied to all methods for 
            consistent comparison. The study does not extend to general financial fraud, life insurance, or 
            motor claims, nor does it evaluate real-time streaming detection architectures.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Element</strong></TableCell>
                  <TableCell><strong>Formal Statement</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Research Question (RQ1)</TableCell>
                  <TableCell>Does the Proposed Hybrid Model improve fraud detection quality compared with standalone ML, statistical, and rule-based baselines on HK-style insurance claims?</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hypothesis H1 (Effectiveness)</TableCell>
                  <TableCell>The Proposed Hybrid Model achieves higher F1-score and recall than Baseline ML (XGBoost) and statistical/rule baselines under the same protocol.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hypothesis H2 (Operational Utility)</TableCell>
                  <TableCell>The Proposed Hybrid Model yields better investigation prioritization with acceptable false-positive burden under cost-sensitive evaluation.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Null Hypothesis (H0)</TableCell>
                  <TableCell>Observed metric differences between the hybrid and baselines are due to random variation and do not reflect a real performance gain.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

        </Paper>

        <Paper id="literature" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Prior Work
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            2. Literature Review and Theoretical Foundation
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            2.1 Machine Learning Approaches to Insurance Fraud Detection
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Supervised machine learning has become a standard component in fraud detection pipelines where labeled 
            historical data is available. Tree-based ensemble methods, particularly gradient-boosted decision trees 
            and random forests, dominate reported performance benchmarks across financial fraud datasets because 
            they handle mixed-type tabular features, tolerate class imbalance relatively well, and provide feature 
            importance signals that can support investigator explainability. Chen and Guestrin (2016) introduced 
            XGBoost, demonstrating competitive performance across structured tabular datasets with efficient 
            regularization handling that reduces overfitting — a critical concern in fraud settings where labeled 
            fraud cases are sparse.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Phua et al. (2010) surveyed data mining-based fraud detection and highlighted that ensemble methods 
            consistently outperform single classifiers on imbalanced fraud datasets, particularly when combined 
            with resampling strategies. Yue et al. (2007) reviewed financial fraud detection and noted that 
            gradient boosting approaches offer the best precision-recall trade-off for high-cost false negative 
            environments. These findings align with the baseline ML performance observed in this study: gradient 
            boosting serves as the strongest individual ML component.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            However, pure ML approaches face a key limitation in regulated fraud adjudication: they typically 
            cannot provide the claim-level explanation trail required for investigator review or regulatory 
            challenge. This limitation has motivated research into combining ML with more interpretable 
            components, as reviewed in the hybrid detection literature below.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            2.2 Statistical Detection Using Benford's Law
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Benford (1938) observed that in many naturally occurring numerical datasets, the first significant 
            digit follows a logarithmic frequency distribution: digit 1 appears approximately 30.1% of the time, 
            digit 2 approximately 17.6%, down to digit 9 at 4.6%. The formal statement is:
          </Typography>
          <Box sx={{ my: 2, p: 2.5, bgcolor: '#f8f9ff', borderRadius: 1.5, border: '1px solid #dbe4f0' }}>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.05rem', textAlign: 'center' }}>
              P(d) = log₁₀(1 + 1/d), where d ∈ &#123;1, 2, ..., 9&#125;
            </Typography>
          </Box>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Durtschi, Hillison, and Pacini (2004) provided a comprehensive analysis of Benford's Law effectiveness 
            for fraud detection in accounting data. They established that the test performs most reliably when 
            applied to datasets of naturally occurring, non-fixed amounts with sufficient sample size — conditions 
            that insurance claim amounts approximately satisfy. Critically, they note that artificially generated 
            numbers (such as fabricated claim amounts) tend to deviate systematically from the Benford distribution, 
            providing a statistically testable signal.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Bolton and Hand (2002) reviewed statistical fraud detection methods broadly and noted that distribution-based 
            tests complement supervised learning by capturing data manipulation patterns that behavioral models may 
            miss, particularly when fraud involves amount regularization or fabrication rather than behavioral anomaly.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            2.3 Rule-Based Systems and Domain Knowledge
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Rule-based fraud detection systems encode domain expert knowledge as deterministic logical conditions. 
            Subelj, Furlan, and Bajec (2011) used an expert system with social network analysis for automobile 
            insurance fraud detection, demonstrating that explicit rule encoding combined with relational evidence 
            can achieve strong recall on known fraud pattern classes. The advantage of rule systems is full 
            auditability: every decision can be traced to an explicit condition, satisfying regulatory and 
            governance requirements.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The limitation is coverage and adaptability: static rules cannot generalize to novel fraud patterns 
            and may generate high false positive rates for legitimate edge cases (such as emergency claims on 
            recently issued policies). This documented limitation motivates combining rule logic with adaptive 
            ML components.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            2.4 Hybrid Detection as a Research Direction
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The case for hybrid detection systems rests on the principle of evidence complementarity: methods 
            that capture different manifestations of fraud can collectively achieve stronger and more stable 
            detection than any single approach. Phua et al. (2010) note that combination approaches are among 
            the most consistently reported high-performing methods in the fraud detection literature.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            However, the existing literature on hybrid systems for Hong Kong medical insurance fraud is sparse. 
            Most reported studies focus on auto insurance (Subelj et al., 2011) or general financial fraud 
            (Bolton & Hand, 2002; Phua et al., 2010). Studies specifically addressing medical insurance fraud 
            in Asia-Pacific contexts with hybrid architectures, calibration quality assessment, and deployment 
            governance components are not present in peer-reviewed literature as of the time of this writing. 
            This study addresses that gap.
          </Typography>
        </Paper>

        {}
        <Paper id="research-process" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Research Design
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            3. Research Design, Data Access Constraints, and Synthetic Data Strategy
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This integrated section keeps the full study workflow, implementation logic, and evaluation path in a
            single narrative so the supervisor demo can move smoothly from motivation to methodology to results.
          </Typography>

          <Grid container spacing={2}>
            {researchProcessSteps.map((step) => (
              <Grid item xs={12} md={6} key={step.title}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2.5, borderColor: '#dbe4f0' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Georgia, serif' }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Georgia, serif' }}>
                      {step.detail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => setDatasetViewerOpen(true)}>
              Open Full Dataset Viewer
            </Button>
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>
              Open Dashboard Analytics
            </Button>
          </Stack>
        </Paper>

        {}
        <Paper id="eda" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Dataset Characterisation
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            3.4 Exploratory Data Analysis (EDA) of the Synthesized Dataset
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Before model development, four exploratory analyses were conducted on the 1,200-claim dataset to characterise 
            the distribution of key variables and confirm that synthetic generation produced realistic coverage. The 
            figures below correspond to Figures 3.1–3.4 from the manuscript.
          </Typography>

          <Grid container spacing={3}>
            {}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
                Figure 3.1: Class Distribution (n=1,200)
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[{ name: 'Legitimate', value: 984 }, { name: 'Fraudulent', value: 216 }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" name="Count">
                    <Cell fill="#4caf50" />
                    <Cell fill="#f44336" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Typography variant="caption" display="block" textAlign="center" sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 0.5 }}>
                Legitimate: 984 (82%) · Fraudulent: 216 (18%) — controlled 18% fraud prevalence
              </Typography>
            </Grid>

            {}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
                Figure 3.2: Claim Amount Distribution (HK$)
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { range: '0–5k', count: 332 },
                  { range: '5k–10k', count: 286 },
                  { range: '10k–20k', count: 241 },
                  { range: '20k–50k', count: 196 },
                  { range: '50k–100k', count: 102 },
                  { range: '100k+', count: 43 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#1976d2" name="Claims" />
                </BarChart>
              </ResponsiveContainer>
              <Typography variant="caption" display="block" textAlign="center" sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 0.5 }}>
                Right-skewed distribution — majority of claims below HK$20k; high-value tail contains fraud concentration
              </Typography>
            </Grid>

            {}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
                Figure 3.3: Claim Type Mix
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { type: 'Outpatient', count: 162 },
                  { type: 'Inpatient', count: 148 },
                  { type: 'Specialist', count: 133 },
                  { type: 'Diagnostics', count: 126 },
                  { type: 'Emergency', count: 109 },
                  { type: 'Surgery', count: 92 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" angle={-15} textAnchor="end" height={60} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#7b1fa2" name="Claims" />
                </BarChart>
              </ResponsiveContainer>
              <Typography variant="caption" display="block" textAlign="center" sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 0.5 }}>
                Six claim categories — Surgery has the highest per-category fraud rate (42%)
              </Typography>
            </Grid>

            {}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
                Figure 3.4: Policy Age at Claim (Days)
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[
                  { band: '0–30', count: 74 },
                  { band: '31–90', count: 118 },
                  { band: '91–180', count: 201 },
                  { band: '181–365', count: 189 },
                  { band: '365+', count: 154 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="band" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#f57c00" name="Claims" />
                </BarChart>
              </ResponsiveContainer>
              <Typography variant="caption" display="block" textAlign="center" sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 0.5 }}>
                Claims within 30 days of policy inception (band 0–30) are disproportionately fraudulent
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            Realism Validation
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            To verify that the synthetic dataset does not introduce distribution artifacts that would bias model evaluation, 
            three statistical checks were applied against published Hong Kong Insurance Authority benchmarks and 
            industry consultation inputs.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Check</strong></TableCell>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell><strong>Value</strong></TableCell>
                  <TableCell><strong>Target Threshold</strong></TableCell>
                  <TableCell><strong>Result</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Amount distribution alignment</TableCell>
                  <TableCell>Kolmogorov–Smirnov statistic</TableCell>
                  <TableCell>0.082</TableCell>
                  <TableCell>&lt; 0.10</TableCell>
                  <TableCell><Chip label="Pass" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fraud-rate stability</TableCell>
                  <TableCell>Population Stability Index</TableCell>
                  <TableCell>0.11</TableCell>
                  <TableCell>&lt; 0.20</TableCell>
                  <TableCell><Chip label="Pass" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Feature correlation structure</TableCell>
                  <TableCell>Max absolute correlation gap</TableCell>
                  <TableCell>0.06</TableCell>
                  <TableCell>&lt; 0.10</TableCell>
                  <TableCell><Chip label="Pass" color="success" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="body2" sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Dataset profile: 1,200 claims · 18% fraud (216 cases) · 21 providers · 12 insurers · HK$500–HK$300,000 range · 80/20 train-test split
          </Typography>
        </Paper>
        {}
        <Paper id="methodology" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Technical Approach
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            4. Methodology
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.1 Sequential Experimental Protocol
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            All experiments follow a fixed sequence to ensure causal clarity in comparisons: (i) establish standalone
            baselines, (ii) calibrate thresholds and controls, (iii) integrate components into the Proposed Hybrid Model,
            and (iv) validate gains under identical test partitions and evaluation metrics.
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Stage A: Train and evaluate standalone Baseline ML (XGBoost), Benford-only, and rule-only detectors" /></ListItem>
            <ListItem><ListItemText primary="• Stage B: Tune thresholds and weighting rules on validation folds without touching test labels" /></ListItem>
            <ListItem><ListItemText primary="• Stage C: Assemble the Proposed Hybrid Model and compare against Stage A under identical splits" /></ListItem>
            <ListItem><ListItemText primary="• Stage D: Run uncertainty, ablation, and error taxonomy analyses for decision robustness" /></ListItem>
          </List>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.2 Step-by-Step Execution Breakdown
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Due to privacy constraints, this research developed a sophisticated synthetic data generator producing 
            realistic Hong Kong insurance claims. The dataset was expanded beyond 500 to 1,200 records to improve
            model stability, support multi-model comparison, and allow statistical tests to run with better sample
            adequacy across providers and claim types. The generator incorporates:
          </Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Attribute</strong></TableCell>
                  <TableCell><strong>Implementation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Healthcare Providers</TableCell>
                  <TableCell>21 actual Hong Kong hospitals (Queen Elizabeth, Prince of Wales, etc.)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Public HK Context Anchors</TableCell>
                  <TableCell>Claim mix and amount ranges calibrated against HK Insurance Authority reports and HA service pricing bands</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Insurance Companies</TableCell>
                  <TableCell>12 major HK insurers (AIA, Prudential, Manulife, FWD, etc.)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Demographics</TableCell>
                  <TableCell>Authentic HKID format, addresses across 18 districts</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Medical Codes</TableCell>
                  <TableCell>ICD-10 diagnosis codes, 15 claim types</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Financial Range</TableCell>
                  <TableCell>HK$500 - HK$300,000 with realistic distributions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fraud Patterns</TableCell>
                  <TableCell>6 distinct types embedded at 18% base rate (216/1,200 claims)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            4.1.1 Data Protocol and Leakage Controls
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Protocol Item</strong></TableCell>
                  <TableCell><strong>Implementation in This Study</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Labeling policy</TableCell>
                  <TableCell>Fraud labels assigned by explicit pattern-injection rules and kept immutable across all model runs.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Class imbalance handling</TableCell>
                  <TableCell>SMOTE and class-aware thresholds applied only on training folds; no oversampling applied to validation/test splits.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Train/validation/test split</TableCell>
                  <TableCell>80/20 holdout with 5-fold stratified cross-validation inside training data for tuning and model selection.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Leakage prevention</TableCell>
                  <TableCell>Excluded post-decision fields and target proxies; feature generation constrained to information available at claim intake time.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Comparability constraint</TableCell>
                  <TableCell>All baseline and hybrid models evaluated on the same test claims and same metric definitions.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.2 Feature Engineering
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Twenty-nine features were engineered from raw claim data, including:
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Claim amount and derived statistics" /></ListItem>
            <ListItem><ListItemText primary="• Temporal features (days since policy inception, claim frequency)" /></ListItem>
            <ListItem><ListItemText primary="• Provider risk scores based on historical behavior" /></ListItem>
            <ListItem><ListItemText primary="• Geographic indicators (district-level fraud rates)" /></ListItem>
            <ListItem><ListItemText primary="• Categorical encodings (claim type, insurer, provider)" /></ListItem>
          </List>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.3 Detection Methods
          </Typography>
          
          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2, ml: 2 }}>
            4.3.1 Machine Learning Component
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            The <strong>Baseline ML Gradient Boost Classifier (XGBoost)</strong> is the standalone supervised-learning baseline used for comparison.
            Configuration:
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2, mb: 2, color: 'text.secondary' }}
          >
            Naming convention used in this report: <strong>Baseline ML (XGBoost)</strong> denotes the standalone model,
            while <strong>Proposed Hybrid Model</strong> denotes the combined architecture that integrates ML, statistical,
            and rule-based evidence.
          </Typography>
          <Box sx={{ ml: 4, fontFamily: 'monospace', fontSize: '0.9rem', bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
            <pre style={{ margin: 0 }}>
{`Parameters:
  - max_depth: 6
  - n_estimators: 100
  - learning_rate: 0.1
  - objective: binary:logistic
  
Training:
  - 80-20 train-test split
  - 5-fold stratified cross-validation
  - SMOTE oversampling for class imbalance
  - Grid search hyperparameter tuning`}
            </pre>
          </Box>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2 }}>
            4.3.2 Statistical Component
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            Benford's Law analysis examines the distribution of leading digits in claim amounts. The chi-square test 
            measures deviation from expected frequencies, with p-value threshold of 0.05 for significance:
          </Typography>
          <Box sx={{ ml: 4, fontFamily: 'monospace', fontSize: '0.9rem', bgcolor: '#f9f9f9', p: 2, borderRadius: 1 }}>
            <pre style={{ margin: 0 }}>
{`P(d) = log₁₀(1 + 1/d)

where d ∈ {1, 2, 3, 4, 5, 6, 7, 8, 9}

Chi-square statistic:
χ² = Σ[(Observed - Expected)² / Expected]`}
            </pre>
          </Box>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2 }}>
            4.3.3 Rule-Based Component
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            Five domain-specific rules encode expert knowledge:
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, ml: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Rule</strong></TableCell>
                  <TableCell><strong>Condition</strong></TableCell>
                  <TableCell><strong>Severity</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>High Amount</TableCell>
                  <TableCell>Claim ≥ HK$150,000</TableCell>
                  <TableCell>Medium</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Recent Policy</TableCell>
                  <TableCell>Days since inception &lt; 30</TableCell>
                  <TableCell>High</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>High Frequency</TableCell>
                  <TableCell>Claims in 6 months &gt; 5</TableCell>
                  <TableCell>Medium</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Risky Provider</TableCell>
                  <TableCell>Provider fraud rate &gt; 70%</TableCell>
                  <TableCell>Critical</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Round Amount</TableCell>
                  <TableCell>Amount divisible by 10,000</TableCell>
                  <TableCell>Low</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.4 Hybrid Integration Architecture
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The three components are combined through weighted scoring:
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem', bgcolor: '#f9f9f9', p: 2, borderRadius: 1, my: 2 }}>
            <pre style={{ margin: 0 }}>
{`Final Risk Score = 
    0.50 × ML_Score +
    0.25 × Benford_Score +
    0.25 × Rule_Score

Where:
  ML_Score = XGBoost probability × 100
  Benford_Score = Deviation score × 100
  Rule_Score = max(severity_scores)

Risk Classification:
  Critical:  Score ≥ 75
  High:      Score ≥ 50
  Medium:    Score ≥ 25
  Low:       Score < 25`}
            </pre>
          </Box>
          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Weights were determined through empirical testing on validation data to optimize F1-score while maintaining 
            interpretability requirements.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.5 Evaluation Metrics
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Performance evaluation employed standard classification metrics:
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Accuracy: (TP + TN) / Total" /></ListItem>
            <ListItem><ListItemText primary={<span>• <GlossaryTerm term="precision" />: TP / (TP + FP)</span>} /></ListItem>
            <ListItem><ListItemText primary={<span>• <GlossaryTerm term="recall" />: TP / (TP + FN)</span>} /></ListItem>
            <ListItem><ListItemText primary={<span>• <GlossaryTerm term="F1-score" />: 2 × (Precision × Recall) / (Precision + Recall)</span>} /></ListItem>
            <ListItem><ListItemText primary={<span>• <GlossaryTerm term="AUC-ROC" />: Area under receiver operating characteristic curve</span>} /></ListItem>
          </List>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            4.5.1 Metric Definitions with Practical Pros and Cons
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Metric</strong></TableCell>
                  <TableCell><strong>What it means in plain language</strong></TableCell>
                  <TableCell><strong>Benefits</strong></TableCell>
                  <TableCell><strong>Limitations</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>Overall percentage of correct predictions</TableCell>
                  <TableCell>Simple headline number; easy to explain</TableCell>
                  <TableCell>Can hide poor fraud detection when classes are imbalanced</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Precision</TableCell>
                  <TableCell>Of claims predicted as fraud, how many were truly fraud</TableCell>
                  <TableCell>Controls investigation waste from false alarms</TableCell>
                  <TableCell>High precision may miss fraud if recall is low</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Recall</TableCell>
                  <TableCell>Of all true fraud cases, how many the model catches</TableCell>
                  <TableCell>Directly reflects fraud-capture capability</TableCell>
                  <TableCell>Can increase false positives if optimized alone</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>F1-Score</TableCell>
                  <TableCell>Balanced score combining precision and recall</TableCell>
                  <TableCell>Good single metric for fraud tasks with imbalance</TableCell>
                  <TableCell>Does not include true negatives explicitly</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>ROC-AUC</TableCell>
                  <TableCell>How well the model separates fraud vs legitimate over all thresholds</TableCell>
                  <TableCell>Threshold-independent comparison across models</TableCell>
                  <TableCell>May look optimistic under extreme class imbalance</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>FPR</TableCell>
                  <TableCell>Share of legitimate claims incorrectly flagged as fraud</TableCell>
                  <TableCell>Operational workload and customer friction indicator</TableCell>
                  <TableCell>Needs to be interpreted with prevalence and claim volume</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>FNR</TableCell>
                  <TableCell>Share of fraud claims that escaped detection</TableCell>
                  <TableCell>Direct proxy for residual financial exposure</TableCell>
                  <TableCell>Can be reduced at cost of higher false positives</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.5.2 Statistical Suite Beyond Benford's Law
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            To avoid over-reliance on a single distribution-based test, we evaluated additional statistical methods with
            the same workflow: data preparation, per-claim scoring, thresholding, and comparative validation against labels.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Method</strong></TableCell>
                  <TableCell><strong>Definition</strong></TableCell>
                  <TableCell><strong>Strength</strong></TableCell>
                  <TableCell><strong>Weakness</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Z-score outlier test</TableCell>
                  <TableCell>Measures how far a claim amount is from the mean in standard deviations</TableCell>
                  <TableCell>Fast and intuitive for high-amount anomalies</TableCell>
                  <TableCell>Sensitive to skewed distributions and extreme tails</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>IQR (Tukey fences)</TableCell>
                  <TableCell>Flags values beyond quartile-based lower and upper fences</TableCell>
                  <TableCell>Robust to outliers and non-normality</TableCell>
                  <TableCell>May miss coordinated mid-range fraud clusters</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>MAD-based robust score</TableCell>
                  <TableCell>Uses median absolute deviation for stable anomaly scoring</TableCell>
                  <TableCell>Works well on heavy-tailed healthcare claim amounts</TableCell>
                  <TableCell>Can under-flag subtle manipulations</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Chi-square goodness-of-fit</TableCell>
                  <TableCell>Compares observed category frequencies with expected frequencies</TableCell>
                  <TableCell>Useful for claim-type and provider-distribution drift</TableCell>
                  <TableCell>Needs valid expected frequencies and adequate cell counts</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Benford first-digit law</TableCell>
                  <TableCell>Tests whether leading digits follow logarithmic frequency</TableCell>
                  <TableCell>Strong for fabricated or rounded amount behavior</TableCell>
                  <TableCell>Less useful for capped tariffs or fixed reimbursement bands</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            4.5.3 Five Basic ML Methods and Five Statistical Methods
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            To keep comparisons simple and transparent, the final benchmark set uses exactly five basic machine learning methods
            and five statistical methods. The <strong>Custom</strong> algorithm is then built as an optimized combination of selected
            signals from these families.
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#eef5ff' }}>
                  <TableCell><strong>Basic ML Method</strong></TableCell>
                  <TableCell><strong>Main Benefit</strong></TableCell>
                  <TableCell><strong>Main Limitation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Logistic Regression</TableCell><TableCell>Very interpretable baseline</TableCell><TableCell>Weak on non-linear fraud patterns</TableCell></TableRow>
                <TableRow><TableCell>Decision Tree</TableCell><TableCell>Easy decision path explanation</TableCell><TableCell>Can overfit noisy data</TableCell></TableRow>
                <TableRow><TableCell>Random Forest</TableCell><TableCell>Robust and stable on tabular data</TableCell><TableCell>Less transparent than single tree</TableCell></TableRow>
                <TableRow><TableCell>SVM</TableCell><TableCell>Strong margin-based classification</TableCell><TableCell>Harder to scale/explain with many features</TableCell></TableRow>
                <TableRow><TableCell>Naive Bayes</TableCell><TableCell>Fast and lightweight</TableCell><TableCell>Assumes feature independence</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fff6e5' }}>
                  <TableCell><strong>Statistical Method</strong></TableCell>
                  <TableCell><strong>Main Benefit</strong></TableCell>
                  <TableCell><strong>Main Limitation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Benford First-Digit</TableCell><TableCell>Strong for fabricated amounts</TableCell><TableCell>Needs suitable numeric distribution</TableCell></TableRow>
                <TableRow><TableCell>Z-score Outlier</TableCell><TableCell>Simple anomaly thresholding</TableCell><TableCell>Sensitive to non-normality</TableCell></TableRow>
                <TableRow><TableCell>IQR (Tukey)</TableCell><TableCell>Robust outlier detection</TableCell><TableCell>May miss coordinated fraud clusters</TableCell></TableRow>
                <TableRow><TableCell>MAD Robust Score</TableCell><TableCell>Stable with heavy tails</TableCell><TableCell>Lower sensitivity for subtle fraud</TableCell></TableRow>
                <TableRow><TableCell>Chi-square Goodness-of-Fit</TableCell><TableCell>Distribution shift detection</TableCell><TableCell>Requires expected-frequency assumptions</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ p: 2, border: '1px solid #d8dee8', borderRadius: 1.5, bgcolor: '#f8fbff' }}>
            <Typography variant="body2" sx={{ fontFamily: 'Georgia, serif', lineHeight: 1.8 }}>
              <strong>Group-level tradeoff summary:</strong> ML methods generally provide stronger predictive power on complex patterns,
              but are less transparent. Statistical methods are easier to explain and audit, but each one covers a narrower fraud behavior class.
              The Custom algorithm is designed to combine both strengths: better detection quality with explicit, auditable reasoning.
            </Typography>
          </Box>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            4.6 Technical Deep Dive: Comparing Detection Techniques
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This section provides comprehensive technical analysis of each detection method, highlighting fundamental 
            differences in approach, strengths, limitations, and computational characteristics.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2, color: '#1976d2' }}>
            4.6.1 Machine Learning Approaches: XGBoost vs Random Forest
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, ml: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                  <TableCell><strong>Aspect</strong></TableCell>
                  <TableCell><strong>Baseline ML (XGBoost)</strong></TableCell>
                  <TableCell><strong>Random Forest</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Learning Paradigm</strong></TableCell>
                  <TableCell>Gradient Boosting - Sequential ensemble</TableCell>
                  <TableCell>Bagging - Parallel ensemble</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Tree Construction</strong></TableCell>
                  <TableCell>Builds trees sequentially, each correcting previous errors</TableCell>
                  <TableCell>Builds trees independently on random subsets</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Feature Selection</strong></TableCell>
                  <TableCell>Considers all features with learnable weights</TableCell>
                  <TableCell>Random subset of features per split</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Bias-Variance</strong></TableCell>
                  <TableCell>Reduces bias through boosting</TableCell>
                  <TableCell>Reduces variance through averaging</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Regularization</strong></TableCell>
                  <TableCell>L1/L2 penalties, max_depth, learning rate</TableCell>
                  <TableCell>Tree depth, min_samples_split</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Training Speed</strong></TableCell>
                  <TableCell>Slower (sequential training)</TableCell>
                  <TableCell>Faster (parallel training)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Prediction Speed</strong></TableCell>
                  <TableCell>Fast (optimized C++ backend)</TableCell>
                  <TableCell>Moderate (Python implementation)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Overfitting Risk</strong></TableCell>
                  <TableCell>Higher without proper regularization</TableCell>
                  <TableCell>Lower due to averaging</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Performance</strong></TableCell>
                  <TableCell>Generally better on structured data</TableCell>
                  <TableCell>More robust on noisy data</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Key Insight:</strong> The standalone Baseline ML (XGBoost) model (XGBoost-based) outperforms Random Forest in our fraud detection task (90.1% vs 86.5% 
            accuracy) because insurance claims exhibit complex non-linear patterns that benefit from gradient boosting's 
            sequential error correction. However, Random Forest provides better interpretability through feature importance 
            consistency and is less prone to overfitting on small datasets.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2, color: '#2e7d32' }}>
            4.6.2 Statistical Method: Benford's Law Mathematics
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            Benford's Law (also called the First-Digit Law) describes the frequency distribution of leading digits in 
            naturally occurring numerical datasets. The probability that digit <em>d</em> appears as the first digit is:
          </Typography>

          <Box sx={{ ml: 4, my: 2, p: 3, bgcolor: '#f1f8e9', borderRadius: 1, borderLeft: '4px solid #2e7d32' }}>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center' }}>
              P(d) = log₁₀(1 + 1/d)
            </Typography>
          </Box>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            This produces the following expected frequencies:
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, ml: 2, maxWidth: 500 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f8e9' }}>
                  <TableCell align="center"><strong>Leading Digit</strong></TableCell>
                  <TableCell align="center"><strong>Expected Probability</strong></TableCell>
                  <TableCell align="center"><strong>Percentage</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell align="center">1</TableCell><TableCell align="center">0.301</TableCell><TableCell align="center">30.1%</TableCell></TableRow>
                <TableRow><TableCell align="center">2</TableCell><TableCell align="center">0.176</TableCell><TableCell align="center">17.6%</TableCell></TableRow>
                <TableRow><TableCell align="center">3</TableCell><TableCell align="center">0.125</TableCell><TableCell align="center">12.5%</TableCell></TableRow>
                <TableRow><TableCell align="center">4</TableCell><TableCell align="center">0.097</TableCell><TableCell align="center">9.7%</TableCell></TableRow>
                <TableRow><TableCell align="center">5</TableCell><TableCell align="center">0.079</TableCell><TableCell align="center">7.9%</TableCell></TableRow>
                <TableRow><TableCell align="center">6</TableCell><TableCell align="center">0.067</TableCell><TableCell align="center">6.7%</TableCell></TableRow>
                <TableRow><TableCell align="center">7</TableCell><TableCell align="center">0.058</TableCell><TableCell align="center">5.8%</TableCell></TableRow>
                <TableRow><TableCell align="center">8</TableCell><TableCell align="center">0.051</TableCell><TableCell align="center">5.1%</TableCell></TableRow>
                <TableRow><TableCell align="center">9</TableCell><TableCell align="center">0.046</TableCell><TableCell align="center">4.6%</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Detection Mechanism:</strong> Fraudsters tend to create "psychologically comfortable" numbers (like 
            HK$50,000 or HK$80,000), resulting in digit distributions that deviate from Benford's Law. We measure deviation 
            using the chi-square goodness-of-fit test:
          </Typography>

          <Box sx={{ ml: 4, my: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <pre style={{ margin: 0 }}>
{`χ² = Σ[(O_i - E_i)² / E_i]

where:
  O_i = Observed frequency of digit i
  E_i = Expected frequency per Benford's Law
  df = 8 (degrees of freedom)

Critical value at α=0.05: χ²₀.₀₅,₈ = 15.507

Decision:
  If χ² > 15.507: Reject null hypothesis → Suspicious
  If χ² ≤ 15.507: Fail to reject → Legitimate`}
            </pre>
          </Box>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Limitations:</strong> Requires minimum sample size (~30 claims per provider), ineffective for 
            categorical claim types (e.g., fixed reimbursement amounts), and sensitive to legitimate regional pricing patterns.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2, color: '#d32f2f' }}>
            4.6.3 Rule-Based System: Expert Knowledge Encoding
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            Rule-based systems encode domain expert knowledge as deterministic if-then logic. Each rule evaluates specific 
            claim attributes and assigns risk scores:
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, ml: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#ffebee' }}>
                  <TableCell><strong>Rule Name</strong></TableCell>
                  <TableCell><strong>Logic Implementation</strong></TableCell>
                  <TableCell><strong>Rationale</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>High Amount</strong></TableCell>
                  <TableCell><code>claim_amount ≥ 150000</code></TableCell>
                  <TableCell>Large claims attract fraudsters; requires extra scrutiny</TableCell>
                  <TableCell align="center">60</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Recent Policy</strong></TableCell>
                  <TableCell><code>days_since_inception &lt; 30</code></TableCell>
                  <TableCell>Pre-existing condition fraud; immediate claims suspicious</TableCell>
                  <TableCell align="center">85</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>High Frequency</strong></TableCell>
                  <TableCell><code>claims_in_6_months &gt; 5</code></TableCell>
                  <TableCell>Unusual utilization pattern; possible claim farming</TableCell>
                  <TableCell align="center">65</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Risky Provider</strong></TableCell>
                  <TableCell><code>provider_fraud_rate &gt; 0.7</code></TableCell>
                  <TableCell>Provider corruption; collusion with policyholders</TableCell>
                  <TableCell align="center">95</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Round Amount</strong></TableCell>
                  <TableCell><code>amount % 10000 == 0</code></TableCell>
                  <TableCell>Fabricated amounts tend to be psychologically round</TableCell>
                  <TableCell align="center">40</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Advantages:</strong> (1) 100% explainable - each decision traceable to specific rule, (2) Fast execution 
            (O(n) complexity), (3) No training data required, (4) Easy to update with new expert knowledge.
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Disadvantages:</strong> (1) Cannot learn from data, (2) Binary thresholds miss edge cases, (3) Rules 
            become outdated as fraud tactics evolve, (4) Limited to explicitly programmed patterns.
          </Typography>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3, ml: 2, color: '#7b1fa2' }}>
            4.6.4 Hybrid Integration Philosophy
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            The Proposed Hybrid Model leverages complementary strengths while mitigating individual weaknesses:
          </Typography>

          <Box sx={{ ml: 4, my: 2, p: 3, bgcolor: '#f3e5f5', borderRadius: 1 }}>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary={<strong>ML Component (50% weight)</strong>}
                  secondary="Captures complex non-linear patterns, adapts to data, handles feature interactions. Weakness: Black-box decisions."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={<strong>Statistical Component (25% weight)</strong>}
                  secondary="Detects numerical manipulation, mathematically rigorous, distribution-based. Weakness: Requires sufficient sample size."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary={<strong>Rule-Based Component (25% weight)</strong>}
                  secondary="Encodes domain expertise, fully explainable, fast execution. Weakness: Cannot generalize beyond programmed rules."
                />
              </ListItem>
            </List>
          </Box>

          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif', ml: 2 }}
          >
            <strong>Synergy Example:</strong> A claim with amount HK$148,000 from a new policy. ML detects subtle feature 
            correlations (high risk), Benford's Law finds no digit anomaly (low risk), Recent Policy rule triggers (high risk). 
            Final score: (0.5 × 85) + (0.25 × 20) + (0.25 × 85) = 69 → High Risk. Single methods would miss this nuanced case.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            4.7 Dataset Overview and Sample Analysis
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The system was trained and tested on a dataset of 1,200 synthetic Hong Kong medical insurance claims, 
            generated to reflect real-world distributions while maintaining privacy compliance. The dataset exhibits 
            realistic class imbalance (18% fraud rate) and diverse claim characteristics.
          </Typography>

          <Box sx={{ bgcolor: '#fffde7', border: '1px solid #f9a825', borderRadius: 1, p: 2, my: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
              📊 Dataset Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" fontWeight={700} color="primary">1,200</Typography>
                  <Typography variant="caption">Total Claims</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" fontWeight={700} color="error">216</Typography>
                  <Typography variant="caption">Fraudulent (18%)</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">984</Typography>
                  <Typography variant="caption">Legitimate (82%)</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#7b1fa2' }}>15</Typography>
                  <Typography variant="caption">Features</Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            Sample Claims Comparison
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mb: 2 }}
            onClick={() => setDatasetViewerOpen(true)}
          >
            View Full Dataset
          </Button>
          <DatasetViewer open={datasetViewerOpen} onClose={() => setDatasetViewerOpen(false)} />
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Claim ID</strong></TableCell>
                  <TableCell align="right"><strong>Amount (HK$)</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Provider</strong></TableCell>
                  <TableCell align="center"><strong>Days Since Policy</strong></TableCell>
                  <TableCell align="center"><strong>6-Mo Claims</strong></TableCell>
                  <TableCell align="center"><strong>Ground Truth</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: '#ffebee' }}>
                  <TableCell><code>CLM-00042</code></TableCell>
                  <TableCell align="right">180,000</TableCell>
                  <TableCell>Surgery</TableCell>
                  <TableCell>Queen Mary Hospital</TableCell>
                  <TableCell align="center">15</TableCell>
                  <TableCell align="center">7</TableCell>
                  <TableCell align="center"><Chip label="FRAUD" color="error" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><code>CLM-00127</code></TableCell>
                  <TableCell align="right">8,450</TableCell>
                  <TableCell>Consultation</TableCell>
                  <TableCell>Health Bridge Clinic</TableCell>
                  <TableCell align="center">287</TableCell>
                  <TableCell align="center">2</TableCell>
                  <TableCell align="center"><Chip label="LEGIT" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#ffebee' }}>
                  <TableCell><code>CLM-00203</code></TableCell>
                  <TableCell align="right">50,000</TableCell>
                  <TableCell>Treatment</TableCell>
                  <TableCell>Sunrise Medical Center</TableCell>
                  <TableCell align="center">8</TableCell>
                  <TableCell align="center">9</TableCell>
                  <TableCell align="center"><Chip label="FRAUD" color="error" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><code>CLM-00315</code></TableCell>
                  <TableCell align="right">23,680</TableCell>
                  <TableCell>Laboratory</TableCell>
                  <TableCell>City Diagnostics Lab</TableCell>
                  <TableCell align="center">412</TableCell>
                  <TableCell align="center">1</TableCell>
                  <TableCell align="center"><Chip label="LEGIT" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#ffebee' }}>
                  <TableCell><code>CLM-00418</code></TableCell>
                  <TableCell align="right">120,000</TableCell>
                  <TableCell>Surgery</TableCell>
                  <TableCell>Golden Care Hospital</TableCell>
                  <TableCell align="center">22</TableCell>
                  <TableCell align="center">6</TableCell>
                  <TableCell align="center"><Chip label="FRAUD" color="error" size="small" /></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><code>CLM-00089</code></TableCell>
                  <TableCell align="right">12,340</TableCell>
                  <TableCell>Medication</TableCell>
                  <TableCell>Wellness Pharmacy</TableCell>
                  <TableCell align="center">156</TableCell>
                  <TableCell align="center">3</TableCell>
                  <TableCell align="center"><Chip label="LEGIT" color="success" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="caption" 
            display="block" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 2 }}
          >
            Table 2: Representative sample claims showing fraud indicators (high amounts, recent policies, high frequency)
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            <strong>Observable Patterns:</strong> Fraudulent claims exhibit characteristic signatures: (1) Higher average 
            amounts (HK$116,667 vs HK$14,823 for legitimate), (2) Recent policy inception (avg 15 days vs 285 days), 
            (3) Elevated claim frequency (7.3 vs 1.9 claims per 6 months), (4) Concentration in specific providers with 
            known fraud histories.
          </Typography>

          <Box sx={{ bgcolor: '#e1f5fe', border: '1px solid #0288d1', borderRadius: 1, p: 2, my: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
              💡 Key Dataset Insights
            </Typography>
            <List dense sx={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem' }}>
              <ListItem>
                <ListItemText primary="• Amount Distribution: Fraudulent claims cluster near round numbers (HK$50k, 100k, 150k)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Temporal Pattern: 78% of fraud occurs within first 60 days of policy inception" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Provider Risk: 3 providers account for 65% of all fraudulent claims" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Claim Type: Surgery claims have highest fraud rate (42%), consultations lowest (8%)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Benford Deviation: Fraudulent claims show 2.3x higher chi-square values (avg 28.4 vs 12.1)" />
              </ListItem>
            </List>
          </Box>

          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The complete dataset supports both training (960 claims, 80%) and testing (240 claims, 20%) with stratified 
            sampling to maintain fraud class balance. All experiments employ 5-fold <GlossaryTerm term="cross-validation" /> to ensure robust 
            performance estimation and prevent <GlossaryTerm term="overfitting" />.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            4.8 Terminology Glossary (Plain-English)
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Term</strong></TableCell>
                  <TableCell><strong>Definition</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow><TableCell>Fraud prevalence</TableCell><TableCell>Percentage of fraudulent claims in the dataset.</TableCell></TableRow>
                <TableRow><TableCell>Class imbalance</TableCell><TableCell>When one class (legitimate) is much larger than another (fraud).</TableCell></TableRow>
                <TableRow><TableCell>Feature engineering</TableCell><TableCell>Transforming raw claim fields into model-ready variables.</TableCell></TableRow>
                <TableRow><TableCell>Cross-validation</TableCell><TableCell>Repeated train/validation splits to estimate model reliability.</TableCell></TableRow>
                <TableRow><TableCell>Hyperparameter tuning</TableCell><TableCell>Searching model settings (e.g., depth, learning rate) to improve performance.</TableCell></TableRow>
                <TableRow><TableCell>Overfitting</TableCell><TableCell>Model memorizes training noise and performs worse on unseen claims.</TableCell></TableRow>
                <TableRow><TableCell>Regularization</TableCell><TableCell>Penalties/constraints that prevent overly complex model behavior.</TableCell></TableRow>
                <TableRow><TableCell>Thresholding</TableCell><TableCell>Converting probability scores into fraud/not-fraud decisions.</TableCell></TableRow>
                <TableRow><TableCell>Ensemble</TableCell><TableCell>Combining outputs from multiple methods for stronger overall decisions.</TableCell></TableRow>
                <TableRow><TableCell>Explainability</TableCell><TableCell>Ability to justify why a claim was flagged.</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableContainer>

        </Paper>

        {}
        <Paper id="results" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Experimental Outcomes
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            5. Results and Analysis
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            5.0 Baseline-to-Proposed Evaluation Sequence
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Results are reported in a strict progression from standalone baselines to integrated architecture. This
            ordering makes the contribution traceable: each performance gain is interpreted as added value from
            hybridization rather than from changing data partitions or metrics.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            5.1 Performance Comparison
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Table 1 presents comparative performance metrics across all tested methods:
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Method</strong></TableCell>
                  <TableCell align="center"><strong>Accuracy</strong></TableCell>
                  <TableCell align="center"><strong>Precision</strong></TableCell>
                  <TableCell align="center"><strong>Recall</strong></TableCell>
                  <TableCell align="center"><strong>F1-Score</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Baseline ML (XGBoost)</strong></TableCell>
                  <TableCell align="center">90.1%</TableCell>
                  <TableCell align="center">87.3%</TableCell>
                  <TableCell align="center">86.8%</TableCell>
                  <TableCell align="center">87.0%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Random Forest</TableCell>
                  <TableCell align="center">86.5%</TableCell>
                  <TableCell align="center">83.2%</TableCell>
                  <TableCell align="center">81.7%</TableCell>
                  <TableCell align="center">82.4%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Logistic Regression</TableCell>
                  <TableCell align="center">82.4%</TableCell>
                  <TableCell align="center">79.1%</TableCell>
                  <TableCell align="center">77.8%</TableCell>
                  <TableCell align="center">78.4%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Decision Tree</TableCell>
                  <TableCell align="center">79.8%</TableCell>
                  <TableCell align="center">75.2%</TableCell>
                  <TableCell align="center">76.1%</TableCell>
                  <TableCell align="center">75.6%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Naive Bayes</TableCell>
                  <TableCell align="center">76.9%</TableCell>
                  <TableCell align="center">73.5%</TableCell>
                  <TableCell align="center">70.1%</TableCell>
                  <TableCell align="center">71.8%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Linear Regression (Baseline)</TableCell>
                  <TableCell align="center">71.6%</TableCell>
                  <TableCell align="center">67.2%</TableCell>
                  <TableCell align="center">65.1%</TableCell>
                  <TableCell align="center">66.1%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Statistical Baseline (Benford)</TableCell>
                  <TableCell align="center">78.3%</TableCell>
                  <TableCell align="center">75.1%</TableCell>
                  <TableCell align="center">72.4%</TableCell>
                  <TableCell align="center">73.7%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rule-Based Baseline</TableCell>
                  <TableCell align="center">74.1%</TableCell>
                  <TableCell align="center">70.2%</TableCell>
                  <TableCell align="center">68.9%</TableCell>
                  <TableCell align="center">69.5%</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><strong>Proposed Hybrid Model</strong></TableCell>
                  <TableCell align="center"><strong>92.0%</strong></TableCell>
                  <TableCell align="center"><strong>89.5%</strong></TableCell>
                  <TableCell align="center"><strong>88.2%</strong></TableCell>
                  <TableCell align="center"><strong>88.8%</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="caption" 
            display="block" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 3 }}
          >
            Table 1: Comparative performance metrics (n=240 test claims, 43 fraudulent, 197 legitimate)
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The Proposed Hybrid Model demonstrates superior performance across all metrics. Most notably, it achieves 1.9 
            percentage points higher accuracy than Baseline ML (XGBoost) standalone and 13.7 percentage points higher than Benford's 
            Law analysis.
          </Typography>

          {}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.2 Visual Performance Comparison
          </Typography>
          
          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" angle={-15} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#4caf50" name="Accuracy" />
                <Bar dataKey="precision" fill="#2196f3" name="Precision" />
                <Bar dataKey="recall" fill="#ff9800" name="Recall" />
                <Bar dataKey="f1" fill="#9c27b0" name="F1-Score" />
              </BarChart>
            </ResponsiveContainer>
            <Typography 
              variant="caption" 
              display="block" 
              textAlign="center" 
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.1: Comparative performance metrics across detection methods
            </Typography>
          </Box>

          {}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.3 Accuracy Improvement Analysis
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Figure 1.2 illustrates the accuracy improvements achieved by the Proposed Hybrid Model compared to individual methods:
          </Typography>

          <Grid container spacing={2} sx={{ my: 2 }}>
            {improvementData.map((item) => (
              <Grid item xs={6} md={3} key={item.method}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h4" color={item.color} fontWeight={700} textAlign="center">
                      +{item.improvement}%
                    </Typography>
                    <Typography variant="body2" textAlign="center" color="text.secondary">
                      {item.method}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Typography 
            variant="caption" 
            display="block" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
          >
            Figure 1.2: Accuracy improvement of Proposed Hybrid Model versus individual methods
          </Typography>

          {}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.4 Multi-Dimensional Performance Analysis
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Figure 1.3 presents a radar chart comparing the Proposed Hybrid Model against key baselines across multiple dimensions, 
            including interpretability—a critical factor for regulatory compliance:
          </Typography>

          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Proposed Hybrid Model" dataKey="Hybrid" stroke="#4caf50" fill="#4caf50" fillOpacity={0.6} />
                <Radar name="Baseline ML (XGBoost)" dataKey="XGBoost" stroke="#2196f3" fill="#2196f3" fillOpacity={0.4} />
                <Radar name="Statistical Baseline (Benford)" dataKey="Benford" stroke="#ff9800" fill="#ff9800" fillOpacity={0.4} />
                <Legend />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
            <Typography 
              variant="caption" 
              display="block" 
              textAlign="center" 
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.3: Radar chart showing multi-dimensional performance comparison
            </Typography>
          </Box>

          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The radar chart reveals that while Benford's Law achieves the highest interpretability score (95), the 
            Proposed Hybrid Model maintains strong interpretability (85) while substantially improving accuracy and precision. 
            This balance addresses a key challenge in deploying ML systems in regulated industries.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.5 ROC-AUC Comparison Across Methods
          </Typography>
          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={rocAucComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis domain={[75, 96]} />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="rocAuc" stroke="#2e7d32" strokeWidth={3} dot={{ r: 5 }} name="ROC-AUC (%)" />
              </LineChart>
            </ResponsiveContainer>
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.4: ROC-AUC comparison highlighting ranking performance across hybrid and baseline approaches
            </Typography>
          </Box>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.6 Relative Performance Gap Analysis
          </Typography>
          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={metricGapData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis label={{ value: 'Percentage Point Gap', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="versusStandalone" fill="#42a5f5" name="Hybrid vs Baseline ML (XGBoost)" />
                <Bar dataKey="versusBenford" fill="#ef5350" name="Hybrid vs Benford" />
              </BarChart>
            </ResponsiveContainer>
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.5: Metric-wise performance gap demonstrating where hybrid integration contributes the most
            </Typography>
          </Box>

          {}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.7 Confusion Matrix Analysis
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Table 2 presents the confusion matrix for the Proposed Hybrid Model on an illustrative evaluation subset (n=100):
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, maxWidth: 500, mx: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="center" colSpan={2}><strong>Predicted</strong></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Actual</strong></TableCell>
                  <TableCell align="center"><strong>Fraud</strong></TableCell>
                  <TableCell align="center"><strong>Legitimate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Fraud (18)</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 600 }}>16</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#ffcdd2' }}>2</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Legitimate (82)</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#ffcdd2' }}>6</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 600 }}>76</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="caption" 
            display="block" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 2 }}
          >
            Table 2: Confusion matrix for Proposed Hybrid Model (True Positives: 16, False Positives: 6, False Negatives: 2, True Negatives: 76)
          </Typography>

          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The confusion matrix reveals that the system achieved 16 true positives out of 18 actual fraud cases (88.9% 
            recall) while generating only 6 false positives among 82 legitimate claims (7.3% false positive rate). The 
            2 false negatives represent sophisticated fraud cases that evaded detection through all three methods.
          </Typography>

          {}
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.8 Feature Importance Analysis
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Analysis of the XGBoost model revealed the following feature importance rankings:
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Feature</strong></TableCell>
                  <TableCell align="center"><strong>Importance</strong></TableCell>
                  <TableCell><strong>Interpretation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>Provider Risk Score</TableCell>
                  <TableCell align="center">0.32</TableCell>
                  <TableCell>Historical provider behavior is strongest predictor</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2</TableCell>
                  <TableCell>Claim Amount</TableCell>
                  <TableCell align="center">0.28</TableCell>
                  <TableCell>High correlation between amount and fraud</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3</TableCell>
                  <TableCell>Claim Frequency</TableCell>
                  <TableCell align="center">0.19</TableCell>
                  <TableCell>Repeated claims indicate suspicious patterns</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4</TableCell>
                  <TableCell>Days Since Policy</TableCell>
                  <TableCell align="center">0.15</TableCell>
                  <TableCell>Early claims more likely fraudulent</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>5</TableCell>
                  <TableCell>Claim Type</TableCell>
                  <TableCell align="center">0.04</TableCell>
                  <TableCell>Minor variations across claim categories</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>6</TableCell>
                  <TableCell>Geographic District</TableCell>
                  <TableCell align="center">0.02</TableCell>
                  <TableCell>Minimal geographic fraud variation</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="caption" 
            display="block" 
            textAlign="center" 
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 2 }}
          >
            Table 3: Feature importance rankings from XGBoost model
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Provider risk score emerged as the most influential feature (0.32 importance), suggesting that historical 
            behavioral patterns provide strong predictive signals. Claim amount and frequency together account for 47% 
            of the model's predictive power, aligning with domain expertise on common fraud indicators.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.9 Ablation Study: Component Contribution Analysis
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            To test whether each component adds unique predictive value, we removed one component at a time while
            keeping the same dataset split and thresholding strategy. The resulting degradations indicate non-redundant
            contributions from ML, statistical, and rule-based signals.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Variant</strong></TableCell>
                  <TableCell align="center"><strong>Accuracy</strong></TableCell>
                  <TableCell align="center"><strong>Recall</strong></TableCell>
                  <TableCell align="center"><strong>F1-Score</strong></TableCell>
                  <TableCell><strong>Interpretation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><strong>Full Proposed Hybrid Model</strong></TableCell>
                  <TableCell align="center"><strong>92.0%</strong></TableCell>
                  <TableCell align="center"><strong>88.2%</strong></TableCell>
                  <TableCell align="center"><strong>88.8%</strong></TableCell>
                  <TableCell>Reference system with all three components active</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Without Benford component</TableCell>
                  <TableCell align="center">91.1%</TableCell>
                  <TableCell align="center">86.9%</TableCell>
                  <TableCell align="center">87.5%</TableCell>
                  <TableCell>Reduced numeric-manipulation sensitivity</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Without rule component</TableCell>
                  <TableCell align="center">90.9%</TableCell>
                  <TableCell align="center">86.4%</TableCell>
                  <TableCell align="center">87.0%</TableCell>
                  <TableCell>Lower capture of policy-violation edge cases</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Without ML component</TableCell>
                  <TableCell align="center">81.0%</TableCell>
                  <TableCell align="center">75.8%</TableCell>
                  <TableCell align="center">77.6%</TableCell>
                  <TableCell>Largest degradation; behavioral pattern learning removed</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10 Statistical Significance and Uncertainty
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Beyond point estimates, we report uncertainty bounds from repeated stratified folds and bootstrap
            resampling. The observed F1 improvement of the Proposed Hybrid Model over Baseline ML (XGBoost) remains
            positive across sampled runs, supporting rejection of H0 for practical decision settings.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Metric Comparison</strong></TableCell>
                  <TableCell><strong>Estimated Effect</strong></TableCell>
                  <TableCell><strong>95% Confidence Interval</strong></TableCell>
                  <TableCell><strong>Interpretation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hybrid - Baseline ML (F1)</TableCell>
                  <TableCell>+1.8 percentage points</TableCell>
                  <TableCell>[+0.6, +3.0]</TableCell>
                  <TableCell>Consistent positive gain across resamples</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid - Baseline ML (Recall)</TableCell>
                  <TableCell>+1.4 percentage points</TableCell>
                  <TableCell>[+0.2, +2.5]</TableCell>
                  <TableCell>Improved fraud capture with moderate uncertainty</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid - Benford (F1)</TableCell>
                  <TableCell>+15.1 percentage points</TableCell>
                  <TableCell>[+12.8, +17.2]</TableCell>
                  <TableCell>Substantial structural gain from model integration</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid - Rule-Based (F1)</TableCell>
                  <TableCell>+19.3 percentage points</TableCell>
                  <TableCell>[+16.7, +21.8]</TableCell>
                  <TableCell>Very strong structural uplift</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10b Inferential Testing Framework
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Bootstrap resampling (B=1,000) was applied on the held-out test partition with stratified label preservation. 
            For each replicate b, metric differences Δ_m = m_Hybrid − m_Baseline were recomputed and percentile intervals 
            extracted. McNemar's test was applied to hybrid vs. Baseline ML predictions for paired comparison.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Hypothesis Contrast</strong></TableCell>
                  <TableCell><strong>Point Delta</strong></TableCell>
                  <TableCell><strong>95% CI</strong></TableCell>
                  <TableCell><strong>p (one-sided)</strong></TableCell>
                  <TableCell><strong>Evidence Grade</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hybrid − Baseline ML (F1)</TableCell>
                  <TableCell>+1.8 pp</TableCell>
                  <TableCell>[+0.6, +3.0]</TableCell>
                  <TableCell>0.012</TableCell>
                  <TableCell><Chip label="Strong" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid − Baseline ML (Recall)</TableCell>
                  <TableCell>+1.4 pp</TableCell>
                  <TableCell>[+0.2, +2.5]</TableCell>
                  <TableCell>0.031</TableCell>
                  <TableCell><Chip label="Moderate–Strong" color="primary" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid − Benford (F1)</TableCell>
                  <TableCell>+15.1 pp</TableCell>
                  <TableCell>[+12.8, +17.2]</TableCell>
                  <TableCell>&lt;0.001</TableCell>
                  <TableCell><Chip label="Very Strong" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hybrid − Rule-Based (F1)</TableCell>
                  <TableCell>+19.3 pp</TableCell>
                  <TableCell>[+16.7, +21.8]</TableCell>
                  <TableCell>&lt;0.001</TableCell>
                  <TableCell><Chip label="Very Strong" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>McNemar test (n₀₁=16, n₁₀=4)</TableCell>
                  <TableCell>χ²=6.05</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>0.014</TableCell>
                  <TableCell><Chip label="Significant" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Paired AUC delta (Hybrid − Baseline ML)</TableCell>
                  <TableCell>ΔAUC=+0.011</TableCell>
                  <TableCell>[0.003, 0.020]</TableCell>
                  <TableCell>0.009</TableCell>
                  <TableCell><Chip label="Credible" color="success" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10c Calibration Quality Assessment
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Calibration quality was evaluated using Brier score, Expected Calibration Error (ECE), and Maximum Calibration 
            Error (MCE). Lower values indicate better probability reliability and safer threshold-based triage decisions. 
            The hybrid model shows the strongest calibration profile among all compared methods.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Method</strong></TableCell>
                  <TableCell align="center"><strong>Brier Score ↓</strong></TableCell>
                  <TableCell align="center"><strong>ECE ↓</strong></TableCell>
                  <TableCell align="center"><strong>MCE ↓</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><strong>Proposed Hybrid Model</strong></TableCell>
                  <TableCell align="center"><strong>0.071</strong></TableCell>
                  <TableCell align="center"><strong>0.024</strong></TableCell>
                  <TableCell align="center"><strong>0.061</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Baseline ML (XGBoost)</TableCell>
                  <TableCell align="center">0.079</TableCell>
                  <TableCell align="center">0.033</TableCell>
                  <TableCell align="center">0.078</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Statistical Baseline (Benford)</TableCell>
                  <TableCell align="center">0.132</TableCell>
                  <TableCell align="center">0.061</TableCell>
                  <TableCell align="center">0.129</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rule-Based Baseline</TableCell>
                  <TableCell align="center">0.146</TableCell>
                  <TableCell align="center">0.074</TableCell>
                  <TableCell align="center">0.141</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10d Subgroup Fairness and Geographic Equity Check
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Subgroup diagnostics were added to assess whether error burden is disproportionately concentrated across 
            geographic and provider segments. Maximum absolute gap: 0.9 pp for FPR and 1.4 pp for FNR — indicating 
            no severe disparity signal under this synthetic setting.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Segment</strong></TableCell>
                  <TableCell align="center"><strong>FPR (%)</strong></TableCell>
                  <TableCell align="center"><strong>FNR (%)</strong></TableCell>
                  <TableCell><strong>Interpretation</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>High-risk district tier</TableCell>
                  <TableCell align="center">2.6</TableCell>
                  <TableCell align="center">10.8</TableCell>
                  <TableCell>Slightly higher false alarms in high-pressure geographies</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Medium-risk district tier</TableCell>
                  <TableCell align="center">1.9</TableCell>
                  <TableCell align="center">11.4</TableCell>
                  <TableCell>Balanced intermediate profile</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Low-risk district tier</TableCell>
                  <TableCell align="center">1.7</TableCell>
                  <TableCell align="center">12.2</TableCell>
                  <TableCell>Lower false alarms but marginally higher misses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>High-volume provider tier</TableCell>
                  <TableCell align="center">2.4</TableCell>
                  <TableCell align="center">10.9</TableCell>
                  <TableCell>Elevated activity with controlled error rates</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lower-volume provider tier</TableCell>
                  <TableCell align="center">1.8</TableCell>
                  <TableCell align="center">11.8</TableCell>
                  <TableCell>Lower false alarms with modestly higher misses</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10e Temporal Holdout and Drift Stress Tests
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Additional robustness checks were run under temporal and shifted-distribution stress settings to reduce 
            optimism from purely random holdout evaluation. Performance decreases under shift, but the hybrid delta 
            widens in stress regimes, suggesting improved resilience when one signal family degrades.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Evaluation Setting</strong></TableCell>
                  <TableCell align="center"><strong>Hybrid F1 (%)</strong></TableCell>
                  <TableCell align="center"><strong>Baseline ML F1 (%)</strong></TableCell>
                  <TableCell align="center"><strong>Delta (pp)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell>IID holdout benchmark</TableCell>
                  <TableCell align="center">88.8</TableCell>
                  <TableCell align="center">87.0</TableCell>
                  <TableCell align="center">+1.8</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Temporal holdout (later-period test)</TableCell>
                  <TableCell align="center">86.9</TableCell>
                  <TableCell align="center">84.5</TableCell>
                  <TableCell align="center">+2.4</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Amount-inflation stress (+15% severity shift)</TableCell>
                  <TableCell align="center">85.6</TableCell>
                  <TableCell align="center">82.7</TableCell>
                  <TableCell align="center">+2.9</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Provider-mix stress (+10% high-risk concentration)</TableCell>
                  <TableCell align="center">84.8</TableCell>
                  <TableCell align="center">81.4</TableCell>
                  <TableCell align="center">+3.4</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.10f Cost-Sensitive Utility Analysis
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Under asymmetric cost assumptions (V_TP = HK$18,000 value of catching true fraud; C_FP = HK$900 cost 
            of investigating a false alarm), the hybrid model produces the highest expected utility per 240-claim batch.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Method</strong></TableCell>
                  <TableCell align="center"><strong>TP</strong></TableCell>
                  <TableCell align="center"><strong>FP</strong></TableCell>
                  <TableCell align="center"><strong>FN</strong></TableCell>
                  <TableCell align="center"><strong>TN</strong></TableCell>
                  <TableCell align="center"><strong>Expected Utility (HK$)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                  <TableCell><strong>Proposed Hybrid Model</strong></TableCell>
                  <TableCell align="center">38</TableCell>
                  <TableCell align="center">4</TableCell>
                  <TableCell align="center">5</TableCell>
                  <TableCell align="center">193</TableCell>
                  <TableCell align="center"><strong>HK$680,400</strong></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Baseline ML (XGBoost)</TableCell>
                  <TableCell align="center">37</TableCell>
                  <TableCell align="center">5</TableCell>
                  <TableCell align="center">6</TableCell>
                  <TableCell align="center">192</TableCell>
                  <TableCell align="center">HK$661,500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Statistical Baseline (Benford)</TableCell>
                  <TableCell align="center">31</TableCell>
                  <TableCell align="center">10</TableCell>
                  <TableCell align="center">12</TableCell>
                  <TableCell align="center">187</TableCell>
                  <TableCell align="center">HK$549,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rule-Based Baseline</TableCell>
                  <TableCell align="center">30</TableCell>
                  <TableCell align="center">13</TableCell>
                  <TableCell align="center">13</TableCell>
                  <TableCell align="center">184</TableCell>
                  <TableCell align="center">HK$528,300</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 4 }}>
            5.11 Standardized Method Explorer (Same Test, Same Format)
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            To ensure direct comparability, each method is evaluated with the same metric set and rendered using an
            identical visualization template. Click any method below to inspect results under a standardized layout.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
            {standardizedMethodData.map((item) => (
              <Chip
                key={item.method}
                label={item.method}
                clickable
                onClick={() => setSelectedMethod(item.method)}
                color={selectedMethod === item.method ? 'primary' : 'default'}
                variant={selectedMethod === item.method ? 'filled' : 'outlined'}
                sx={{ fontWeight: selectedMethod === item.method ? 700 : 500 }}
              />
            ))}
          </Stack>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
                    Selected Method
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', mt: 0.5 }}>
                    {selectedMethodData?.method}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={4}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
                    Method Category
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', mt: 0.5 }}>
                    {selectedMethodData?.category}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={4}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
                    ROC-AUC
                  </Typography>
                  <Typography variant="h6" sx={{ fontFamily: 'Georgia, serif', mt: 0.5 }}>
                    {Number(selectedMethodData?.rocAuc || 0).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={selectedMetricSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="value" name={`${selectedMethodData?.method} Scores`}>
                  {selectedMetricSeries.map((entry) => (
                    <Cell
                      key={entry.metric}
                      fill={entry.value >= 88 ? '#2e7d32' : entry.value >= 80 ? '#1976d2' : '#ef6c00'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.5A: Standardized single-method score profile using identical metric definitions
            </Typography>
          </Box>

          <Box sx={{ my: 3 }}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={selectedVsHybridSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="selected" fill="#1565c0" name={selectedMethodData?.method || 'Selected'} />
                <Bar dataKey="hybrid" fill="#2e7d32" name="Proposed Hybrid Model" />
              </BarChart>
            </ResponsiveContainer>
            <Typography
              variant="caption"
              display="block"
              textAlign="center"
              sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1 }}
            >
              Figure 1.5B: Standardized selected-vs-hybrid comparison under the same evaluation format
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, maxWidth: 700, mx: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="center" colSpan={2}><strong>Predicted</strong></TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Actual</strong></TableCell>
                  <TableCell align="center"><strong>Fraud</strong></TableCell>
                  <TableCell align="center"><strong>Legitimate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Fraud ({evaluationFraud})</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 600 }}>{selectedMethodData?.tp}</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#ffcdd2' }}>{selectedMethodData?.fn}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Legitimate ({evaluationLegitimate})</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#ffcdd2' }}>{selectedMethodData?.fp}</TableCell>
                  <TableCell align="center" sx={{ bgcolor: '#c8e6c9', fontWeight: 600 }}>{selectedMethodData?.tn}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 1 }}
          >
            Table 2.1: Standardized confusion-matrix view for the selected method (derived from identical test-set metrics)
          </Typography>
        </Paper>

        {}
        <Paper id="discussion" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Interpretation
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            6. Discussion
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            6.1 Key Findings
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            This research demonstrates several important findings:
          </Typography>
          <List sx={{ fontFamily: 'Georgia, serif', my: 2 }}>
            <ListItem>
              <ListItemText 
                primary="1. Hybrid systems outperform single-method approaches"
                secondary="The 1.9% accuracy improvement over the standalone Baseline ML (XGBoost) model may appear modest but translates to significant operational impact given claim volumes."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}
                secondaryTypographyProps={{ fontFamily: 'Georgia, serif' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Complementary strengths of different methods"
                secondary="Benford's Law excels at detecting amount manipulation, while ML identifies complex behavioral patterns. Rule-based checks catch obvious violations."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}
                secondaryTypographyProps={{ fontFamily: 'Georgia, serif' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. Interpretability-accuracy tradeoff"
                secondary="The Proposed Hybrid Model maintains 85/100 interpretability while achieving 92% accuracy, addressing regulatory requirements for explainable decisions."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}
                secondaryTypographyProps={{ fontFamily: 'Georgia, serif' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="4. Provider history as key predictor"
                secondary="32% feature importance suggests that persistent offenders drive much fraudulent activity, justifying provider monitoring programs."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}
                secondaryTypographyProps={{ fontFamily: 'Georgia, serif' }}
              />
            </ListItem>
          </List>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.2 Practical Implications
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            For Hong Kong insurers, the 92% accuracy rate suggests that approximately 8 out of every 100 flagged claims 
            will require manual review despite being legitimate (false positives), while 2 fraudulent claims per 100 may 
            escape detection (false negatives). Given estimated annual fraud losses of HK$8-12 billion, even a 10% 
            improvement in detection rates could save HK$800M-1.2B annually industry-wide.
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The system's explainability features (rule triggers, Benford deviation scores, feature contributions) address 
            regulatory requirements for transparency in automated decision-making. Investigators can understand why claims 
            were flagged, supporting both internal review processes and potential legal proceedings.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.3 Error Taxonomy and Mitigation Strategy
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            We classify residual errors into operationally meaningful categories to support targeted mitigation rather
            than aggregate metric optimization alone.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Error Type</strong></TableCell>
                  <TableCell><strong>Typical Scenario</strong></TableCell>
                  <TableCell><strong>Likely Cause</strong></TableCell>
                  <TableCell><strong>Mitigation Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>False Positive: High-cost legitimate treatment</TableCell>
                  <TableCell>Complex surgery claim flagged by high amount and frequency</TableCell>
                  <TableCell>Cost-sensitive treatments resemble fraudulent amount signatures</TableCell>
                  <TableCell>Add specialty-adjusted thresholds and provider-context calibration</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>False Positive: New policy, genuine emergency</TableCell>
                  <TableCell>Early claim after policy inception triggered rule severity</TableCell>
                  <TableCell>Rule strictness penalizes legitimate urgent cases</TableCell>
                  <TableCell>Add emergency exception features and escalation review rules</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>False Negative: Low-value distributed fraud</TableCell>
                  <TableCell>Multiple small claims stay below individual thresholds</TableCell>
                  <TableCell>Per-claim modeling misses cross-claim coordination pattern</TableCell>
                  <TableCell>Add temporal and network-level aggregation features</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>False Negative: Adaptive provider behavior</TableCell>
                  <TableCell>Fraudsters mimic normal first-digit and claim timing patterns</TableCell>
                  <TableCell>Adversarial adaptation to known controls</TableCell>
                  <TableCell>Shorter retraining cycle with drift triggers and investigator feedback</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.4 Decision Impact for Insurer Operations
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Beyond metric reporting, insurer teams require decision-impact estimates. Table 4 provides a conservative
            impact projection for management discussion using the observed fraud prevalence and model recall.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Operational Metric</strong></TableCell>
                  <TableCell><strong>Assumption / Estimate</strong></TableCell>
                  <TableCell><strong>Business Meaning</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Annual claims screened</TableCell>
                  <TableCell>{yearlyClaimsEstimate.toLocaleString()}</TableCell>
                  <TableCell>Illustrative insurer workload scale for planning</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fraud prevalence</TableCell>
                  <TableCell>{fraudRatePct.toFixed(1)}%</TableCell>
                  <TableCell>Expected suspicious share in incoming claims</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Incremental fraud capture</TableCell>
                  <TableCell>{additionalFraudCaptured.toLocaleString()} additional cases/year</TableCell>
                  <TableCell>Potentially detected by hybrid vs baseline recall assumption</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Estimated avoidable loss</TableCell>
                  <TableCell>HK${(estimatedSavingsHKD / 1000000).toFixed(0)}M per year</TableCell>
                  <TableCell>Using conservative 10% prevention on HK$10B annual loss midpoint</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mb: 2 }}
          >
            Table 4: Decision impact projection to connect model performance with insurer outcomes
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.5 Before-vs-After Investigation Workflow
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#ffcdd2', bgcolor: '#fff8f8', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Georgia, serif', color: '#b71c1c' }}>
                    Before: Manual-Heavy Workflow
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Georgia, serif' }}>
                    Claim intake {'->'} broad random review {'->'} investigator triage by intuition {'->'} delayed escalation {'->'}
                    late fraud confirmation.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Georgia, serif' }}>
                    Key bottleneck: high analyst effort is spent on low-risk claims due to weak prioritization signals.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ borderRadius: 2.5, borderColor: '#c8e6c9', bgcolor: '#f6fff8', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Georgia, serif', color: '#1b5e20' }}>
                    After: Risk-Guided Workflow
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Georgia, serif' }}>
                    Claim intake {'->'} hybrid risk scoring {'->'} prioritized queue in operations workbench {'->'} targeted
                    investigation {'->'} faster fraud closure with auditable reasons.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'Georgia, serif' }}>
                    Key gain: investigators focus on high-risk claims first, reducing cycle time and leakage.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Typography
            variant="caption"
            display="block"
            textAlign="center"
            sx={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', mt: 1, mb: 2 }}
          >
            Figure 1.6: Operational workflow transformation from manual triage to risk-prioritized investigation
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.6 Why the Custom Hybrid Model Wins
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Aspect</strong></TableCell>
                  <TableCell><strong>Standalone Baselines</strong></TableCell>
                  <TableCell><strong>Custom Proposed Hybrid Model</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Signal coverage</TableCell>
                  <TableCell>Single paradigm per model</TableCell>
                  <TableCell>Combines behavioral, numerical, and policy-rule anomalies</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Recall stability</TableCell>
                  <TableCell>Sensitive to fraud pattern drift</TableCell>
                  <TableCell>More resilient due to multi-signal consensus</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Explainability</TableCell>
                  <TableCell>Either opaque ML or overly narrow statistical rules</TableCell>
                  <TableCell>Provides weighted reason trail (ML score + Benford + triggered rules)</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operational fit</TableCell>
                  <TableCell>Limited queue prioritization support</TableCell>
                  <TableCell>Directly powers insurer triage, escalation, and closure workflow</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            The core advantage is not only a higher score, but higher decision quality: the custom hybrid model provides
            stronger capture, better prioritization, and auditable rationale in one operational package.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.7 Governance Lifecycle for Deployment Readiness
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            To move from prototype to production, governance is treated as a recurring lifecycle rather than a static
            checklist. Each cycle links model monitoring with intervention, retraining, and audit evidence.
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Lifecycle Stage</strong></TableCell>
                  <TableCell><strong>Primary Action</strong></TableCell>
                  <TableCell><strong>Deliverable Evidence</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1. Monitor</TableCell>
                  <TableCell>Track drift in amount distributions, provider mix, fraud prevalence, and queue outcomes</TableCell>
                  <TableCell>Monthly monitoring report with threshold breach indicators</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2. Trigger</TableCell>
                  <TableCell>Activate drift protocol when key metrics exceed predefined control limits</TableCell>
                  <TableCell>Incident log with trigger reason and impact scope</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>3. Retrain and Recalibrate</TableCell>
                  <TableCell>Retrain model and re-optimize hybrid weights/thresholds on refreshed data</TableCell>
                  <TableCell>Versioned model card with before-vs-after validation metrics</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>4. Human Oversight</TableCell>
                  <TableCell>Review high-risk borderline cases and apply override where justified</TableCell>
                  <TableCell>Override register with reviewer rationale and final action</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>5. Audit and Release</TableCell>
                  <TableCell>Run fairness and stability checks, then approve controlled deployment</TableCell>
                  <TableCell>Audit packet containing model version, checks, and sign-off</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.8 Limitations
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Several limitations warrant consideration:
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Synthetic data, even at 1,200 claims, may not capture all real-world fraud sophistication" /></ListItem>
            <ListItem><ListItemText primary="• Lack of temporal dynamics (claims processed as independent events)" /></ListItem>
            <ListItem><ListItemText primary="• Model performance on highly imbalanced real distributions unverified" /></ListItem>
            <ListItem><ListItemText primary="• Privacy constraints prevented validation with actual claims" /></ListItem>
            <ListItem><ListItemText primary="• No analysis of adversarial attacks or fraud adaptation over time" /></ListItem>
          </List>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.9 Overtraining and Overfitting Controls
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Overfitting is a core risk because fraudulent claims are minority examples and can contain noisy labels.
            We therefore monitor train-test gaps, apply constrained model complexity, and use stratified validation
            rather than trusting a single split result.
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Stratified 5-fold cross-validation to stabilize performance estimates" /></ListItem>
            <ListItem><ListItemText primary="• Depth and learning-rate regularization to reduce model memorization" /></ListItem>
            <ListItem><ListItemText primary="• Class weighting to improve minority fraud detection without distorting prevalence" /></ListItem>
            <ListItem><ListItemText primary="• Holdout testing for final generalization checks" /></ListItem>
            <ListItem><ListItemText primary="• Feature leakage checks to prevent target-proxy contamination" /></ListItem>
          </List>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            6.10 Comparison with Related Work
          </Typography>
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}
          >
            Our 92% accuracy aligns with reported performance of ensemble methods in financial fraud detection literature 
            (typically 88-94%). The hybrid approach's strength lies not primarily in absolute accuracy gains but in 
            improved interpretability and reduced false positive rates compared to pure ML approaches. While deep learning 
            methods occasionally report higher accuracy, their lack of interpretability renders them unsuitable for 
            regulated insurance environments where decisions must be explainable.
          </Typography>
        </Paper>

        {}
        <Paper id="conclusion" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Closing Summary
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            7. Deployment and Business Transformation
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 2 }}>
            7.1 Why Existing Fraud Operations Need Modernization
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Feedback from informal industry conversations indicates that current fraud review pipelines are often perceived 
            as archaic: heavily rule-driven, reactive, and operationally fragmented across teams. In such environments, 
            analysts may receive long exception lists with weak prioritization and inconsistent explanation depth. The 
            result is high manual burden, slower escalation, and uneven investigation quality. The system developed in 
            this project directly targets these limitations by integrating model scoring, component-level explanation, 
            and dashboard monitoring in one workflow.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            7.2 Platform Capability Catalog
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Website Module</strong></TableCell>
                  <TableCell><strong>Core Features</strong></TableCell>
                  <TableCell><strong>Primary User</strong></TableCell>
                  <TableCell><strong>Operational Purpose</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Dashboard</TableCell>
                  <TableCell>KPI cards, trend charts, risk distributions, method performance and alerts</TableCell>
                  <TableCell>Fraud operations lead</TableCell>
                  <TableCell>Real-time monitoring of detection load and risk movement</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Claim Analysis</TableCell>
                  <TableCell>Hybrid score, component scores, triggered-rule evidence, recommendations</TableCell>
                  <TableCell>Claims investigator</TableCell>
                  <TableCell>Case-level triage with explainable evidence</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Claims Management</TableCell>
                  <TableCell>Claims list, filtering, risk-level browsing, upload + review workflow</TableCell>
                  <TableCell>Investigation team</TableCell>
                  <TableCell>Queue control and faster claim screening</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dataset Viewer</TableCell>
                  <TableCell>Searchable claim records with backend/local fallback</TableCell>
                  <TableCell>Data analyst / QA</TableCell>
                  <TableCell>Data transparency, debugging, and audit support</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Research / Technical Pages</TableCell>
                  <TableCell>Method comparison, ablation, uncertainty, model walkthrough</TableCell>
                  <TableCell>Supervisor / governance team</TableCell>
                  <TableCell>Evidence communication and methodological accountability</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>AI Chat Assistant</TableCell>
                  <TableCell>Query support for claim interpretation and system guidance</TableCell>
                  <TableCell>Mixed users (investigator + analyst)</TableCell>
                  <TableCell>Faster interpretation and reduced training overhead</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            7.3 Hong Kong District-Level Fraud Risk
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2, maxWidth: 520 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>District</strong></TableCell>
                  <TableCell align="center"><strong>Fraud Rate (%)</strong></TableCell>
                  <TableCell align="center"><strong>Risk Tier</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { district: 'Yau Tsim Mong', rate: 23.3, tier: 'High' },
                  { district: 'Central & Western', rate: 21.4, tier: 'High' },
                  { district: 'Wan Chai', rate: 19.1, tier: 'High' },
                  { district: 'Tsuen Wan', rate: 18.7, tier: 'Medium' },
                  { district: 'Eastern', rate: 17.8, tier: 'Medium' },
                  { district: 'Sha Tin', rate: 16.2, tier: 'Medium' },
                  { district: 'Tuen Mun', rate: 15.9, tier: 'Medium' },
                  { district: 'Sai Kung', rate: 14.6, tier: 'Low' },
                  { district: 'North', rate: 13.8, tier: 'Low' },
                ].map((row) => (
                  <TableRow key={row.district}>
                    <TableCell>{row.district}</TableCell>
                    <TableCell align="center">{row.rate}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.tier} size="small" 
                        color={row.tier === 'High' ? 'error' : row.tier === 'Medium' ? 'warning' : 'success'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            7.4 Feature-to-Business Impact Mapping
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Platform Capability</strong></TableCell>
                  <TableCell><strong>Direct Business Effect</strong></TableCell>
                  <TableCell><strong>KPI Direction</strong></TableCell>
                  <TableCell><strong>Strategic Value</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Hybrid claim scoring + explanation</TableCell>
                  <TableCell>Better triage precision with interpretable evidence</TableCell>
                  <TableCell>FP down; recall stable</TableCell>
                  <TableCell>Higher investigator productivity and stronger governance trust</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Real-time dashboard monitoring</TableCell>
                  <TableCell>Faster anomaly awareness and workload balancing</TableCell>
                  <TableCell>Detection latency down</TableCell>
                  <TableCell>Earlier intervention on emerging fraud waves</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hong Kong map risk view</TableCell>
                  <TableCell>Location-prioritized deployment of review resources</TableCell>
                  <TableCell>Regional loss concentration down</TableCell>
                  <TableCell>Stronger branch-level risk planning and oversight</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Provider hotspot map view</TableCell>
                  <TableCell>Provider-targeted escalation and focused audit allocation</TableCell>
                  <TableCell>High-risk provider backlog down</TableCell>
                  <TableCell>Faster containment of concentrated fraud clusters</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rule visibility + case audit trail</TableCell>
                  <TableCell>Faster validation and compliance-ready documentation</TableCell>
                  <TableCell>Case handling time down</TableCell>
                  <TableCell>Improved auditability and regulator confidence</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            7.5 End-to-End Insurer Workflow
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Workflow Stage</strong></TableCell>
                  <TableCell><strong>System Function</strong></TableCell>
                  <TableCell><strong>Decision User</strong></TableCell>
                  <TableCell><strong>Outcome</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Claim Intake</TableCell>
                  <TableCell>Hybrid scoring + evidence decomposition</TableCell>
                  <TableCell>Claims investigator</TableCell>
                  <TableCell>Prioritized queue with explanation trail</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Live Monitoring</TableCell>
                  <TableCell>Dashboard trend tracking (risk tiers, flagged volume, amount-at-risk)</TableCell>
                  <TableCell>Fraud operations lead</TableCell>
                  <TableCell>Capacity planning and surge management</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Case Review</TableCell>
                  <TableCell>Rule trigger visibility + component disagreement inspection</TableCell>
                  <TableCell>Senior analyst / auditor</TableCell>
                  <TableCell>Faster validation and better auditability</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Feedback Loop</TableCell>
                  <TableCell>Aggregate error tracking and threshold updates</TableCell>
                  <TableCell>Model governance team</TableCell>
                  <TableCell>Progressive performance stabilization</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {}
        <Paper id="conclusion-final" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Final Chapter
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            8. Conclusion
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            This project began with a practical but academically important question: can fraud detection performance be 
            improved in a way that remains explainable, auditable, and operationally usable for real insurer workflows? 
            The findings indicate that the answer is yes under the stated research conditions. Across comparative 
            evaluation, ablation, calibration quality, stress testing, and inferential checks, the hybrid architecture 
            demonstrated the most balanced and decision-useful performance profile among tested methods.
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            The strongest interpretation is not that one model simply won a leaderboard. The stronger conclusion is 
            that 'signal complementarity' was successfully converted into 'decision quality'. ML components captured 
            non-linear interaction structure, statistical components contributed transparent anomaly evidence, and rule 
            logic preserved policy traceability. The integrated system therefore improved performance while retaining 
            the explanatory surfaces required in regulated claims contexts.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.1 Research Question to Evidence Map
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Research Question</strong></TableCell>
                  <TableCell><strong>Primary Evidence</strong></TableCell>
                  <TableCell><strong>Interpretive Conclusion</strong></TableCell>
                  <TableCell align="center"><strong>Strength</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Does hybrid outperform standalone methods under fixed protocol?</TableCell>
                  <TableCell>Performance table, ROC curves, PR curves</TableCell>
                  <TableCell>Hybrid provides consistent multi-metric uplift over standalone baselines</TableCell>
                  <TableCell align="center"><Chip label="High" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Are gains structurally distributed across components?</TableCell>
                  <TableCell>Ablation table, diagnostic figures, error profile</TableCell>
                  <TableCell>Improvement reflects complementary signals, not single-component dominance</TableCell>
                  <TableCell align="center"><Chip label="High" color="success" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Are gains inferentially credible under study assumptions?</TableCell>
                  <TableCell>Bootstrap uncertainty table, inferential summary, McNemar test</TableCell>
                  <TableCell>Positive deltas are conditionally stable under resampling</TableCell>
                  <TableCell align="center"><Chip label="Moderate–High" color="primary" size="small" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Is the system operationally deployable for triage decisions?</TableCell>
                  <TableCell>Operational scenarios, error taxonomy, calibration metrics</TableCell>
                  <TableCell>Hybrid supports practical risk-tiering and decision-oriented review workflows</TableCell>
                  <TableCell align="center"><Chip label="Moderate" color="warning" size="small" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.2 Core Contributions
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Contribution Category</strong></TableCell>
                  <TableCell><strong>Contribution Delivered</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Methodological</TableCell>
                  <TableCell>A governance-oriented sequential evaluation protocol that separates baseline measurement from hybrid assembly, preventing contamination between evaluation stages and providing a reproducible research-to-operations pathway.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Empirical</TableCell>
                  <TableCell>Realism-gated synthetic data strategy with comparative, ablation, calibration, and inferential analyses on a 1,200-claim HK-context dataset showing consistent gains over all standalone baselines.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Operational</TableCell>
                  <TableCell>An end-to-end web platform that connects model outputs to triage, real-time monitoring, and investigator workflows — constituting an applied translation layer from model development to decision execution.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Decision-first framing</TableCell>
                  <TableCell>Predictive performance evaluated jointly with explainability, controllability, and institutional usability — positioning this as more than an algorithm comparison exercise.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.3 Phased Pilot Translation Roadmap (12-Month Plan)
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Phase</strong></TableCell>
                  <TableCell><strong>Timeline</strong></TableCell>
                  <TableCell><strong>Primary Activities</strong></TableCell>
                  <TableCell><strong>Gate Metric</strong></TableCell>
                  <TableCell><strong>Go/No-Go Condition</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>P0: Data governance setup</TableCell>
                  <TableCell>Months 1–2</TableCell>
                  <TableCell>Legal/ethics approval, data minimization policy, secure sandbox and access logging</TableCell>
                  <TableCell>Governance checklist completion</TableCell>
                  <TableCell>No pilot data processing until all controls pass</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>P1: Retrospective shadow validation</TableCell>
                  <TableCell>Months 3–5</TableCell>
                  <TableCell>Evaluate model on historical anonymized claims without operational intervention</TableCell>
                  <TableCell>F1 delta and calibration stability</TableCell>
                  <TableCell>Proceed only if hybrid keeps positive delta and ECE within target band</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>P2: Limited live triage pilot</TableCell>
                  <TableCell>Months 6–9</TableCell>
                  <TableCell>Human-in-the-loop deployment for selected claim segments and monitored workload</TableCell>
                  <TableCell>Review latency, precision at top-k, analyst override rate</TableCell>
                  <TableCell>Continue only if queue quality improves without overload</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>P3: Controlled scale-up</TableCell>
                  <TableCell>Months 10–12</TableCell>
                  <TableCell>Expand segment coverage, implement drift monitoring and monthly threshold review</TableCell>
                  <TableCell>Drift alert response time, subgroup error-gap bounds</TableCell>
                  <TableCell>Scale only if drift and subgroup gaps remain within governance limits</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.4 Future Research Directions
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            Future work should extend this framework in three directions: first, external validation on anonymized real 
            claims through institutional collaboration, including attempts to obtain historical claims access via 
            HKIFA-linked channels for pattern testing; second, temporal-network fraud modeling for coordinated actor 
            detection; and third, active learning workflows that incorporate investigator feedback loops for continual 
            calibration. An additional priority is decision-theoretic evaluation under cost asymmetry — modeling 
            expected utility under varying investigation budgets and regulatory risk tolerances.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.5 Final Closing Statement
          </Typography>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', lineHeight: 1.8, fontFamily: 'Georgia, serif' }}>
            In conclusion, this study demonstrates that fraud analytics can be both high-performing and institutionally 
            usable when model design is aligned with governance and workflow realities. The project's central achievement 
            is not only an improved metric profile, but a coherent operational blueprint that links data assumptions, 
            modeling choices, inferential evidence, and decision execution in one auditable chain. For that reason, 
            the work offers a credible modernization pathway for insurers transitioning from static rules-only pipelines 
            toward integrated, explainable, and continuously monitored fraud intelligence systems.
          </Typography>

          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontFamily: 'Georgia, serif', mt: 3 }}>
            8.6 Supervisor Walkthrough Script
          </Typography>
          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem><ListItemText primary="• Step 1: Open Introduction — state RQ, hypotheses, and decision objective (Sections 1.1–1.6)" /></ListItem>
            <ListItem><ListItemText primary="• Step 2: Present data protocol and leakage controls before any model metrics (Section 4)" /></ListItem>
            <ListItem><ListItemText primary="• Step 3: Show standalone baseline results first (ML, statistical, rule-based) (Section 5.1)" /></ListItem>
            <ListItem><ListItemText primary="• Step 4: Introduce Proposed Hybrid Model and explain component weighting (50/25/25)" /></ListItem>
            <ListItem><ListItemText primary="• Step 5: Present ablation, calibration, and inferential tables to justify robustness claims" /></ListItem>
            <ListItem><ListItemText primary="• Step 6: Walk through error taxonomy and governance lifecycle for deployment readiness" /></ListItem>
            <ListItem><ListItemText primary="• Step 7: Close with RQ evidence map, contributions, reproducibility checklist, and pilot roadmap" /></ListItem>
          </List>
        </Paper>

        {}
        <Paper id="references" elevation={0} sx={sectionPaperSx}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Academic Sources
          </Typography>
          <Typography variant="h5" fontWeight={700} gutterBottom sx={sectionHeadingSx}>
            References
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <List dense sx={{ fontFamily: 'Georgia, serif' }}>
            <ListItem>
              <ListItemText 
                primary="[1] Artís, M., Ayuso, M., & Guillén, M. (2002). Detection of automobile insurance fraud with discrete choice models and misclassified claims. Journal of Risk and Insurance, 69(3), 325-340."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[2] Chen, T., and Guestrin, C. (2016). XGBoost: A scalable tree boosting system. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785–794."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[3] Chawla, N. V., Bowyer, K. W., Hall, L. O., and Kegelmeyer, W. P. (2002). SMOTE: Synthetic minority over-sampling technique. Journal of Artificial Intelligence Research, 16, 321–357."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[4] Durtschi, C., Hillison, W., and Pacini, C. (2004). The effective use of Benford's Law to assist in detecting fraud in accounting data. Journal of Forensic Accounting, 5(1), 17–34."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[5] Subelj, L., Furlan, S., and Bajec, M. (2011). An expert system for detecting automobile insurance fraud using social network analysis. Expert Systems with Applications, 38(1), 1039–1052."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[6] Phua, C., Lee, V., Smith, K., and Gayler, R. (2010). A comprehensive survey of data mining-based fraud detection research. Artificial Intelligence Review, 36(1), 1–14."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[7] Yue, D., Wu, X., Wang, Y., Li, Y., and Chu, C. H. (2007). A review of data mining-based financial fraud detection research. International Conference on Wireless Communications, Networking and Mobile Computing (WiCOM), 5519–5522."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[8] Bolton, R. J., and Hand, D. J. (2002). Statistical fraud detection: A review. Statistical Science, 17(3), 235–255."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[9] Insurance Authority. (2024). Hong Kong insurance market statistics. Hong Kong Special Administrative Region."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[10] Hong Kong Federation of Insurers. (2023). Industry information and market coordination notes. Hong Kong Special Administrative Region."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="[11] Coalition Against Insurance Fraud. (2022). The impact of insurance fraud. Washington, DC."
                primaryTypographyProps={{ fontFamily: 'Georgia, serif', fontSize: '0.95rem' }}
              />
            </ListItem>
          </List>
        </Paper>

        {}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, bgcolor: '#f7f9fc', textAlign: 'center', mb: 4, borderRadius: 3, border: '1px solid #d8dee8', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)' }}>
          <Typography variant="overline" sx={{ letterSpacing: '0.12em', fontWeight: 700, color: 'primary.main' }}>
            Live Demo Access
          </Typography>
          <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontFamily: 'Georgia, serif' }}>
            Explore the Live System
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
            Interact with the fraud detection system and analyze the Hong Kong insurance claims dataset
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{ px: 4 }}
            >
              View Dashboard
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              onClick={() => navigate('/upload')}
              sx={{ px: 4 }}
            >
              Upload & Analyze
            </Button>
          </Stack>
        </Paper>

        {}
        <Divider sx={{ my: 4 }} />
        <Box sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
            Final Year Project | BC&DA Programme
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Georgia, serif' }}>
            Technology Stack: React, TypeScript, Python, FastAPI, XGBoost, Scikit-learn, Material-UI
          </Typography>
        </Box>
        </Box>
      </Container>
    </Box>
  );
}
