import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import theme from './theme';
import TopBar from './components/TopBar';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Home          = React.lazy(() => import('./pages/Home'));
const ResultGen     = React.lazy(() => import('./pages/ResultGen'));
const Hardcopy      = React.lazy(() => import('./pages/Hardcopy'));
const MiddleNumbers = React.lazy(() => import('./pages/MiddleNumbers'));
const Settings      = React.lazy(() => import('./pages/Settings'));

// ── Page loading skeleton ─────────────────────────────────────────────────────
function PageLoader() {
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
        maxWidth: '1200px',
        mx: 'auto',
        width: '100%',
      }}
    >
      {/* Breadcrumb skeleton */}
      <Skeleton
        variant="text"
        width={180}
        height={20}
        sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 2.5 }}
      />
      {/* Page header skeleton */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Skeleton
          variant="rounded"
          width={48}
          height={48}
          sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '14px' }}
        />
        <Box>
          <Skeleton variant="text" width={220} height={36} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
          <Skeleton variant="text" width={160} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
        </Box>
      </Box>
      {/* Content skeleton */}
      <Skeleton
        variant="rounded"
        height={320}
        sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: '12px' }}
      />
    </Box>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <TopBar />
        {/* pt matches AppBar minHeight at each breakpoint */}
        <Box
          component="main"
          id="main-content"
          sx={{
            pt: { xs: '56px', sm: '64px' },
            minHeight: '100vh',
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"               element={<Home />} />
              <Route path="/result"         element={<ResultGen />} />
              <Route path="/hardcopy"       element={<Hardcopy />} />
              <Route path="/middle-numbers" element={<MiddleNumbers />} />
              <Route path="/settings"       element={<Settings />} />
              <Route path="*"               element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
