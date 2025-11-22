import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';

export default function Home() {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 48 }} />,
      title: 'AI-Powered Detection',
      description: 'Advanced machine learning models trained on thousands of claims to identify suspicious patterns with 90%+ accuracy.',
      color: '#667eea',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 48 }} />,
      title: "Benford's Law Analysis",
      description: 'Statistical fraud detection using mathematical patterns in claim amounts to uncover manipulation.',
      color: '#764ba2',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: 'Real-Time Processing',
      description: 'Analyze claims in under 2 seconds with instant risk scores and detailed explanations.',
      color: '#f093fb',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Multi-Layer Security',
      description: 'Combines ML predictions, statistical analysis, and rule-based checks for comprehensive fraud detection.',
      color: '#4facfe',
    },
    {
      icon: <AssessmentIcon sx={{ fontSize: 48 }} />,
      title: 'Interactive Dashboards',
      description: 'Visualize fraud trends, risk distributions, and provider analytics with beautiful charts.',
      color: '#43e97b',
    },
    {
      icon: <AutoGraphIcon sx={{ fontSize: 48 }} />,
      title: 'Predictive Analytics',
      description: 'Forecast fraud patterns and identify emerging risks before they become widespread.',
      color: '#fa709a',
    },
  ];

  const stats = [
    { value: 'HK$8-12M', label: 'Annual Fraud Prevention', icon: <ShieldIcon /> },
    { value: '90%+', label: 'Detection Accuracy', icon: <TrendingUpIcon /> },
    { value: '<2s', label: 'Processing Time', icon: <SpeedIcon /> },
    { value: '70%', label: 'Manual Review Reduction', icon: <AnalyticsIcon /> },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.85)} 100%)`,
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.4,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box textAlign="center">
            <Chip
              label="Powered by XGBoost & Benford's Law"
              sx={{
                mb: 3,
                bgcolor: alpha('#fff', 0.2),
                color: 'white',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              gutterBottom
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Predictive Analytics for
              <br />
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(45deg, #fff 30%, #e0f2fe 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Fraudulent Health Insurance Claims
              </Box>
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 4,
                maxWidth: 800,
                mx: 'auto',
                opacity: 0.95,
                fontWeight: 400,
                lineHeight: 1.6,
              }}
            >
              Detect fraudulent insurance claims with 90%+ accuracy using advanced machine learning,
              statistical analysis, and intelligent rule-based systems tailored for Hong Kong.
            </Typography>
            <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                View Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/upload')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: alpha('#fff', 0.1),
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Upload Claim
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -6, mb: 8, position: 'relative', zIndex: 2 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Box sx={{ fontSize: 40, mb: 1, opacity: 0.9 }}>{stat.icon}</Box>
                <Typography variant="h3" fontWeight={800} gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={8}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Comprehensive Fraud Detection
          </Typography>
          <Typography variant="h6" color="text.secondary" maxWidth={700} mx="auto">
            Our multi-layered approach combines cutting-edge AI, statistical methods, and domain
            expertise to provide unparalleled fraud detection capabilities.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(feature.color, 0.1)} 0%, ${alpha(
                    feature.color,
                    0.05
                  )} 100%)`,
                  border: `2px solid ${alpha(feature.color, 0.2)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 12px 24px ${alpha(feature.color, 0.3)}`,
                    border: `2px solid ${alpha(feature.color, 0.4)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" lineHeight={1.7}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              How It Works
            </Typography>
            <Typography variant="h6" color="text.secondary" maxWidth={700} mx="auto">
              Our intelligent system analyzes claims through multiple detection layers
            </Typography>
          </Box>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#667eea',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#764ba2',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  1
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                  Upload Document
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Submit claim documents via drag-and-drop interface
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#f093fb',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#f5576c',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  2
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                  OCR Extraction
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Automatically extract and validate claim data
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#4facfe',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#00f2fe',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  3
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                  AI Analysis
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Process through ML, Benford's Law, and rule checks
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={3}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#43e97b',
                  color: 'white',
                  position: 'relative',
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    position: 'absolute',
                    top: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: '#38f9d7',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  4
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                  Risk Score
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Receive instant fraud probability with explanations
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Paper
          elevation={12}
          sx={{
            p: 6,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 4,
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Combat Insurance Fraud?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.95 }}>
            Start analyzing claims with our powerful AI-driven platform today
          </Typography>
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/upload')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: alpha('#fff', 0.9),
                },
              }}
            >
              Upload Your First Claim
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/claims')}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: alpha('#fff', 0.1),
                },
              }}
            >
              View All Claims
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
