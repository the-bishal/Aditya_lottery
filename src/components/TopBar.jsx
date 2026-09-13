import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import CasinoIcon from '@mui/icons-material/Casino';
import { tokens } from '../theme';

const NAV_LINKS = [
  { label: 'Result Generation', path: '/result' },
  { label: 'Hardcopy',          path: '/hardcopy' },
  { label: 'Middle Numbers',    path: '/middle-numbers' },
];

export default function TopBar() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const isHome     = location.pathname === '/';
  const isSettings = location.pathname === '/settings';

  return (
    <AppBar position="fixed" elevation={0} component="header" role="banner">
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
          gap: 1,
        }}
      >
        {/* ── Brand ─────────────────────────────────────────────────── */}
        <Box
          component="a"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          aria-label="Aditya Lottery — Go to home"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover .brand-icon': { transform: 'rotate(15deg) scale(1.05)' },
            '&:focus-visible': {
              outline: `2px solid ${tokens.gold}`,
              outlineOffset: '4px',
              borderRadius: '8px',
            },
          }}
        >
          <Box
            className="brand-icon"
            aria-hidden="true"
            sx={{
              width: { xs: 32, sm: 36 },
              height: { xs: 32, sm: 36 },
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${tokens.gold} 0%, ${tokens.crimson} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              flexShrink: 0,
            }}
          >
            <CasinoIcon sx={{ color: '#0D0D1A', fontSize: { xs: 18, sm: 20 } }} />
          </Box>

          <Box sx={{ overflow: 'hidden' }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                fontWeight: 800,
                letterSpacing: '-0.3px',
                lineHeight: 1.15,
                background: `linear-gradient(90deg, ${tokens.gold} 0%, ${tokens.goldLight} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                whiteSpace: 'nowrap',
              }}
            >
              Aditya Lottery
            </Typography>
            <Typography
              component="span"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: tokens.textMuted,
                lineHeight: 1.2,
              }}
            >
              Admin Dashboard
            </Typography>
          </Box>
        </Box>

        {/* ── Nav ──────────────────────────────────────────────────── */}
        <Box
          component="nav"
          role="navigation"
          aria-label="Main navigation"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          {/* Home button — shown only on inner pages */}
          {!isHome && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                aria-label="Go to home"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  py: 0.7,
                  px: 1.5,
                  borderColor: 'rgba(245,197,24,0.25)',
                  color: tokens.textSecondary,
                  '&:hover': {
                    borderColor: tokens.gold,
                    color: tokens.gold,
                    background: tokens.goldMuted,
                  },
                }}
              >
                Home
              </Button>

              {/* Mobile-only home icon */}
              <Tooltip title="Home" placement="bottom">
                <IconButton
                  onClick={() => navigate('/')}
                  aria-label="Go to home"
                  size="small"
                  sx={{
                    display: { xs: 'flex', sm: 'none' },
                    color: tokens.textSecondary,
                    '&:hover': { color: tokens.gold, background: tokens.goldMuted },
                  }}
                >
                  <HomeIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Settings button */}
          <Tooltip title="Settings" placement="bottom">
            <IconButton
              onClick={() => navigate('/settings')}
              aria-label="Settings"
              aria-current={isSettings ? 'page' : undefined}
              size="small"
              sx={{
                color: isSettings ? tokens.gold : tokens.textSecondary,
                borderRadius: '8px',
                border: isSettings
                  ? `1px solid rgba(245,197,24,0.40)`
                  : '1px solid transparent',
                background: isSettings ? tokens.goldMuted : 'transparent',
                transition: 'all 0.18s ease',
                '&:hover': {
                  color: tokens.gold,
                  background: tokens.goldMuted,
                  borderColor: tokens.goldBorder,
                },
              }}
            >
              <SettingsIcon
                fontSize="small"
                sx={{
                  transition: 'transform 0.4s ease',
                  transform: isSettings ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
