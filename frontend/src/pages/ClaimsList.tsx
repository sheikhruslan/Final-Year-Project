import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { api } from '../services/api';

const getRiskColor = (level: string) => {
  const colors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
    critical: 'error',
    high: 'warning',
    medium: 'info',
    low: 'success',
  };
  return colors[level] || 'default';
};

export default function ClaimsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['claims', page, rowsPerPage, statusFilter, riskFilter],
    queryFn: () => api.listClaims(page + 1, rowsPerPage, {
      status: statusFilter || undefined,
      risk_level: riskFilter || undefined,
    }),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const claims = data?.claims || [];
  const total = data?.total || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Claims Management
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2}>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>

          <TextField
            select
            label="Risk Level"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Claim ID</strong></TableCell>
              <TableCell><strong>Claimant</strong></TableCell>
              <TableCell><strong>Provider</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Risk Level</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {claims.map((claim: any) => (
              <TableRow key={claim.claim_id} hover>
                <TableCell>{claim.claim_id}</TableCell>
                <TableCell>{claim.claimant_name}</TableCell>
                <TableCell>{claim.provider_name}</TableCell>
                <TableCell align="right">
                  HK$ {claim.claim_amount?.toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(claim.claim_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={claim.risk_level || 'Unknown'} 
                    color={getRiskColor(claim.risk_level)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={claim.status || 'Pending'} 
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => navigate(`/claims/${claim.claim_id}`)}
                  >
                    <ViewIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </TableContainer>
    </Box>
  );
}
