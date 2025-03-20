import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Layout, PrivateRoute } from './components';
import { AuthProvider } from './contexts/AuthContext';
import {
  Login,
  Register,
  Dashboard,
  ProductImport,
  Tracking,
  Warehouse,
} from './pages';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF69B4',
      light: '#FFB6C1',
      dark: '#DB7093',
    },
    secondary: {
      main: '#FF1493',
      light: '#FF69B4',
      dark: '#C71585',
    },
    background: {
      default: '#fce4ec', // Very light pink
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/signin" element={<Login />} />
                <Route path="/signup" element={<Register />} />
                
                {/* Protected routes with layout */}
                <Route element={<PrivateRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/product-import" element={<ProductImport />} />
                    <Route path="/tracking" element={<Tracking />} />
                    <Route path="/warehouse" element={<Warehouse />} />
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </Router>
        </LocalizationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
