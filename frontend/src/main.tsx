import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import App from './App';
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create Material-UI theme - Academic Research Style (Off-white & Dark Blue)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a237e', // Dark blue
      light: '#534bae',
      dark: '#000051',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0d47a1', // Medium blue
      light: '#5472d3',
      dark: '#002171',
      contrastText: '#fff',
    },
    background: {
      default: '#F8F9FA', // Off-white
      paper: '#FEFEFE', // Pure white for papers
    },
    text: {
      primary: '#1a237e',
      secondary: '#5c6bc0',
    },
    error: {
      main: '#c62828',
    },
    warning: {
      main: '#f57c00',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: '"Georgia", "Times New Roman", "Baskerville", serif',
    h1: {
      fontWeight: 700,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    h2: {
      fontWeight: 700,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    h3: {
      fontWeight: 600,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    h4: {
      fontWeight: 600,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    h5: {
      fontWeight: 600,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    h6: {
      fontWeight: 600,
      fontFamily: '"Inter", "Helvetica", sans-serif',
    },
    body1: {
      lineHeight: 1.8,
      fontSize: '1rem',
    },
    body2: {
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
