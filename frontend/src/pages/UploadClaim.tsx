import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { CloudUpload as UploadIcon, Description as FileIcon } from '@mui/icons-material';
import { api } from '../services/api';

export default function UploadClaim() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadClaim(file),
    onSuccess: (data) => {
      setExtractedData(data.extracted_data);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Upload Claim Document
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 4 }}>
        Upload a claim document for automatic OCR extraction and fraud analysis
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            {...getRootProps()}
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or click to select a file
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: PDF, PNG, JPG, DOCX (Max 10MB)
            </Typography>

            {uploadedFile && (
              <Card sx={{ mt: 3, textAlign: 'left' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <FileIcon color="primary" />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {uploadedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Paper>

          {uploadMutation.isPending && (
            <Box display="flex" justifyContent="center" mt={3}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Processing document...
              </Typography>
            </Box>
          )}

          {uploadMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error uploading file. Please try again.
            </Alert>
          )}
        </Grid>

        {extractedData && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Extracted Information
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Policy Number
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {extractedData.policy_number}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Claimant
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {extractedData.claimant_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Provider
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {extractedData.provider_name}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={600} color="primary">
                    HK$ {extractedData.claim_amount?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Treatment Code
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {extractedData.treatment_code}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {extractedData.location?.district || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                Confidence: {(extractedData.extraction_confidence * 100).toFixed(0)}%
              </Alert>

              <Box mt={3} display="flex" gap={2}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate(`/claims/${extractedData.claim_id}`)}
                >
                  Analyze Claim
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setUploadedFile(null);
                    setExtractedData(null);
                  }}
                >
                  Clear
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
