// API Service for communicating with backend
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard endpoints
  getDashboardStats: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const response = await apiClient.get(`/dashboard/stats?${params.toString()}`);
    return response.data;
  },

  getTrends: async (days: number = 30, granularity: string = 'day') => {
    const response = await apiClient.get(`/dashboard/trends`, {
      params: { days, granularity }
    });
    return response.data;
  },

  getProviderStats: async (limit: number = 20, sortBy: string = 'flagged_claims') => {
    const response = await apiClient.get(`/dashboard/providers`, {
      params: { limit, sort_by: sortBy }
    });
    return response.data;
  },

  getGeographicData: async () => {
    const response = await apiClient.get(`/dashboard/geographic`);
    return response.data;
  },

  getNetworkGraph: async (claimId?: string) => {
    const params = claimId ? { claim_id: claimId } : {};
    const response = await apiClient.get(`/dashboard/network-graph`, { params });
    return response.data;
  },

  getRecentAlerts: async (limit: number = 10) => {
    const response = await apiClient.get(`/dashboard/recent-alerts`, {
      params: { limit }
    });
    return response.data;
  },

  // Claims endpoints
  uploadClaim: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/claims/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitClaim: async (claimData: any) => {
    const response = await apiClient.post('/claims/submit', claimData);
    return response.data;
  },

  getClaim: async (claimId: string) => {
    const response = await apiClient.get(`/claims/${claimId}`);
    return response.data;
  },

  listClaims: async (page: number = 1, pageSize: number = 20, filters?: any) => {
    const response = await apiClient.get('/claims/', {
      params: { page, page_size: pageSize, ...filters }
    });
    return response.data;
  },

  deleteClaim: async (claimId: string) => {
    const response = await apiClient.delete(`/claims/${claimId}`);
    return response.data;
  },

  // Analysis endpoints
  analyzeClaim: async (claimId: string, forceReanalysis: boolean = false) => {
    const response = await apiClient.post('/analysis/analyze', {
      claim_id: claimId,
      force_reanalysis: forceReanalysis
    });
    return response.data;
  },

  getAnalysisResult: async (claimId: string) => {
    const response = await apiClient.get(`/analysis/results/${claimId}`);
    return response.data;
  },

  batchAnalyzeClaims: async (claimIds: string[]) => {
    const response = await apiClient.get('/analysis/batch-analyze', {
      params: { claim_ids: claimIds }
    });
    return response.data;
  },

  getFeatureImportance: async () => {
    const response = await apiClient.get('/analysis/feature-importance');
    return response.data;
  },

  explainPrediction: async (claimId: string) => {
    const response = await apiClient.post(`/analysis/explain/${claimId}`);
    return response.data;
  },

  // Chat endpoints
  sendMessage: async (message: string, conversationId?: string, context?: any) => {
    const response = await apiClient.post('/chat/message', {
      message,
      conversation_id: conversationId,
      context
    });
    return response.data;
  },

  executeCode: async (code: string, context?: any) => {
    const response = await apiClient.post('/chat/execute-code', {
      code,
      context
    });
    return response.data;
  },

  getConversation: async (conversationId: string) => {
    const response = await apiClient.get(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  deleteConversation: async (conversationId: string) => {
    const response = await apiClient.delete(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  getSuggestions: async (query: string = '') => {
    const response = await apiClient.get('/chat/suggestions', {
      params: { query }
    });
    return response.data;
  },
};

export default apiClient;
