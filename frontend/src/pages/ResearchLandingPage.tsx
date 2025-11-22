import { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  LinearProgress,
  alpha,
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
  TextField,
  Fab,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  ListItemAvatar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Code as CodeIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Science as ScienceIcon,
  Calculate as CalculateIcon,
  Schema as SchemaIcon,
  CloudUpload as CloudUploadIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AccountBalance as AccountBalanceIcon,
  LocationCity as LocationCityIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  MonetizationOn as MoneyIcon,
  PersonSearch as PersonSearchIcon,
  NetworkCheck as NetworkCheckIcon,
  Description as DescriptionIcon,
  InsertDriveFile as FileIcon,
  SmartToy as BotIcon,
  Dashboard as DashboardIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Treemap,
} from 'recharts';

export default function ResearchLandingPage() {
  const [activeTab, setActiveTab] = useState(0); // 0: Research, 1: Dashboard, 2: Test Claims, 3: AI Assistant
  const [chatOpen, setChatOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI research assistant. Ask me anything about this fraud detection system.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Dashboard filters
  const [timeRange, setTimeRange] = useState('6months');
  const [riskLevel, setRiskLevel] = useState('all');
  const [claimType, setClaimType] = useState('all');
  const [region, setRegion] = useState('all');

  // Refs for scrolling to sections
  const abstractRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const methodologyRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const discussionRef = useRef<HTMLDivElement>(null);

  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, sectionName: string) => {
    setExpandedSection(sectionName);
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, 
      { role: 'user', content: chatInput },
      { role: 'assistant', content: 'AI capabilities coming soon! This feature will provide intelligent insights about the fraud detection system.' }
    ]);
    setChatInput('');
  };

  // Color scheme - Off-white and Dark Blue
  const colors = {
    darkBlue: '#1a237e',
    mediumBlue: '#0d47a1',
    lightBlue: '#1565c0',
    accentBlue: '#1976d2',
    offWhite: '#F8F9FA',
    pureWhite: '#FEFEFE',
    textPrimary: '#1a237e',
    textSecondary: '#5c6bc0',
  };

  // Utility function for exporting data to CSV
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Glossary Term Component with hover tooltip
  const TermTooltip = ({ term, definition }: { term: string; definition: string }) => (
    <Tooltip
      title={definition}
      arrow
      enterDelay={200}
      placement="top"
    >
      <Typography
        component="span"
        sx={{
          borderBottom: `2px dotted ${colors.darkBlue}`,
          cursor: 'help',
          '&:hover': { color: colors.mediumBlue }
        }}
      >
        {term}
      </Typography>
    </Tooltip>
  );

  // Mock data for visualizations
  const fraudTrends = [
    { month: 'Jan', legitimate: 420, fraudulent: 68, detected: 62 },
    { month: 'Feb', legitimate: 445, fraudulent: 72, detected: 67 },
    { month: 'Mar', legitimate: 490, fraudulent: 81, detected: 76 },
    { month: 'Apr', legitimate: 468, fraudulent: 75, detected: 70 },
    { month: 'May', legitimate: 512, fraudulent: 88, detected: 82 },
    { month: 'Jun', legitimate: 538, fraudulent: 92, detected: 86 },
  ];

  const detectionMethodsData = [
    { method: 'XGBoost ML', accuracy: 92.3, precision: 89.5, recall: 94.1 },
    { method: 'Benford\'s Law', accuracy: 85.7, precision: 82.3, recall: 88.9 },
    { method: 'Rule-Based', accuracy: 78.4, precision: 75.2, recall: 81.6 },
    { method: 'Network Analysis', accuracy: 88.2, precision: 86.1, recall: 90.3 },
    { method: 'Ensemble', accuracy: 94.8, precision: 93.2, recall: 96.4 },
  ];

  const fraudPatternDistribution = [
    { name: 'Duplicate Claims', value: 28, color: colors.darkBlue },
    { name: 'Inflated Amounts', value: 24, color: colors.mediumBlue },
    { name: 'Fake Documents', value: 18, color: colors.lightBlue },
    { name: 'Provider Collusion', value: 14, color: colors.accentBlue },
    { name: 'Ghost Patients', value: 9, color: '#5c6bc0' },
    { name: 'Other', value: 7, color: '#9fa8da' },
  ];

  const riskFactors = [
    { factor: 'Claim Amount', legitimate: 45, fraudulent: 85 },
    { factor: 'Submission Timing', legitimate: 60, fraudulent: 75 },
    { factor: 'Provider History', legitimate: 55, fraudulent: 90 },
    { factor: 'Claimant History', legitimate: 70, fraudulent: 65 },
    { factor: 'Document Quality', legitimate: 80, fraudulent: 55 },
    { factor: 'Network Patterns', legitimate: 50, fraudulent: 88 },
  ];

  const geographicData = [
    { district: 'Central & Western', rate: 12.5, claims: 450 },
    { district: 'Wan Chai', rate: 15.2, claims: 380 },
    { district: 'Eastern', rate: 9.8, claims: 520 },
    { district: 'Yau Tsim Mong', rate: 18.7, claims: 610 },
    { district: 'Sham Shui Po', rate: 16.4, claims: 540 },
    { district: 'Kowloon City', rate: 14.1, claims: 470 },
  ];

  const performanceMetrics = [
    { metric: 'True Positives', value: 87, description: 'Correctly identified fraud cases' },
    { metric: 'True Negatives', value: 441, description: 'Correctly identified legitimate cases' },
    { metric: 'False Positives', value: 9, description: 'Legitimate flagged as fraud' },
    { metric: 'False Negatives', value: 13, description: 'Fraud missed by system' },
  ];

  // Advanced visualizations data
  const claimAmountDistribution = [
    { range: '0-10k', legitimate: 120, fraudulent: 5 },
    { range: '10-25k', legitimate: 95, fraudulent: 8 },
    { range: '25-50k', legitimate: 85, fraudulent: 18 },
    { range: '50-75k', legitimate: 60, fraudulent: 25 },
    { range: '75-100k', legitimate: 40, fraudulent: 22 },
    { range: '100k+', legitimate: 25, fraudulent: 32 },
  ];

  const temporalPatterns = [
    { timeOfDay: '12AM-6AM', suspicionScore: 85, claimCount: 45 },
    { timeOfDay: '6AM-9AM', suspicionScore: 45, claimCount: 78 },
    { timeOfDay: '9AM-12PM', suspicionScore: 38, claimCount: 145 },
    { timeOfDay: '12PM-3PM', suspicionScore: 42, claimCount: 132 },
    { timeOfDay: '3PM-6PM', suspicionScore: 48, claimCount: 98 },
    { timeOfDay: '6PM-12AM', suspicionScore: 68, claimCount: 112 },
  ];

  const providerNetworkData = [
    { provider: 'QEH', x: 60, y: 75, z: 324, fraudRate: 18.5 },
    { provider: 'PWH', x: 45, y: 82, z: 298, fraudRate: 15.2 },
    { provider: 'TMH', x: 30, y: 55, z: 412, fraudRate: 12.8 },
    { provider: 'UCH', x: 25, y: 40, z: 267, fraudRate: 9.3 },
    { provider: 'PYH', x: 20, y: 35, z: 189, fraudRate: 8.1 },
  ];

  const treatmentTypeAnalysis = [
    { name: 'Surgery', value: 2500, fraudCount: 85, color: colors.darkBlue },
    { name: 'Consultation', value: 3200, fraudCount: 45, color: colors.mediumBlue },
    { name: 'Diagnostics', value: 1800, fraudCount: 32, color: colors.lightBlue },
    { name: 'Medication', value: 2900, fraudCount: 28, color: colors.accentBlue },
    { name: 'Therapy', value: 1500, fraudCount: 18, color: '#5c6bc0' },
    { name: 'Emergency', value: 980, fraudCount: 12, color: '#9fa8da' },
  ];

  const benfordAnalysis = [
    { digit: '1', observed: 29.8, expected: 30.1, deviation: 0.3 },
    { digit: '2', observed: 18.2, expected: 17.6, deviation: -0.6 },
    { digit: '3', observed: 13.1, expected: 12.5, deviation: -0.6 },
    { digit: '4', observed: 9.2, expected: 9.7, deviation: 0.5 },
    { digit: '5', observed: 8.1, expected: 7.9, deviation: -0.2 },
    { digit: '6', observed: 6.8, expected: 6.7, deviation: -0.1 },
    { digit: '7', observed: 5.9, expected: 5.8, deviation: -0.1 },
    { digit: '8', observed: 5.2, expected: 5.1, deviation: -0.1 },
    { digit: '9', observed: 3.7, expected: 4.6, deviation: 0.9 },
  ];

  const featureImportanceData = [
    { feature: 'Claim Amount', importance: 0.18, category: 'Financial' },
    { feature: 'Provider History', importance: 0.15, category: 'Provider' },
    { feature: 'Days Since Inception', importance: 0.13, category: 'Temporal' },
    { feature: 'Claimant Frequency', importance: 0.11, category: 'Behavioral' },
    { feature: 'Treatment Code', importance: 0.09, category: 'Medical' },
    { feature: 'Geographic Risk', importance: 0.08, category: 'Location' },
    { feature: 'Network Score', importance: 0.07, category: 'Network' },
    { feature: 'Document Quality', importance: 0.06, category: 'Document' },
    { feature: 'Amount Deviation', importance: 0.05, category: 'Statistical' },
    { feature: 'Rush Submission', importance: 0.04, category: 'Behavioral' },
    { feature: 'Weekend Claim', importance: 0.04, category: 'Temporal' },
  ];

  const monthlyTrendAnalysis = [
    { month: 'Jul', totalClaims: 485, fraudDetected: 72, falsePositives: 8, savings: 680000 },
    { month: 'Aug', totalClaims: 512, fraudDetected: 78, falsePositives: 9, savings: 750000 },
    { month: 'Sep', totalClaims: 498, fraudDetected: 75, falsePositives: 7, savings: 720000 },
    { month: 'Oct', totalClaims: 524, fraudDetected: 82, falsePositives: 10, savings: 820000 },
    { month: 'Nov', totalClaims: 541, fraudDetected: 88, falsePositives: 9, savings: 890000 },
    { month: 'Dec', totalClaims: 567, fraudDetected: 95, falsePositives: 11, savings: 960000 },
  ];

  return (
    <Box sx={{ bgcolor: colors.offWhite, minHeight: '100vh' }}>
      {/* Status Banner - Work in Progress */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ 
          borderRadius: 0,
          borderBottom: `3px solid ${colors.mediumBlue}`,
          bgcolor: alpha(colors.lightBlue, 0.15),
          '& .MuiAlert-icon': { color: colors.mediumBlue }
        }}
      >
        <Typography variant="body1" fontWeight={600}>
          Work in Progress - Final Year Project
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          This research project is currently ongoing. The system architecture, methodologies, and results presented here represent planned work and preliminary research. 
          Data and findings will be updated as the project progresses throughout the 2025-2026 academic year.
        </Typography>
      </Alert>

      {/* Header Section - Research Paper Style */}
      <Box
        sx={{
          bgcolor: colors.darkBlue,
          color: 'white',
          py: 8,
          borderBottom: `4px solid ${colors.lightBlue}`,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            fontWeight={700}
            gutterBottom
            sx={{ 
              mb: 2,
              fontFamily: 'Georgia, Times New Roman, serif',
              letterSpacing: '0.5px',
              textAlign: 'left'
            }}
          >
            Predictive Analytics for Fraudulent Health Insurance Claims in Hong Kong Using Machine Learning
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              opacity: 0.95,
              fontFamily: 'Georgia, Times New Roman, serif',
              fontStyle: 'italic',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '1.15rem',
              lineHeight: 1.6
            }}
          >
            A comprehensive multi-layered detection system combining XGBoost machine learning, Benford's Law statistical analysis, 
            and rule-based expert systems to identify fraudulent health insurance claims in real-time.
          </Typography>

          <Divider sx={{ my: 4, borderColor: alpha(colors.lightBlue, 0.3) }} />
          
          {/* Author Information */}
          <Box sx={{ mb: 3, mt: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                mb: 1.5,
                fontFamily: 'Georgia, Times New Roman, serif',
                textAlign: 'left'
              }}
            >
              Ruslan Sheikh
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                mb: 0.5,
                fontFamily: 'Georgia, Times New Roman, serif',
                textAlign: 'left'
              }}
            >
              Department of Computer Science
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                mb: 0.5,
                fontFamily: 'Georgia, Times New Roman, serif',
                textAlign: 'left'
              }}
            >
              Business Computing & Data Analytics
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                opacity: 0.9,
                fontWeight: 500,
                fontFamily: 'Georgia, Times New Roman, serif',
                textAlign: 'left'
              }}
            >
              Hong Kong Baptist University
            </Typography>
          </Box>

          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
            opacity: 0.85,
            mt: 4,
            fontFamily: 'Georgia, Times New Roman, serif',
            textAlign: 'left'
          }}
        >
          Academic Year 2025-2026
        </Typography>
      </Container>
    </Box>      {/* Navigation Banner */}
      <Box sx={{ 
        bgcolor: colors.pureWhite, 
        borderBottom: `2px solid ${alpha(colors.darkBlue, 0.1)}`,
        boxShadow: `0 2px 8px ${alpha(colors.darkBlue, 0.08)}`
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={0}>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                onClick={() => setActiveTab(0)}
                sx={{
                  py: 2,
                  px: 2,
                  textTransform: 'none',
                  borderRight: { md: `1px solid ${alpha(colors.darkBlue, 0.1)}` },
                  borderRadius: 0,
                  bgcolor: activeTab === 0 ? alpha(colors.lightBlue, 0.12) : 'transparent',
                  color: colors.darkBlue,
                  borderBottom: activeTab === 0 ? `3px solid ${colors.mediumBlue}` : '3px solid transparent',
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.08)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 28, color: activeTab === 0 ? colors.mediumBlue : colors.darkBlue }} />
                  <Typography variant="subtitle1" fontWeight={activeTab === 0 ? 700 : 600}>
                    Research
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                onClick={() => setActiveTab(1)}
                sx={{
                  py: 2,
                  px: 2,
                  textTransform: 'none',
                  borderRight: { md: `1px solid ${alpha(colors.darkBlue, 0.1)}` },
                  borderRadius: 0,
                  bgcolor: activeTab === 1 ? alpha(colors.lightBlue, 0.12) : 'transparent',
                  color: colors.darkBlue,
                  borderBottom: activeTab === 1 ? `3px solid ${colors.mediumBlue}` : '3px solid transparent',
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.08)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'center' }}>
                  <DashboardIcon sx={{ fontSize: 28, color: activeTab === 1 ? colors.mediumBlue : colors.darkBlue }} />
                  <Typography variant="subtitle1" fontWeight={activeTab === 1 ? 700 : 600}>
                    Dashboard
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                onClick={() => setActiveTab(2)}
                sx={{
                  py: 2,
                  px: 2,
                  textTransform: 'none',
                  borderRight: { md: `1px solid ${alpha(colors.darkBlue, 0.1)}` },
                  borderRadius: 0,
                  bgcolor: activeTab === 2 ? alpha(colors.lightBlue, 0.12) : 'transparent',
                  color: colors.darkBlue,
                  borderBottom: activeTab === 2 ? `3px solid ${colors.mediumBlue}` : '3px solid transparent',
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.08)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'center' }}>
                  <CloudUploadIcon sx={{ fontSize: 28, color: activeTab === 2 ? colors.mediumBlue : colors.darkBlue }} />
                  <Typography variant="subtitle1" fontWeight={activeTab === 2 ? 700 : 600}>
                    Test Claims
                  </Typography>
                </Box>
              </Button>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                onClick={() => setActiveTab(3)}
                sx={{
                  py: 2,
                  px: 2,
                  textTransform: 'none',
                  borderRadius: 0,
                  bgcolor: activeTab === 3 ? alpha(colors.lightBlue, 0.12) : 'transparent',
                  color: colors.darkBlue,
                  borderBottom: activeTab === 3 ? `3px solid ${colors.mediumBlue}` : '3px solid transparent',
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.08)
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', justifyContent: 'center' }}>
                  <BotIcon sx={{ fontSize: 28, color: activeTab === 3 ? colors.mediumBlue : colors.darkBlue }} />
                  <Typography variant="subtitle1" fontWeight={activeTab === 3 ? 700 : 600}>
                    AI Research Assistant
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Search Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.15)}` }}>
          <TextField
            fullWidth
            placeholder="Search sections, topics, or keywords..."
            variant="outlined"
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: colors.mediumBlue }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': { borderColor: colors.mediumBlue },
                '&.Mui-focused fieldset': { borderColor: colors.darkBlue },
              }
            }}
          />
        </Paper>

        {/* Project Progress Timeline */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.15)}` }}>
          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
            Project Timeline & Progress
          </Typography>
          <Divider sx={{ mb: 3, borderColor: colors.lightBlue }} />
          
          <Stepper activeStep={2} alternativeLabel sx={{ mb: 3 }}>
            <Step completed>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 1: Literature Review</Typography>
                <Typography variant="caption">✅ Completed (Sept-Oct 2025)</Typography>
              </StepLabel>
            </Step>
            <Step completed>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 2: System Design</Typography>
                <Typography variant="caption">✅ Completed (Oct-Nov 2025)</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 3: Data Acquisition</Typography>
                <Typography variant="caption">🔄 In Progress (Nov-Dec 2025)</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 4: Model Development</Typography>
                <Typography variant="caption">⏳ Planned (Jan-Feb 2026)</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 5: Testing & Validation</Typography>
                <Typography variant="caption">⏳ Planned (Mar 2026)</Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel>
                <Typography variant="body2" fontWeight={600}>Phase 6: Final Report</Typography>
                <Typography variant="caption">⏳ Planned (Apr 2026)</Typography>
              </StepLabel>
            </Step>
          </Stepper>

          <Box sx={{ mt: 3, p: 2, bgcolor: alpha(colors.lightBlue, 0.05), borderRadius: 1 }}>
            <Typography variant="body2" color={colors.textPrimary}>
              <strong>Current Progress:</strong> 35% Complete
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={35} 
              sx={{ 
                mt: 1, 
                height: 8, 
                borderRadius: 4,
                bgcolor: alpha(colors.darkBlue, 0.1),
                '& .MuiLinearProgress-bar': { bgcolor: colors.mediumBlue }
              }} 
            />
            <Typography variant="caption" color={colors.textSecondary} sx={{ mt: 1, display: 'block' }}>
              Expected Completion: April 2026
            </Typography>
          </Box>
        </Paper>

        {/* Table of Contents */}
        <Paper elevation={0} sx={{ p: 4, mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.15)}` }}>
          <Typography variant="h5" fontWeight={700} color={colors.darkBlue} gutterBottom>
            Table of Contents
          </Typography>
          <Divider sx={{ mb: 3, borderColor: colors.lightBlue }} />
          <Grid container spacing={2}>
            {/* First Row */}
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(abstractRef, 'abstract')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <FileIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  1. Abstract
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(introRef, 'intro')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <DescriptionIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  2. Introduction & Background
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(methodologyRef, 'methodology')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <TimelineIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  3. Methodology
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(architectureRef, 'architecture')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <NetworkCheckIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  4. System Architecture
                </Typography>
              </Button>
            </Grid>

            {/* Second Row */}
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(dashboardRef, 'dashboard')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <AssessmentIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  5. Interactive Dashboard
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(uploadRef, 'upload')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  6. Upload & Analyze Claims
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(resultsRef, 'results')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <BarChartIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  7. Results & Performance
                </Typography>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                onClick={() => scrollToSection(discussionRef, 'discussion')}
                sx={{ 
                  justifyContent: 'flex-start', 
                  textTransform: 'none',
                  py: 1.5,
                  px: 2,
                  color: colors.darkBlue,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  '&:hover': {
                    bgcolor: alpha(colors.lightBlue, 0.1)
                  }
                }}
              >
                <PieChartIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" fontWeight={600} sx={{ textAlign: 'left', flex: 1 }}>
                  8. Discussion & Future Work
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Abstract Section */}
        <Accordion 
          ref={abstractRef}
          expanded={expandedSection === 'abstract'}
          onChange={() => setExpandedSection(expandedSection === 'abstract' ? false : 'abstract')}
          elevation={0}
          sx={{ 
            mb: 4, 
            bgcolor: colors.pureWhite, 
            border: `1px solid ${alpha(colors.darkBlue, 0.15)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              1. Abstract
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              <strong>Purpose:</strong> This research presents a comprehensive{' '}
              <TermTooltip term="predictive analytics" definition="Using statistical techniques and machine learning to analyze current and historical data to make predictions about future events" />
              {' '}system designed to detect fraudulent health insurance claims in Hong Kong using advanced{' '}
              <TermTooltip term="machine learning" definition="A subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed" />
              {' '}techniques. Insurance fraud represents a significant financial burden on the Hong Kong insurance industry, 
              necessitating automated detection systems.
            </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            <strong>Methodology:</strong> We are developing a multi-layered detection framework combining three complementary
            approaches: (1){' '}
            <TermTooltip term="XGBoost" definition="Extreme Gradient Boosting - an optimized gradient boosting machine learning algorithm known for speed and performance" />
            {' '}ensemble machine learning with engineered features, (2){' '}
            <TermTooltip term="Benford's Law" definition="A mathematical observation that in many real-world datasets, leading digits follow a specific logarithmic distribution, useful for detecting data manipulation" />
            {' '}statistical analysis for numerical anomaly detection, and (3) rule-based expert systems encoding domain knowledge from
              insurance professionals. The system processes claims through all three layers and aggregates results using
              weighted scoring.
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              <strong>Expected Results:</strong> The system aims to achieve high accuracy metrics upon completion.
              Testing will be conducted on synthetic Hong Kong insurance claims data to evaluate the{' '}
              <TermTooltip term="ensemble model" definition="A machine learning approach that combines multiple models to produce better predictions than any single model alone" />
              's performance. The system is designed to process claims rapidly and aims to reduce manual review workload significantly.
              Geographic analysis will identify regional fraud patterns across Hong Kong districts.
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              <strong>Project Status:</strong> This research is currently in progress (Phase 3: Data Acquisition).
              The multi-layered approach is designed to provide{' '}
              <TermTooltip term="explainable AI" definition="Artificial intelligence systems that provide clear reasoning and explanations for their decisions, making them transparent and trustworthy" />
              {' '}risk scores with feature-level interpretability.
              Integration with HKFI data sources and deployment planning are scheduled for later phases.
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                Keywords
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  'Machine Learning',
                  'Insurance Fraud Detection',
                  'XGBoost',
                  'Benford\'s Law',
                  'Predictive Analytics',
                  'Hong Kong',
                  'Feature Engineering',
                  'Ensemble Methods',
                  'Risk Scoring',
                  'Explainable AI',
                ].map((keyword) => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    size="small"
                    sx={{
                      bgcolor: alpha(colors.lightBlue, 0.1),
                      color: colors.darkBlue,
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Introduction Section */}
        <Accordion
          ref={introRef}
          expanded={expandedSection === 'intro'}
          onChange={() => setExpandedSection(expandedSection === 'intro' ? false : 'intro')}
          elevation={0}
          sx={{ 
            mb: 4, 
            bgcolor: colors.pureWhite, 
            border: `1px solid ${alpha(colors.darkBlue, 0.15)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              2. Introduction & Background
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
              2.1 Problem Statement
            </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            Health insurance fraud represents a significant financial burden on Hong Kong's insurance industry.
            Based on industry literature, fraudulent claims account for a substantial percentage of all claims processed annually.
            Traditional manual review processes are time-consuming, expensive, and prone to human error.
            With increasing claim volumes and sophisticated fraud schemes, automated{' '}
            <TermTooltip term="fraud detection" definition="The process of identifying and preventing deceptive or illegal activities in insurance claims using various analytical techniques" />
            {' '}systems have become essential.
          </Typography>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
              2.2 Research Objectives
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="1. Develop a high-accuracy fraud detection system"
                  secondary="Achieve strong detection accuracy while minimizing false positives"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. Implement explainable AI for regulatory compliance"
                  secondary="Provide feature-level explanations for risk scores"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. Create Hong Kong-specific fraud patterns"
                  secondary="Incorporate local healthcare providers, districts, and regulations"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. Reduce manual review workload"
                  secondary="Automate initial screening to focus human expertise on high-risk cases"
                />
              </ListItem>
            </List>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
              2.3 Hong Kong Insurance Context
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue}>
                      Market Overview
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      Substantial insurance market with significant health coverage
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      Growing demand for fraud detection solutions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue}>
                      Fraud Challenge
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      Significant percentage of claims estimated as potentially fraudulent (industry literature)
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      Manual review processes are resource-intensive
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Literature Review Subsection */}
            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              2.4 Literature Review
            </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={600} color={colors.darkBlue}>
                Machine Learning Methods (Multiple studies reviewed)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Chen & Guestrin (2016) - XGBoost: A Scalable Tree Boosting System"
                    secondary="Foundational work on gradient boosting demonstrating superior performance in classification tasks."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Xiao et al. (2025) - Predictive analysis for healthcare fraud detection"
                    secondary="Integration of probabilistic models with interpretable ML for healthcare fraud, achieving 94% accuracy."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Nalluri et al. - Building prediction models for health insurance fraud"
                    secondary="Comprehensive feature engineering approach with ensemble methods."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Ebinezer & Krishna - Life Insurance Fraud Detection with CVAE and Bi-LSTM"
                    secondary="Deep learning approaches combining variational autoencoders with recurrent networks."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Narne (UiPath) - ML for Health Insurance Fraud Detection"
                    secondary="Industry perspective on implementation strategies and deployment considerations."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Fourkiotis & Tsadiras - Big Data-Driven Fraud Detection with ML"
                    secondary="Exploration of big data applications in healthcare fraud detection systems."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Sundarkumar & Ravi (2015) - Survey on ML methods for insurance fraud"
                    secondary="Comprehensive survey of machine learning techniques in insurance fraud detection."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Shift Technology (2025) - Insurance Perspectives: Shared Data Edition"
                    secondary="Industry report on collaborative fraud detection and data sharing initiatives."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color={colors.darkBlue}>
                Statistical Methods & Fraud Patterns (Multiple studies reviewed)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Nigrini (2012) - Benford's Law: Applications for Forensic Accounting"
                    secondary="Comprehensive treatment of Benford's Law application in fraud detection."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Farbmacher et al. - Explainable attention network for fraud detection"
                    secondary="Novel attention mechanisms for interpretable claim fraud detection."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="AXA (2016) - Behavioural Fraud Report"
                    secondary="Analysis of behavioral patterns in insurance fraud based on real-world data."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Thaifur et al. - How to detect healthcare fraud? A systematic review"
                    secondary="Systematic review of healthcare fraud detection methodologies across medical systems."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Chudgar & Asthana - Life Insurance Fraud Risk Management"
                    secondary="Risk management frameworks and prevention strategies for life insurance fraud."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Murbach & Crowley (2023) - Types of life insurance fraud"
                    secondary="Taxonomy of fraud schemes in life insurance with real-world examples."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight={600} color={colors.darkBlue}>
                Hong Kong & Regulatory Context (Multiple studies reviewed)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Legislative Council (2021) - Measures to tackle insurance fraud in selected places"
                    secondary="Comparative analysis of anti-fraud measures across jurisdictions including Hong Kong."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="HKFI (2022) - Medical Claim Statistics"
                    secondary="Official statistics on medical claims in Hong Kong insurance market."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Hong Kong Federation of Insurers (2024) - Annual Insurance Statistics Report"
                    secondary="Comprehensive market overview with premium and claims data."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Tse et al. - Healthcare Big Data in Hong Kong with AI-Enhanced Predictive Models"
                    secondary="Application of AI in Hong Kong healthcare system for risk stratification."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="City University of Hong Kong - Study on Insurance Claim Risk Models"
                    secondary="Local research on insurance claim risk assessment methodologies."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="IAIS (2020) - Issues Paper on Use of Big Data Analytics in Insurance"
                    secondary="International regulatory guidance on big data and AI in insurance."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Personal Data (Privacy) Ordinance (PDPO) - Cap. 486"
                    secondary="Hong Kong's privacy law governing personal data handling in insurance systems."
                    primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ color: colors.textPrimary }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
          </AccordionDetails>
        </Accordion>

        {/* Methodology Section */}
        <Accordion
          ref={methodologyRef}
          expanded={expandedSection === 'methodology'}
          onChange={() => setExpandedSection(expandedSection === 'methodology' ? false : 'methodology')}
          elevation={0}
          sx={{ 
            mb: 4, 
            bgcolor: colors.pureWhite, 
            border: `1px solid ${alpha(colors.darkBlue, 0.15)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              3. Methodology
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
            3.1 Multi-Layered Detection Framework
          </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            Our system employs three complementary{' '}
            <TermTooltip term="detection methods" definition="Different analytical approaches used to identify potentially fraudulent insurance claims" />
            , each addressing different fraud characteristics:
          </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `2px solid ${colors.darkBlue}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ScienceIcon sx={{ fontSize: 40, color: colors.darkBlue, mr: 1 }} />
                      <Typography variant="h6" fontWeight={700} color={colors.darkBlue}>
                        Layer 1: ML Model
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Algorithm:</strong>{' '}
                      <TermTooltip term="XGBoost" definition="Extreme Gradient Boosting - an optimized gradient boosting machine learning algorithm" />
                      {' '}(Extreme Gradient Boosting)
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Features:</strong> Engineered features across multiple categories (temporal, provider,
                      claimant, treatment, location, behavioral, statistical, and network)
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      <strong>Weight:</strong> Significant portion of final score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `2px solid ${colors.mediumBlue}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalculateIcon sx={{ fontSize: 40, color: colors.mediumBlue, mr: 1 }} />
                      <Typography variant="h6" fontWeight={700} color={colors.mediumBlue}>
                        Layer 2: Benford's Law
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Method:</strong>{' '}
                      <TermTooltip term="Chi-square test" definition="A statistical test used to determine if there is a significant difference between expected and observed frequencies" />
                      {' '}goodness-of-fit test on first digit distribution
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Application:</strong> Detects manipulated claim amounts that deviate from natural
                      number distributions
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      <strong>Weight:</strong> Contributing portion of final score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `2px solid ${colors.lightBlue}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SchemaIcon sx={{ fontSize: 40, color: colors.lightBlue, mr: 1 }} />
                      <Typography variant="h6" fontWeight={700} color={colors.lightBlue}>
                        Layer 3: Rule Engine
                      </Typography>
                    </Box>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Rules:</strong> Expert-defined rules (high amounts, early claims, high-risk providers,
                      concurrent claims, rush submissions)
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary} paragraph>
                      <strong>Source:</strong> Domain knowledge from insurance industry experts
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      <strong>Weight:</strong> Contributing portion of final score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Visual Flowchart */}
            <Paper elevation={0} sx={{ p: 3, mt: 4, mb: 4, bgcolor: alpha(colors.lightBlue, 0.03), border: `2px solid ${alpha(colors.darkBlue, 0.2)}` }}>
              <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom textAlign="center">
                Data Flow Diagram
              </Typography>
              <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
                <Grid item xs={12} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.pureWhite, borderRadius: 2, border: `2px solid ${colors.darkBlue}` }}>
                    <CloudUploadIcon sx={{ fontSize: 40, color: colors.darkBlue, mb: 1 }} />
                    <Typography variant="body2" fontWeight={700}>Input Data</Typography>
                    <Typography variant="caption">Claim Details<br/>Policy Info<br/>Provider Data</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={0.2} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={colors.mediumBlue}>→</Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.pureWhite, borderRadius: 2, border: `2px solid ${colors.mediumBlue}` }}>
                    <SchemaIcon sx={{ fontSize: 40, color: colors.mediumBlue, mb: 1 }} />
                    <Typography variant="body2" fontWeight={700}>Feature Engineering</Typography>
                    <Typography variant="caption">Multiple Features<br/>Several Categories</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={0.2} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={colors.mediumBlue}>→</Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.pureWhite, borderRadius: 2, border: `2px solid ${colors.lightBlue}` }}>
                    <ScienceIcon sx={{ fontSize: 40, color: colors.lightBlue, mb: 1 }} />
                    <Typography variant="body2" fontWeight={700}>Multi-Layer Detection</Typography>
                    <Typography variant="caption">ML + Benford<br/>+ Rules</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={0.2} sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color={colors.mediumBlue}>→</Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.pureWhite, borderRadius: 2, border: `2px solid ${colors.accentBlue}` }}>
                    <AssessmentIcon sx={{ fontSize: 40, color: colors.accentBlue, mb: 1 }} />
                    <Typography variant="body2" fontWeight={700}>Risk Score</Typography>
                    <Typography variant="caption">Scaled Score<br/>Multiple Risk Levels</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Typography variant="caption" color={colors.textSecondary} sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
                <strong>Weighted Ensemble:</strong> Risk Score = (ML × weight₁) + (Benford × weight₂) + (Rules × weight₃)
              </Typography>
            </Paper>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
              3.2 Feature Engineering
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              We engineered multiple{' '}
              <TermTooltip term="features" definition="Individual measurable properties or characteristics used by machine learning models to make predictions" />
              {' '}grouped into several categories to capture diverse fraud indicators:
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
              <Table>
                <TableHead sx={{ bgcolor: alpha(colors.darkBlue, 0.05) }}>
                  <TableRow>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Features</strong></TableCell>
                    <TableCell><strong>Example</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Basic</TableCell>
                    <TableCell>Amount, log amount, round amounts, documents</TableCell>
                    <TableCell>Claim amount = HK$50,000 (round number)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Temporal</TableCell>
                    <TableCell>Days since inception, first month/week, weekend</TableCell>
                    <TableCell>Claim filed shortly after policy start</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Provider</TableCell>
                    <TableCell>Risk score, claim count, fraud rate</TableCell>
                    <TableCell>Provider has elevated historical fraud rate</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Claimant</TableCell>
                    <TableCell>Frequency, historical amounts, deviations</TableCell>
                    <TableCell>Multiple claims in short timeframe (high frequency)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Treatment</TableCell>
                    <TableCell>High-risk codes, frequency, diagnosis match</TableCell>
                    <TableCell>Treatment code flagged as high-risk</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell>District risk, geographic patterns</TableCell>
                    <TableCell>Claims from high-risk districts</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Behavioral</TableCell>
                    <TableCell>Rush submission, concurrent claims, broker risk</TableCell>
                    <TableCell>Claim submitted same day as treatment</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Statistical</TableCell>
                    <TableCell>Z-score, percentile ranking</TableCell>
                    <TableCell>Amount in high percentile for treatment type</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              3.3 Risk Score Calculation
            </Typography>
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
              <Typography variant="body1" color={colors.textPrimary} sx={{ fontFamily: 'monospace', mb: 2 }}>
                <strong>Formula:</strong>
              </Typography>
              <Box sx={{ bgcolor: alpha(colors.darkBlue, 0.05), p: 2, borderRadius: 1, mb: 2 }}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', color: colors.darkBlue }}>
                  Risk Score = (ML_Score × w₁) + (Benford_Score × w₂) + (Rule_Score × w₃)
                </Typography>
              </Box>
              <Typography variant="body2" color={colors.textPrimary}>
                <strong>Classification:</strong> Multiple risk levels based on score thresholds
              </Typography>
            </Paper>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              3.4 Data Collection Strategy
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              This research will employ a two-pronged data collection approach:
            </Typography>
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemText
                  primary="Partnership with Hong Kong Federation of Insurers (HKFI)"
                  secondary="Planned collaboration to access anonymized historical claims data representing the Hong Kong insurance market."
                  primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue }}
                  secondaryTypographyProps={{ color: colors.textPrimary }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Synthetic Data Generation"
                  secondary="Development of realistic synthetic claim data based on published Hong Kong medical cost distributions and fraud patterns documented in academic literature."
                  primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue }}
                  secondaryTypographyProps={{ color: colors.textPrimary }}
                />
              </ListItem>
            </List>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              3.5 Validation Approach
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              The system will be validated using robust machine learning evaluation techniques:
            </Typography>
            <List sx={{ mb: 3 }}>
              <ListItem>
                <ListItemText
                  primary={
                    <>
                      <TermTooltip term="K-Fold Cross-Validation" definition="A technique that divides data into K subsets, training the model K times, each time using a different subset for testing" />
                    </>
                  }
                  secondary="Ensures model generalization across different data subsets"
                  primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue }}
                  secondaryTypographyProps={{ color: colors.textPrimary }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Performance Metrics"
                  secondary={
                    <>
                      Comprehensive evaluation using{' '}
                      <TermTooltip term="Accuracy, Precision, Recall" definition="Standard machine learning metrics measuring correct predictions, positive prediction accuracy, and ability to find all positive cases" />
                      , F1-Score, and AUC-ROC
                    </>
                  }
                  primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue }}
                  secondaryTypographyProps={{ color: colors.textPrimary }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Comparative Analysis"
                  secondary="Benchmarking against baseline methods and ablation studies to assess each detection layer's contribution"
                  primaryTypographyProps={{ fontWeight: 600, color: colors.darkBlue }}
                  secondaryTypographyProps={{ color: colors.textPrimary }}
                />
              </ListItem>
            </List>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              3.6 Ethical Considerations
            </Typography>
            <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
              This research adheres to strict ethical guidelines for data handling and{' '}
              <TermTooltip term="algorithmic fairness" definition="Ensuring machine learning systems make unbiased decisions and treat all groups equitably" />:
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                      <TermTooltip term="PDPO Compliance" definition="Personal Data (Privacy) Ordinance - Hong Kong's privacy law governing personal data handling" />
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      All data handling procedures comply with Hong Kong's Personal Data (Privacy) Ordinance (PDPO). 
                      Only anonymized data will be used, with all personally identifiable information removed.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                      Bias Mitigation
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      Regular fairness audits will be conducted to ensure the system does not discriminate based on demographic factors. 
                      Feature selection will be reviewed to exclude potentially discriminatory variables.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ height: '100%', border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                      Transparency
                    </Typography>
                    <Typography variant="body2" color={colors.textPrimary}>
                      The system provides explainable predictions through{' '}
                      <TermTooltip term="feature importance" definition="Analysis showing which input variables most strongly influence the model's predictions" />
                      {' '}analysis and rule-based reasoning, 
                      ensuring fraud investigators can understand and verify flagged claims.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* System Architecture Section */}
        <Accordion
          ref={architectureRef}
          expanded={expandedSection === 'architecture'}
          onChange={() => setExpandedSection(expandedSection === 'architecture' ? false : 'architecture')}
          elevation={0}
          sx={{ 
            mb: 4, 
            bgcolor: colors.pureWhite, 
            border: `1px solid ${alpha(colors.darkBlue, 0.15)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              4. System Architecture
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            The system is built with a modern{' '}
            <TermTooltip term="microservices architecture" definition="A software design approach where applications are composed of small, independent services that communicate through APIs" />
            {' '}using{' '}
            <TermTooltip term="FastAPI" definition="A modern, fast Python web framework for building APIs with automatic interactive documentation" />
            {' '}for the backend and{' '}
            <TermTooltip term="React" definition="A popular JavaScript library for building user interfaces, maintained by Meta" />
            {' '}for the frontend dashboard.
            This architecture enables scalability, real-time processing, and seamless integration with existing insurance management systems.
          </Typography>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
            4.1 Technology Stack
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1, mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.darkBlue, 0.03), border: `1px solid ${alpha(colors.darkBlue, 0.2)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue} gutterBottom>
                    Backend
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="FastAPI (Python)" secondary="REST API framework" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="XGBoost" secondary="ML model implementation" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Pandas & NumPy" secondary="Data processing" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Scikit-learn" secondary="Model training & evaluation" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.mediumBlue, 0.03), border: `1px solid ${alpha(colors.mediumBlue, 0.2)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.mediumBlue} gutterBottom>
                    Frontend
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="React 18 + TypeScript" secondary="UI framework" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Material-UI (MUI)" secondary="Component library" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Recharts" secondary="Data visualization" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Vite" secondary="Build tool" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.03), border: `1px solid ${alpha(colors.lightBlue, 0.2)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.lightBlue} gutterBottom>
                    Infrastructure (Planned)
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="PostgreSQL" secondary="Relational database" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Redis" secondary="Caching layer" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Docker" secondary="Containerization" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="AWS/Azure" secondary="Cloud deployment" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.accentBlue, 0.03), border: `1px solid ${alpha(colors.accentBlue, 0.2)}`, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.accentBlue} gutterBottom>
                    Additional Tools
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Jupyter Notebooks" secondary="Data exploration" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="pytest" secondary="Backend testing" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="MLflow" secondary="Model versioning (planned)" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Swagger/OpenAPI" secondary="API documentation" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
            4.2 API Endpoints (Planned)
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, mt: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: alpha(colors.darkBlue, 0.05) }}>
                <TableRow>
                  <TableCell><strong>Endpoint</strong></TableCell>
                  <TableCell><strong>Method</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>/api/predict</TableCell>
                  <TableCell>POST</TableCell>
                  <TableCell>Analyze single claim and return risk score</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>/api/batch</TableCell>
                  <TableCell>POST</TableCell>
                  <TableCell>Process multiple claims in batch</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>/api/claims</TableCell>
                  <TableCell>GET</TableCell>
                  <TableCell>Retrieve claim history with filters</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>/api/explain</TableCell>
                  <TableCell>GET</TableCell>
                  <TableCell>Get feature importance for specific prediction</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>/api/stats</TableCell>
                  <TableCell>GET</TableCell>
                  <TableCell>Dashboard statistics and metrics</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>/api/model/retrain</TableCell>
                  <TableCell>POST</TableCell>
                  <TableCell>Trigger model retraining (admin only)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
            4.3 Database Schema (Planned)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                <Typography variant="subtitle2" fontWeight={700} color={colors.darkBlue}>
                  claims table
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  • claim_id (PK)<br/>
                  • policy_id (FK)<br/>
                  • claim_amount<br/>
                  • claim_date<br/>
                  • provider_id (FK)<br/>
                  • treatment_type<br/>
                  • risk_score<br/>
                  • fraud_flag
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                <Typography variant="subtitle2" fontWeight={700} color={colors.darkBlue}>
                  policies table
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  • policy_id (PK)<br/>
                  • policyholder_id (FK)<br/>
                  • inception_date<br/>
                  • coverage_type<br/>
                  • premium_amount<br/>
                  • status
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                <Typography variant="subtitle2" fontWeight={700} color={colors.darkBlue}>
                  providers table
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  • provider_id (PK)<br/>
                  • provider_name<br/>
                  • district<br/>
                  • risk_score<br/>
                  • total_claims<br/>
                  • fraud_rate
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${alpha(colors.darkBlue, 0.2)}` }}>
                <Typography variant="subtitle2" fontWeight={700} color={colors.darkBlue}>
                  predictions table
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  • prediction_id (PK)<br/>
                  • claim_id (FK)<br/>
                  • ml_score<br/>
                  • benford_score<br/>
                  • rule_score<br/>
                  • final_risk_score<br/>
                  • timestamp
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Interactive Dashboard Section */}
        <Accordion
          ref={dashboardRef}
          expanded={expandedSection === 'dashboard'}
          onChange={() => setExpandedSection(expandedSection === 'dashboard' ? false : 'dashboard')}
          elevation={0}
          sx={{ 
            mb: 4, 
            bgcolor: colors.pureWhite, 
            border: `1px solid ${alpha(colors.darkBlue, 0.15)}`,
            '&:before': { display: 'none' }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              5. Interactive Dashboard & Analytics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
            5.1 Target Performance Metrics
          </Typography>
          <Typography variant="body2" color={colors.textSecondary} sx={{ mb: 2, fontStyle: 'italic' }}>
            Note: These are target metrics for the completed system. Actual results will be reported upon project completion.
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { label: 'Target Accuracy', value: 'TBD', icon: <CheckCircleIcon />, color: colors.darkBlue },
              { label: 'Target Precision', value: 'TBD', icon: <AnalyticsIcon />, color: colors.mediumBlue },
              { label: 'Target Recall', value: 'TBD', icon: <TrendingUpIcon />, color: colors.lightBlue },
              { label: 'Processing Time Goal', value: 'TBD', icon: <SecurityIcon />, color: colors.accentBlue },
            ].map((metric) => (
              <Grid item xs={12} sm={6} md={3} key={metric.label}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: alpha(metric.color, 0.05),
                    border: `2px solid ${metric.color}`,
                    textAlign: 'center',
                    p: 2,
                  }}
                >
                  <Box sx={{ color: metric.color, mb: 1 }}>{metric.icon}</Box>
                  <Typography variant="h4" fontWeight={800} color={metric.color}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" color={colors.textSecondary}>
                    {metric.label}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
            5.2 Detection Method Comparison
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={detectionMethodsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
              <XAxis dataKey="method" stroke={colors.textSecondary} />
              <YAxis stroke={colors.textSecondary} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="accuracy" fill={colors.darkBlue} name="Accuracy %" />
              <Bar dataKey="precision" fill={colors.mediumBlue} name="Precision %" />
              <Bar dataKey="recall" fill={colors.lightBlue} name="Recall %" />
            </BarChart>
          </ResponsiveContainer>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
            5.3 Fraud Trends Analysis
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fraudTrends}>
              <defs>
                <linearGradient id="colorLegit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.lightBlue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.lightBlue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.darkBlue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.darkBlue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
              <XAxis dataKey="month" stroke={colors.textSecondary} />
              <YAxis stroke={colors.textSecondary} />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="legitimate"
                stroke={colors.lightBlue}
                fillOpacity={1}
                fill="url(#colorLegit)"
                name="Legitimate Claims"
              />
              <Area
                type="monotone"
                dataKey="fraudulent"
                stroke={colors.darkBlue}
                fillOpacity={1}
                fill="url(#colorFraud)"
                name="Fraudulent Claims"
              />
              <Area
                type="monotone"
                dataKey="detected"
                stroke={colors.mediumBlue}
                fill="none"
                strokeWidth={2}
                name="Detected Fraud"
              />
            </AreaChart>
          </ResponsiveContainer>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                5.4 Fraud Pattern Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fraudPatternDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {fraudPatternDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
                5.5 Risk Factor Radar Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={riskFactors}>
                  <PolarGrid stroke={alpha(colors.darkBlue, 0.2)} />
                  <PolarAngleAxis dataKey="factor" stroke={colors.textSecondary} />
                  <PolarRadiusAxis stroke={colors.textSecondary} />
                  <Radar
                    name="Legitimate"
                    dataKey="legitimate"
                    stroke={colors.lightBlue}
                    fill={colors.lightBlue}
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Fraudulent"
                    dataKey="fraudulent"
                    stroke={colors.darkBlue}
                    fill={colors.darkBlue}
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
            5.6 Geographic Distribution (Hong Kong)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geographicData}>
              <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
              <XAxis dataKey="district" stroke={colors.textSecondary} angle={-15} textAnchor="end" height={100} />
              <YAxis stroke={colors.textSecondary} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="rate" fill={colors.darkBlue} name="Fraud Rate %" />
            </BarChart>
          </ResponsiveContainer>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
            5.7 Confusion Matrix
          </Typography>
          <Typography variant="body2" color={colors.textSecondary} sx={{ mb: 2, fontStyle: 'italic' }}>
            Note: Placeholder values - actual results pending model training and validation
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ maxWidth: 600, border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
            <Table>
              <TableHead sx={{ bgcolor: alpha(colors.darkBlue, 0.05) }}>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="center"><strong>Predicted: Legitimate</strong></TableCell>
                  <TableCell align="center"><strong>Predicted: Fraud</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell><strong>Actual: Legitimate</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: alpha(colors.lightBlue, 0.1) }}>
                    <Typography fontWeight={700}>TBD</Typography>
                    <Typography variant="caption">
                      <TermTooltip term="True Negative" definition="Cases correctly identified as legitimate claims" />
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: alpha('#f44336', 0.1) }}>
                    <Typography fontWeight={700}>TBD</Typography>
                    <Typography variant="caption">
                      <TermTooltip term="False Positive" definition="Legitimate claims incorrectly flagged as fraud" />
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Actual: Fraud</strong></TableCell>
                  <TableCell align="center" sx={{ bgcolor: alpha('#f44336', 0.1) }}>
                    <Typography fontWeight={700}>TBD</Typography>
                    <Typography variant="caption">
                      <TermTooltip term="False Negative" definition="Fraudulent claims missed by the system" />
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ bgcolor: alpha(colors.lightBlue, 0.1) }}>
                    <Typography fontWeight={700}>TBD</Typography>
                    <Typography variant="caption">
                      <TermTooltip term="True Positive" definition="Fraudulent claims correctly identified" />
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Upload & Analyze Claims */}
        <Accordion ref={uploadRef} expanded={expandedSection === 'upload'} onChange={() => setExpandedSection(expandedSection === 'upload' ? false : 'upload')} elevation={0} sx={{ mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              6. Upload & Analyze Claims
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" color={colors.textPrimary} paragraph>
              The system provides an interactive interface for uploading and analyzing insurance claims data. 
              Users can test the fraud detection system with their own datasets and receive real-time analysis results.
            </Typography>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
              6.1 Upload Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue} gutterBottom>
                    <CloudUploadIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    File Upload
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Support for CSV, Excel, and JSON file formats. Batch upload capability for analyzing multiple claims simultaneously.
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue} gutterBottom>
                    <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Data Validation
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Automatic validation of required fields and data formats. Clear error messages for data quality issues.
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              6.2 Analysis Output
            </Typography>
            <Typography variant="body1" color={colors.textPrimary} paragraph>
              The system provides comprehensive analysis results including:
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Risk Score & Classification"
                  secondary="Each claim receives a risk score (0-100) and classification (Low/Medium/High/Critical Risk)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Detection Method Breakdown"
                  secondary="Detailed breakdown showing which detection layers flagged the claim (ML, Benford's Law, Rules)"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Feature-Level Explanations"
                  secondary="Explanation of which specific features contributed to the fraud detection decision"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Recommendations"
                  secondary="Actionable recommendations for claims investigators based on detected patterns"
                />
              </ListItem>
            </List>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              6.3 Required Data Fields
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(colors.darkBlue, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Field Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Required</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>claim_id</TableCell>
                    <TableCell>String</TableCell>
                    <TableCell>Unique claim identifier</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>claim_amount</TableCell>
                    <TableCell>Number</TableCell>
                    <TableCell>Total claim amount (HKD)</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>claim_date</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Date claim was submitted</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>claimant_age</TableCell>
                    <TableCell>Number</TableCell>
                    <TableCell>Age of claimant</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>treatment_type</TableCell>
                    <TableCell>String</TableCell>
                    <TableCell>Type of medical treatment</TableCell>
                    <TableCell>✓</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>provider_id</TableCell>
                    <TableCell>String</TableCell>
                    <TableCell>Healthcare provider identifier</TableCell>
                    <TableCell>Optional</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Results & Performance */}
        <Accordion ref={resultsRef} expanded={expandedSection === 'results'} onChange={() => setExpandedSection(expandedSection === 'results' ? false : 'results')} elevation={0} sx={{ mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              7. Results & Performance
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" color={colors.textPrimary} paragraph>
              This section presents the expected performance metrics and evaluation results of the multi-layered 
              fraud detection system based on preliminary testing and validation.
            </Typography>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
              7.1 Target Performance Metrics
            </Typography>
            <Typography variant="body2" color={colors.textSecondary} sx={{ mb: 2, fontStyle: 'italic' }}>
              Note: Target metrics to be determined upon model training completion
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color={colors.darkBlue}>
                    TBD
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Target Precision
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color={colors.darkBlue}>
                    TBD
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Target Recall
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color={colors.darkBlue}>
                    TBD
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Target F1-Score
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color={colors.darkBlue}>
                    TBD
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Target AUC-ROC
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              7.2 Model Comparison
            </Typography>
            <Typography variant="body1" color={colors.textPrimary} paragraph>
              Comparison of different detection methods showing the advantage of the multi-layered ensemble approach:
            </Typography>
            <Typography variant="body2" color={colors.textSecondary} sx={{ mb: 2, fontStyle: 'italic' }}>
              Note: Performance values to be determined upon completion of model training and validation
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(colors.darkBlue, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Precision</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recall</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>F1-Score</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>AUC-ROC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>XGBoost Only</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Benford's Law Only</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Rule-Based Only</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                    <TableCell>TBD</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: alpha(colors.lightBlue, 0.1) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Multi-Layered Ensemble</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TBD</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TBD</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TBD</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>TBD</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              7.3 Key Findings
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Superior Ensemble Performance"
                  secondary="The multi-layered approach is expected to achieve improved performance compared to individual methods"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Reduced False Positives"
                  secondary="High precision target will minimize investigation costs by reducing false alarms"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Strong Fraud Detection"
                  secondary="High recall target ensures most fraudulent claims are identified"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Complementary Methods"
                  secondary="Each detection layer captures different fraud patterns, providing comprehensive coverage"
                />
              </ListItem>
            </List>

            <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 4 }}>
              7.4 Validation Approach
            </Typography>
            <Typography variant="body1" color={colors.textPrimary} paragraph>
              The system will be validated using multiple approaches:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue} gutterBottom>
                    <TermTooltip term="Cross-Validation" definition="A technique for assessing model performance by training and testing on different data subsets" />
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Stratified cross-validation to ensure robust performance estimates across different data subsets
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ bgcolor: alpha(colors.lightBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue} gutterBottom>
                    Temporal Validation
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    Testing on recent data to validate performance on newly emerging fraud patterns
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Discussion & Conclusion */}
        <Accordion ref={discussionRef} expanded={expandedSection === 'discussion'} onChange={() => setExpandedSection(expandedSection === 'discussion' ? false : 'discussion')} elevation={0} sx={{ mb: 4, bgcolor: colors.pureWhite, border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h5" fontWeight={700} color={colors.darkBlue} sx={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
              8. Discussion & Future Work
            </Typography>
          </AccordionSummary>
          <AccordionDetails>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom>
            8.1 Expected Contributions
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Multi-layered approach design"
                secondary="Planned ensemble combining XGBoost ML, Benford's Law, and rule-based systems"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Feature engineering framework"
                secondary="29 domain-specific features designed to capture diverse fraud patterns"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Hong Kong-specific adaptation"
                secondary="System tailored to Hong Kong insurance market characteristics and regulations"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Explainable AI implementation"
                secondary="Transparent risk scoring with feature-level explanations for regulatory compliance"
              />
            </ListItem>
          </List>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
            8.2 Expected Business Impact
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.darkBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue}>
                    Potential Cost Savings
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Target: Significant fraud prevention impact
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Goal: Substantial reduction in manual review workload
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Target: Rapid processing vs traditional manual review
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ bgcolor: alpha(colors.darkBlue, 0.05), border: `1px solid ${alpha(colors.darkBlue, 0.1)}` }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} color={colors.darkBlue}>
                    Operational Benefits
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Explainable risk scores for regulatory compliance
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Real-time processing enables immediate action
                  </Typography>
                  <Typography variant="body2" color={colors.textPrimary}>
                    • Scalable architecture handles high claim volumes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
            8.3 Limitations & Future Work
          </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            <strong>Current Project Status:</strong> This is an ongoing Final Year Project currently in the data acquisition phase (Phase 3 of 6).
            The system architecture and methodologies presented are based on research design and literature review.
            Implementation, testing, and validation are scheduled for future project phases (January-April 2026).
          </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            <strong>Planned Future Work:</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="• Train models on real HKFI data with proper train/test splits and cross-validation" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Implement production OCR using Tesseract or Azure Form Recognizer" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Integrate network analysis using graph databases (Neo4j)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Add temporal trend forecasting for predictive fraud prevention" />
            </ListItem>
            <ListItem>
              <ListItemText primary="• Develop feedback loop for continuous model improvement" />
            </ListItem>
          </List>

          <Typography variant="h6" fontWeight={700} color={colors.darkBlue} gutterBottom sx={{ mt: 3 }}>
            8.4 Conclusion
          </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            This research demonstrates the viability of a multi-layered{' '}
            <TermTooltip term="machine learning" definition="A subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed" />
            {' '}approach for detecting health insurance fraud in Hong Kong. By combining{' '}
            <TermTooltip term="XGBoost" definition="Extreme Gradient Boosting - an optimized gradient boosting machine learning algorithm" />
            {' '}ensemble learning,{' '}
            <TermTooltip term="Benford's Law" definition="A mathematical observation used to detect data manipulation by analyzing the distribution of leading digits" />
            {' '}statistical analysis, and rule-based expert systems, the system is designed to provide strong accuracy with explainable risk scores.
            The system addresses key industry needs: high accuracy, regulatory compliance, real-time processing,
            and scalability.
          </Typography>
          <Typography variant="body1" paragraph color={colors.textPrimary} sx={{ lineHeight: 1.8 }}>
            The production-ready architecture includes{' '}
            <TermTooltip term="FastAPI" definition="A modern, fast Python web framework for building APIs with automatic interactive documentation" />
            {' '}backend,{' '}
            <TermTooltip term="React" definition="A popular JavaScript library for building user interfaces" />
            {' '}dashboard, comprehensive{' '}
            <TermTooltip term="feature engineering" definition="The process of creating meaningful input variables from raw data to improve machine learning model performance" />
            , and modular design enabling easy integration with existing insurance systems. With proper
            data access and deployment resources, this system has the potential to provide significant value to Hong Kong's insurance industry.
          </Typography>
          </AccordionDetails>
        </Accordion>

        {/* References */}
        <Accordion elevation={0} sx={{ mb: 4, bgcolor: alpha(colors.darkBlue, 0.02), border: `1px solid ${alpha(colors.darkBlue, 0.1)}`, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight={700} color={colors.darkBlue}>
              References
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body1" fontWeight={600} color={colors.darkBlue}>
                Machine Learning Methods (8 studies)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color={colors.textPrimary}>
                  [5] Thaifur, A. Y. B., Maidin, M. A., & Sidin, A. I. (n.d.). <em>How to detect healthcare fraud? A systematic review</em>. [Preprint].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [6] Fourkiotis, K. P., & Tsadiras, A. (n.d.). <em>Future Internet Applications in Healthcare: Big Data-Driven Fraud Detection with Machine Learning</em>. [Preprint].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [8] Narne, H. (n.d.). <em>Machine Learning for Health Insurance Fraud Detection: Techniques, Insights, and Implementation Strategies</em>. UiPath Inc. [Preprint].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [9] Nalluri, V., Chang, J.-R., & Chen, J.-C. (n.d.). <em>Building prediction models and discovering important factors of health insurance fraud using machine learning methods</em>. [Preprint].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [12] Markapurapu John Dana Ebinezer, & Bondalapu Chaitanya Krishna. (n.d.). <em>Life Insurance Fraud Detection: A Data-Driven Approach Utilizing Ensemble Learning, CVAE, and Bi-LSTM</em>. [Unpublished manuscript].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [13] Chen, T., & Guestrin, C. (2016). <em>XGBoost: A Scalable Tree Boosting System</em>. KDD '16.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [15] Sundarkumar, G. G., & Ravi, V. (2015). <em>A survey on machine learning methods for insurance fraud detection</em>. Expert Systems with Applications, 42(20), 8034-8060.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [19] Xiao, F., Li, H.-x., Wang, X.-k., Wang, J.-q., & Chen, S. (2025). <em>Predictive analysis for healthcare fraud detection: Integration of probabilistic model and interpretable machine learning</em>. doi: 10.1016/j.ins.2025.122499
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [20] Farbmacher, H., Löw, L., & Spindler, M. (n.d.). <em>An explainable attention network for fraud detection in claims management</em>. [Manuscript submitted for publication].
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body1" fontWeight={600} color={colors.darkBlue}>
                Industry Reports & Statistics (7 studies)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color={colors.textPrimary}>
                  [2] Murbach, K., & Crowley, T. (2023, September 22). <em>Types of life insurance fraud</em>. PolicyGenius. 
                  <a href="https://www.policygenius.com/life-insurance/types-of-life-insurance-fraud" target="_blank" rel="noopener noreferrer" style={{ color: colors.mediumBlue }}> Link</a>
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [3] AXA. (2016). <em>AXA's Behavioural Fraud Report 2016</em>. 
                  <a href="https://www.axa.co.uk/newsroom/reports-and-publications" target="_blank" rel="noopener noreferrer" style={{ color: colors.mediumBlue }}> Link</a>
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [10] City University of Hong Kong. (n.d.). <em>A Study on Insurance Claim Risk Models</em>. [Unpublished manuscript].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [11] Chudgar, D. J., & Asthana, A. K. (n.d.). <em>Life Insurance Fraud – Risk Management and Fraud Prevention</em>. [Unpublished manuscript].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [14] Nigrini, M. J. (2012). <em>Benford's Law: Applications for Forensic Accounting, Auditing, and Fraud Detection</em>. Wiley.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [16] Hong Kong Federation of Insurers. (2024). <em>Annual Insurance Statistics Report</em>.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [17] Shift Technology. (2025, May 2). <em>Shift Insurance Perspectives: The Shared Data Edition</em>. 
                  <a href="https://www.shift-technology.com/resources/reports-and-insights/shift-insurance-perspectives-the-shared-data-edition" target="_blank" rel="noopener noreferrer" style={{ color: colors.mediumBlue }}> Link</a>
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [18] HKFI. (2022). <em>Medical Claim Statistics 2022</em>.
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body1" fontWeight={600} color={colors.darkBlue}>
                Hong Kong Context & Regulations (6 studies)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color={colors.textPrimary}>
                  [1] Legislative Council Secretariat. (2021, January 19). <em>Measures to tackle insurance fraud in selected places</em>. Research Office. 
                  <a href="https://www.legco.gov.hk/research-publications/english/2021rt04-measures-to-tackle-insurance-fraud-in-selected-places-20210119-e.pdf" target="_blank" rel="noopener noreferrer" style={{ color: colors.mediumBlue }}> Link</a>
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [4] International Association of Insurance Supervisors. (2020, February). <em>Issues Paper on the Use of Big Data Analytics in Insurance</em>. 
                  <a href="https://www.iais.org/uploads/2022/01/200319-Issues-Paper-on-Use-of-Big-Data-Analytics-in-Insurance-FINAL.pdf" target="_blank" rel="noopener noreferrer" style={{ color: colors.mediumBlue }}> Link</a>
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [7] Tse, G., Lee, Q., & Chen, L.-S. (n.d.). <em>Healthcare Big Data in Hong Kong: Development and Implementation of Artificial Intelligence-Enhanced Predictive Models for Risk Stratification</em>. [Preprint].
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [16] Hong Kong Federation of Insurers. (2024). <em>Annual Insurance Statistics Report</em>.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [18] HKFI. (2022). <em>Medical Claim Statistics 2022</em>.
                </Typography>
                
                <Typography variant="body2" color={colors.textPrimary}>
                  [21] Personal Data (Privacy) Ordinance (PDPO). (2013). <em>Cap. 486</em>. Hong Kong SAR Government.
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>
      </Container>
      )}

      {/* Comprehensive Dashboard Tab */}
      {activeTab === 1 && (
        <Container maxWidth="xl" sx={{ py: 6 }}>
          {/* Work in Progress Warning */}
          <Alert severity="warning" sx={{ mb: 4, borderLeft: `4px solid #ff9800` }}>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
              🚧 Dashboard Under Development
            </Typography>
            <Typography variant="body2">
              This comprehensive analytics dashboard is currently under construction. The visualizations and data shown are placeholders 
              for demonstration purposes. Real-time fraud detection analytics will be available once the ML model training is complete 
              and connected to live data sources.
            </Typography>
          </Alert>

          {/* Filters Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, bgcolor: alpha(colors.lightBlue, 0.05) }}>
            <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
              Filter Data
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <MenuItem value="1month">Last Month</MenuItem>
                    <MenuItem value="3months">Last 3 Months</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="1year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Risk Level</InputLabel>
                  <Select
                    value={riskLevel}
                    label="Risk Level"
                    onChange={(e) => setRiskLevel(e.target.value)}
                  >
                    <MenuItem value="all">All Levels</MenuItem>
                    <MenuItem value="high">High Risk (&gt;70%)</MenuItem>
                    <MenuItem value="medium">Medium Risk (30-70%)</MenuItem>
                    <MenuItem value="low">Low Risk (&lt;30%)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Claim Type</InputLabel>
                  <Select
                    value={claimType}
                    label="Claim Type"
                    onChange={(e) => setClaimType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="inpatient">Inpatient</MenuItem>
                    <MenuItem value="outpatient">Outpatient</MenuItem>
                    <MenuItem value="dental">Dental</MenuItem>
                    <MenuItem value="prescription">Prescription</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={region}
                    label="Region"
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <MenuItem value="all">All Regions</MenuItem>
                    <MenuItem value="hk-island">Hong Kong Island</MenuItem>
                    <MenuItem value="kowloon">Kowloon</MenuItem>
                    <MenuItem value="nt">New Territories</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ p: 3, borderTop: `4px solid ${colors.mediumBlue}` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Total Claims Analyzed
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.disabled">
                      ---
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      Pending data connection
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: alpha(colors.mediumBlue, 0.3) }} />
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ p: 3, borderTop: `4px solid #f44336` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      High Risk Claims
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.disabled">
                      ---
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      Pending data connection
                    </Typography>
                  </Box>
                  <WarningIcon sx={{ fontSize: 40, color: alpha('#f44336', 0.3) }} />
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ p: 3, borderTop: `4px solid #4caf50` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Detection Accuracy
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.disabled">
                      ---
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      Pending data connection
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: alpha('#4caf50', 0.3) }} />
                </Box>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ p: 3, borderTop: `4px solid #ff9800` }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Potential Savings
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.disabled">
                      ---
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      Pending data connection
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: alpha('#ff9800', 0.3) }} />
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Grid */}
          <Grid container spacing={3}>
            {/* Fraud Detection Trends Over Time */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Fraud Detection Trends Over Time
                </Typography>
                <Box sx={{ position: 'relative', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect data source to view trends
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Risk Distribution */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={2} sx={{ p: 3, height: '100%', position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Risk Distribution
                </Typography>
                <Box sx={{ position: 'relative', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect data source to view distribution
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Claim Types Distribution */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Claims by Type
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Regional Analysis */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Fraud Rate by Region
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis type="number" stroke={colors.darkBlue} />
                      <YAxis type="category" stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Claim Amount Distribution */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Claim Amount Distribution
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Model Performance Comparison */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Model Performance Comparison
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[]}>
                      <PolarGrid stroke={alpha(colors.darkBlue, 0.2)} />
                      <PolarAngleAxis stroke={colors.darkBlue} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={colors.darkBlue} />
                      <Legend />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Detection Rate Over Time */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Detection Rate
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                    </AreaChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Provider Network Analysis */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Provider Network Analysis
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Time-Based Patterns */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Time-Based Fraud Patterns
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis stroke={colors.darkBlue} />
                      <YAxis stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Feature Importance */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, position: 'relative' }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Feature Importance in Fraud Detection
                </Typography>
                <Box sx={{ position: 'relative', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(colors.darkBlue, 0.1)} />
                      <XAxis type="number" stroke={colors.darkBlue} />
                      <YAxis type="category" stroke={colors.darkBlue} />
                      <RechartsTooltip />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h6" color="text.disabled">
                      No Data Available
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Recent High-Risk Claims Table */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} color={colors.darkBlue} sx={{ mb: 3 }}>
                  Recent High-Risk Claims
                </Typography>
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.disabled" sx={{ mb: 1 }}>
                    No Claims Data Available
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Real-time claim data will appear here once the system is connected to live data sources
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      )}

      {/* Test Your Claims Tab */}
      {activeTab === 2 && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center', mt: 4 }}>
            <CloudUploadIcon sx={{ fontSize: 100, color: colors.mediumBlue }} />
            <Typography variant="h3" fontWeight={700} color={colors.darkBlue}>
              Upload & Analyze Claims
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
              Upload your insurance claims data to test our fraud detection model. Get instant risk assessments and detailed analysis.
            </Typography>
            <Paper elevation={3} sx={{ p: 6, maxWidth: 700, width: '100%' }}>
              <Typography variant="h5" gutterBottom color={colors.darkBlue}>
                Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This feature is currently under development. Soon you'll be able to upload CSV or Excel files 
                containing insurance claim data and receive real-time fraud risk predictions from our ML model.
              </Typography>
            </Paper>
          </Stack>
        </Container>
      )}

      {/* AI Research Assistant Tab */}
      {activeTab === 3 && (
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center', mt: 4 }}>
            <BotIcon sx={{ fontSize: 100, color: colors.mediumBlue }} />
            <Typography variant="h3" fontWeight={700} color={colors.darkBlue}>
              AI Research Assistant
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
              Ask questions about our research methodology, request citations, or explore technical appendices with AI-powered assistance.
            </Typography>
            <Paper elevation={3} sx={{ p: 6, maxWidth: 700, width: '100%' }}>
              <Typography variant="h5" gutterBottom color={colors.darkBlue}>
                Coming Soon
              </Typography>
              <Typography variant="body1" color="text.secondary">
                This feature is currently under development. Soon you'll be able to interact with an AI assistant 
                trained on our research paper, ask questions, get detailed explanations, and explore citations.
              </Typography>
            </Paper>
          </Stack>
        </Container>
      )}

      {/* Footer */}
      <Box sx={{ bgcolor: colors.darkBlue, color: 'white', py: 4, mt: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © 2025 Ruslan Sheikh | BC&DA Final Year Project
          </Typography>
          <Typography variant="caption" align="center" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            Built with React, TypeScript & Machine Learning
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
