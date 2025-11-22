import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  CircularProgress,
  Button,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { api } from '../services/api';

const getRiskColor = (score: number) => {
  if (score >= 75) return 'error';
  if (score >= 50) return 'warning';
  if (score >= 25) return 'info';
  return 'success';
};

const getRiskLabel = (level: string) => {
  const labels: Record<string, string> = {
    critical: '🚨 CRITICAL RISK',
    high: '⚠️ HIGH RISK',
    medium: '⚡ MEDIUM RISK',
    low: '✅ LOW RISK',
  };
  return labels[level] || level;
};

export default function ClaimAnalysis() {
  const { claimId } = useParams<{ claimId: string }>();

  const { data: claim, isLoading: claimLoading } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => api.getClaim(claimId!),
  });

  const { data: analysis, isLoading: analysisLoading, refetch } = useQuery({
    queryKey: ['analysis', claimId],
    queryFn: async () => {
      try {
        return await api.getAnalysisResult(claimId!);
      } catch (error) {
        // If no analysis exists, trigger one
        return await api.analyzeClaim(claimId!);
      }
    },
  });

  if (claimLoading || analysisLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!claim || !analysis) {
    return (
      <Alert severity="error">Claim or analysis data not found</Alert>
    );
  }

  const riskScore = analysis.risk_score;
  const overallScore = riskScore?.overall_score || 0;

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Claim Analysis: {claimId}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Detailed fraud risk assessment and explanation
        </Typography>
      </Box>

      {/* Risk Score Overview */}
      <Paper elevation={3} sx={{ p: 4, mb: 3, bgcolor: getRiskColor(overallScore) + '.50' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              {getRiskLabel(riskScore?.risk_level)}
            </Typography>
            <Typography variant="h1" fontWeight={800} color={getRiskColor(overallScore) + '.main'}>
              {overallScore.toFixed(1)}
              <Typography component="span" variant="h4" color="text.secondary">
                /100
              </Typography>
            </Typography>
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Confidence Interval
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {riskScore?.confidence_interval[0].toFixed(1)} - {riskScore?.confidence_interval[1].toFixed(1)}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Component Breakdown
            </Typography>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Machine Learning</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {riskScore?.components?.ml_score?.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={riskScore?.components?.ml_score} 
                color={getRiskColor(riskScore?.components?.ml_score)}
              />
            </Box>
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Benford's Law</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {riskScore?.components?.benford_score?.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={riskScore?.components?.benford_score} 
                color={getRiskColor(riskScore?.components?.benford_score)}
              />
            </Box>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Rule-Based Checks</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {riskScore?.components?.rule_score?.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={riskScore?.components?.rule_score} 
                color={getRiskColor(riskScore?.components?.rule_score)}
              />
            </Box>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Button 
            variant="contained" 
            onClick={() => refetch()}
            sx={{ mr: 2 }}
          >
            Re-analyze
          </Button>
          <Button variant="outlined">
            Generate Report
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Claim Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Claim Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Claimant</Typography>
                <Typography variant="body1" fontWeight={600}>{claim.claimant_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Provider</Typography>
                <Typography variant="body1" fontWeight={600}>{claim.provider_name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Amount</Typography>
                <Typography variant="h6" fontWeight={600} color="primary">
                  HK$ {claim.claim_amount?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Claim Date</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(claim.claim_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Treatment</Typography>
                <Typography variant="body1" fontWeight={600}>{claim.treatment_code}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Location</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {claim.location?.district || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Rule-Based Flags */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Flagged Rules ({analysis.rule_based_flags?.length || 0})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {analysis.rule_based_flags && analysis.rule_based_flags.length > 0 ? (
              <List>
                {analysis.rule_based_flags.map((flag: any, index: number) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <WarningIcon color={flag.severity === 'critical' ? 'error' : 'warning'} fontSize="small" />
                          <Typography fontWeight={600}>{flag.rule_name}</Typography>
                          <Chip label={flag.severity} size="small" color={flag.severity === 'critical' ? 'error' : 'warning'} />
                        </Box>
                      }
                      secondary={flag.description}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="success" icon={<CheckIcon />}>
                No rule violations detected
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Feature Contributions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Top Risk Factors
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {analysis.feature_contributions?.slice(0, 6).map((feature: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {feature.feature_name}
                      </Typography>
                      <Typography variant="h5" fontWeight={600} color="primary">
                        {feature.contribution.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Value: {feature.value} | Importance: {(feature.importance * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Investigator Recommendations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List>
              {analysis.recommendations?.map((rec: string, index: number) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <InfoIcon color="primary" fontSize="small" />
                        <Typography>{rec}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
