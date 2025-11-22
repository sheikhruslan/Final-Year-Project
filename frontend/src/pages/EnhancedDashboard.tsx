import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  CircularProgress,
  Chip,
  LinearProgress,
  alpha,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import { 
  Warning as WarningIcon, 
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  TrendingDown as TrendingDownIcon,
  LocalHospital as HospitalIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
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
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { api } from '../services/api';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#9c27b0'];

interface DashboardStats {
  low_risk_count?: number;
  medium_risk_count?: number;
  high_risk_count?: number;
  total_claims?: number;
  fraudulent_claims?: number;
  detection_rate?: number;
  average_risk_score?: number;
}

export default function Dashboard() {
  const theme = useTheme();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getDashboardStats()
  });

  const { data: trends } = useQuery({
    queryKey: ['trends'],
    queryFn: () => api.getTrends(30)
  });

  // Enhanced mock data for better visualizations
  const fraudPatterns = [
    { type: 'Duplicate Claims', count: 45, severity: 'high', percentage: 28 },
    { type: 'Inflated Amounts', count: 38, severity: 'high', percentage: 24 },
    { type: 'Fake Documents', count: 28, severity: 'critical', percentage: 18 },
    { type: 'Provider Collusion', count: 22, severity: 'high', percentage: 14 },
    { type: 'Ghost Patients', count: 15, severity: 'medium', percentage: 9 },
    { type: 'Other Patterns', count: 11, severity: 'low', percentage: 7 },
  ];

  const hourlyAnalysis = [
    { hour: '00:00', legitimate: 2, fraudulent: 8 },
    { hour: '04:00', legitimate: 3, fraudulent: 12 },
    { hour: '08:00', legitimate: 45, fraudulent: 5 },
    { hour: '12:00', legitimate: 68, fraudulent: 8 },
    { hour: '16:00', legitimate: 52, fraudulent: 6 },
    { hour: '20:00', legitimate: 35, fraudulent: 15 },
  ];

  const detectionMethods = [
    { method: 'ML Model', accuracy: 92, cases: 450, color: '#667eea' },
    { method: 'Benford Law', accuracy: 85, cases: 320, color: '#764ba2' },
    { method: 'Rule Engine', accuracy: 78, cases: 280, color: '#f093fb' },
    { method: 'Network Analysis', accuracy: 88, cases: 190, color: '#4facfe' },
    { method: 'OCR Validation', accuracy: 95, cases: 510, color: '#43e97b' },
  ];

  const topRiskyProviders = [
    { name: 'Queen Elizabeth Hospital', fraudRate: 18.5, totalClaims: 324, flagged: 60, risk: 'high' },
    { name: 'Prince of Wales Hospital', fraudRate: 15.2, totalClaims: 298, flagged: 45, risk: 'high' },
    { name: 'Tuen Mun Hospital', fraudRate: 12.8, totalClaims: 412, flagged: 53, risk: 'medium' },
    { name: 'United Christian Hospital', fraudRate: 9.3, totalClaims: 267, flagged: 25, risk: 'medium' },
    { name: 'Pamela Youde Hospital', fraudRate: 8.1, totalClaims: 189, flagged: 15, risk: 'low' },
  ];

  const recentAlerts = [
    { 
      id: 'CLM789456', 
      type: 'Duplicate Claim', 
      amount: 'HK$125,000', 
      time: '5 min ago',
      severity: 'critical',
      provider: 'Queen Elizabeth Hospital'
    },
    { 
      id: 'CLM789457', 
      type: 'Suspicious Amount', 
      amount: 'HK$89,000', 
      time: '12 min ago',
      severity: 'high',
      provider: 'Prince of Wales Hospital'
    },
    { 
      id: 'CLM789458', 
      type: 'Network Pattern', 
      amount: 'HK$45,000', 
      time: '23 min ago',
      severity: 'high',
      provider: 'Tuen Mun Hospital'
    },
    { 
      id: 'CLM789459', 
      type: 'Rush Submission', 
      amount: 'HK$32,000', 
      time: '35 min ago',
      severity: 'medium',
      provider: 'United Christian Hospital'
    },
  ];

  const geographicData = [
    { district: 'Central & Western', fraudRate: 12.5, totalClaims: 450 },
    { district: 'Wan Chai', fraudRate: 15.2, totalClaims: 380 },
    { district: 'Eastern', fraudRate: 9.8, totalClaims: 520 },
    { district: 'Southern', fraudRate: 8.3, totalClaims: 290 },
    { district: 'Yau Tsim Mong', fraudRate: 18.7, totalClaims: 610 },
    { district: 'Sham Shui Po', fraudRate: 16.4, totalClaims: 540 },
    { district: 'Kowloon City', fraudRate: 14.1, totalClaims: 470 },
  ];

  const riskFactorRadar = [
    { factor: 'Amount', legitimate: 45, fraudulent: 85 },
    { factor: 'Timing', legitimate: 60, fraudulent: 75 },
    { factor: 'Provider', legitimate: 55, fraudulent: 90 },
    { factor: 'History', legitimate: 70, fraudulent: 65 },
    { factor: 'Documents', legitimate: 80, fraudulent: 55 },
    { factor: 'Network', legitimate: 50, fraudulent: 88 },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const riskDistribution = [
    { name: 'Low Risk', value: stats?.low_risk_count || 0 },
    { name: 'Medium Risk', value: stats?.medium_risk_count || 0 },
    { name: 'High Risk', value: stats?.high_risk_count || 0 },
  ];

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: '#f44336',
      high: '#ff9800',
      medium: '#ffeb3b',
      low: '#4caf50',
    };
    return colors[severity] || '#9e9e9e';
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Fraud Detection Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time analytics and insights for insurance fraud detection across Hong Kong
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha('#667eea', 0.1)} 0%, ${alpha('#667eea', 0.05)} 100%)`,
              border: `2px solid ${alpha('#667eea', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 16px ${alpha('#667eea', 0.2)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight={600}>
                    Total Claims
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#667eea">
                    {stats?.total_claims || 0}
                  </Typography>
                  <Chip label="+12.5%" size="small" color="success" sx={{ mt: 1 }} />
                </Box>
                <Avatar sx={{ bgcolor: alpha('#667eea', 0.2), color: '#667eea', width: 56, height: 56 }}>
                  <AssessmentIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha('#f44336', 0.1)} 0%, ${alpha('#f44336', 0.05)} 100%)`,
              border: `2px solid ${alpha('#f44336', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 16px ${alpha('#f44336', 0.2)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight={600}>
                    Fraudulent Claims
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#f44336">
                    {stats?.fraudulent_claims || 0}
                  </Typography>
                  <Chip label="-3.2%" size="small" color="error" sx={{ mt: 1 }} />
                </Box>
                <Avatar sx={{ bgcolor: alpha('#f44336', 0.2), color: '#f44336', width: 56, height: 56 }}>
                  <WarningIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha('#4caf50', 0.1)} 0%, ${alpha('#4caf50', 0.05)} 100%)`,
              border: `2px solid ${alpha('#4caf50', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 16px ${alpha('#4caf50', 0.2)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight={600}>
                    Detection Rate
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#4caf50">
                    {stats?.detection_rate || 90}%
                  </Typography>
                  <Chip label="+5.7%" size="small" color="success" sx={{ mt: 1 }} />
                </Box>
                <Avatar sx={{ bgcolor: alpha('#4caf50', 0.2), color: '#4caf50', width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              background: `linear-gradient(135deg, ${alpha('#ff9800', 0.1)} 0%, ${alpha('#ff9800', 0.05)} 100%)`,
              border: `2px solid ${alpha('#ff9800', 0.2)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 16px ${alpha('#ff9800', 0.2)}`,
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2" fontWeight={600}>
                    Saved Amount
                  </Typography>
                  <Typography variant="h3" fontWeight={800} color="#ff9800">
                    HK${((stats?.average_risk_score || 0) * 100000).toLocaleString()}
                  </Typography>
                  <Chip label="+18.3%" size="small" color="warning" sx={{ mt: 1 }} />
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ff9800', 0.2), color: '#ff9800', width: 56, height: 56 }}>
                  <MoneyIcon fontSize="large" />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Trends Over Time */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Claims & Fraud Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f44336" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total_claims" 
                  stroke="#667eea" 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                  strokeWidth={3}
                  name="Total Claims"
                />
                <Area 
                  type="monotone" 
                  dataKey="fraudulent_claims" 
                  stroke="#f44336" 
                  fillOpacity={1} 
                  fill="url(#colorFraud)" 
                  strokeWidth={3}
                  name="Fraudulent Claims"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Risk Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Risk Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Fraud Patterns */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Top Fraud Patterns
            </Typography>
            <Box mt={2}>
              {fraudPatterns.map((pattern, index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={600}>
                      {pattern.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {pattern.count} cases ({pattern.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={pattern.percentage * 2} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(getSeverityColor(pattern.severity), 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSeverityColor(pattern.severity),
                      }
                    }} 
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Hourly Analysis */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Hourly Submission Pattern
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyAnalysis}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Bar dataKey="legitimate" fill="#4caf50" radius={[8, 8, 0, 0]} />
                <Bar dataKey="fraudulent" fill="#f44336" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Detection Methods Performance */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Detection Methods Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={detectionMethods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#999" />
                <YAxis dataKey="method" type="category" width={120} stroke="#999" />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#667eea" radius={[0, 8, 8, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Risk Factor Comparison */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Risk Factor Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskFactorRadar}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="factor" stroke="#999" />
                <PolarRadiusAxis stroke="#999" />
                <Radar name="Legitimate" dataKey="legitimate" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                <Radar name="Fraudulent" dataKey="fraudulent" stroke="#f44336" fill="#f44336" fillOpacity={0.3} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Risky Providers */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              High-Risk Healthcare Providers
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Provider</strong></TableCell>
                    <TableCell align="center"><strong>Fraud Rate</strong></TableCell>
                    <TableCell align="center"><strong>Total Claims</strong></TableCell>
                    <TableCell align="center"><strong>Flagged</strong></TableCell>
                    <TableCell align="center"><strong>Risk Level</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topRiskyProviders.map((provider, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <HospitalIcon color="primary" />
                          <Typography variant="body2">{provider.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${provider.fraudRate}%`} 
                          size="small"
                          sx={{
                            bgcolor: alpha(getSeverityColor(provider.risk), 0.2),
                            color: getSeverityColor(provider.risk),
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">{provider.totalClaims}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color="error">
                          {provider.flagged}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={provider.risk.toUpperCase()} 
                          size="small"
                          color={provider.risk === 'high' ? 'error' : provider.risk === 'medium' ? 'warning' : 'success'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recent Fraud Alerts
            </Typography>
            <List>
              {recentAlerts.map((alert, index) => (
                <Box key={index}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(getSeverityColor(alert.severity), 0.2) }}>
                        <WarningIcon sx={{ color: getSeverityColor(alert.severity) }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700}>
                            {alert.type}
                          </Typography>
                          <Chip 
                            label={alert.severity} 
                            size="small"
                            sx={{
                              bgcolor: alpha(getSeverityColor(alert.severity), 0.2),
                              color: getSeverityColor(alert.severity),
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Claim ID: {alert.id} • {alert.amount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {alert.provider} • {alert.time}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < recentAlerts.length - 1 && <Divider variant="inset" component="li" />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Geographic Distribution */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Geographic Fraud Distribution (Hong Kong Districts)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geographicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="district" stroke="#999" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="#999" />
                <Tooltip />
                <Legend />
                <Bar dataKey="fraudRate" fill="#f44336" radius={[8, 8, 0, 0]} name="Fraud Rate %" />
                <Bar dataKey="totalClaims" fill="#667eea" radius={[8, 8, 0, 0]} name="Total Claims" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
