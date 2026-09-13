import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import SettingsIcon from '@mui/icons-material/Settings';
import PaletteIcon from '@mui/icons-material/Palette';
import TuneIcon from '@mui/icons-material/Tune';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CheckIcon from '@mui/icons-material/Check';
import useLotteryStore from '../store/useLotteryStore';
import PageHeader from '../components/PageHeader';
import { tokens } from '../theme';

const ACCENT_PRESETS = [
  { label: 'Gold',    color: '#F5C518' },
  { label: 'Crimson', color: '#C0392B' },
  { label: 'Purple',  color: '#8E44AD' },
  { label: 'Teal',    color: '#1ABC9C' },
  { label: 'Blue',    color: '#3498DB' },
  { label: 'Orange',  color: '#E67E22' },
];

const STACK_INFO = [
  { label: 'Version',      value: '1.0.0' },
  { label: 'Stack',        value: 'Vite + React + MUI v5' },
  { label: 'OCR Engine',   value: 'Tesseract.js' },
  { label: 'Image Export', value: 'html2canvas' },
  { label: 'State',        value: 'Zustand' },
  { label: 'Mode',         value: 'Fully offline' },
];

function SettingsSection({ title, icon, children, accentColor = tokens.gold }) {
  return (
    <Paper
      sx={{
        p: { xs: 2.5, sm: 3 },
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${tokens.border}`,
        mb: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          aria-hidden="true"
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: tokens.textPrimary }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2.5 }} />
      {children}
    </Paper>
  );
}

export default function Settings() {
  const resetAll = useLotteryStore((s) => s.resetAll);

  const [fontSize,    setFontSize]    = useState(14);
  const [animations,  setAnimations]  = useState(true);
  const [accentColor, setAccentColor] = useState('#F5C518');
  const [resetDone,   setResetDone]   = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    resetAll();
    setResetDone(true);
    setResetConfirm(false);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <Container
      maxWidth="md"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={<SettingsIcon fontSize="inherit" />}
        iconBg="rgba(245,197,24,0.12)"
        iconColor={tokens.gold}
        title="Settings"
        subtitle="Customize your dashboard preferences"
        breadcrumb="Settings"
      />

      {/* ── Appearance ──────────────────────────────────────────────── */}
      <SettingsSection title="Appearance" icon={<PaletteIcon fontSize="inherit" />}>
        {/* Accent color */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={1.5} fontWeight={500}>
            Accent Color
          </Typography>
          <Box
            role="radiogroup"
            aria-label="Select accent color"
            sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}
          >
            {ACCENT_PRESETS.map((p) => (
              <Tooltip key={p.color} title={p.label} placement="top">
                <Box
                  role="radio"
                  aria-checked={accentColor === p.color}
                  aria-label={p.label}
                  tabIndex={0}
                  onClick={() => setAccentColor(p.color)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAccentColor(p.color); }}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: p.color,
                    cursor: 'pointer',
                    position: 'relative',
                    border: accentColor === p.color
                      ? '3px solid rgba(255,255,255,0.85)'
                      : '3px solid transparent',
                    boxShadow: accentColor === p.color
                      ? `0 0 14px ${p.color}70`
                      : 'none',
                    transition: 'all 0.18s ease',
                    '&:hover': { transform: 'scale(1.12)' },
                    '&:focus-visible': {
                      outline: `2px solid white`,
                      outlineOffset: '2px',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {accentColor === p.color && (
                    <CheckIcon sx={{ color: 'rgba(0,0,0,0.7)', fontSize: 16 }} />
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Selected:{' '}
            <Box component="span" sx={{ color: accentColor, fontWeight: 700 }}>
              {ACCENT_PRESETS.find((p) => p.color === accentColor)?.label}
            </Box>
            &nbsp;· Accent color preview only (theme changes require restart)
          </Typography>
        </Box>

        {/* Font size */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} id="font-size-label">
              Base font size
            </Typography>
            <Chip
              label={`${fontSize}px`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 22 }}
            />
          </Box>
          <Slider
            value={fontSize}
            onChange={(_, v) => setFontSize(v)}
            min={12}
            max={20}
            step={1}
            aria-labelledby="font-size-label"
            marks={[
              { value: 12, label: '12' },
              { value: 16, label: '16' },
              { value: 20, label: '20' },
            ]}
            sx={{ color: 'primary.main' }}
          />
        </Box>

        {/* Animations toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={animations}
              onChange={(e) => setAnimations(e.target.checked)}
              color="primary"
              inputProps={{ 'aria-label': 'Enable animations and transitions' }}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Enable animations &amp; transitions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Disable for reduced motion experience
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', ml: 0 }}
        />
      </SettingsSection>

      {/* ── Data Management ──────────────────────────────────────────── */}
      <SettingsSection
        title="Data Management"
        icon={<TuneIcon fontSize="inherit" />}
        accentColor={tokens.crimson}
      >
        <Typography variant="body2" color="text.secondary" mb={2.5} lineHeight={1.7}>
          All data is stored in memory only (Zustand). Nothing is saved to disk or a server.
          Resetting will clear all parsed numbers, exclusions, and results.
        </Typography>

        {resetDone && (
          <Alert severity="success" sx={{ mb: 2 }}>
            All data cleared successfully.
          </Alert>
        )}

        {resetConfirm && !resetDone && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Click <strong>Confirm Reset</strong> again to proceed. This cannot be undone.
          </Alert>
        )}

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<DeleteForeverIcon />}
          onClick={handleReset}
          sx={{
            borderColor: 'rgba(192,57,43,0.35)',
            color: 'secondary.light',
            '&:hover': {
              borderColor: tokens.crimson,
              background: 'rgba(192,57,43,0.08)',
            },
          }}
        >
          {resetConfirm ? 'Confirm Reset' : 'Reset All Data'}
        </Button>
      </SettingsSection>

      {/* ── About ────────────────────────────────────────────────────── */}
      <SettingsSection
        title="About"
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        accentColor={tokens.info}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 0,
          }}
        >
          {STACK_INFO.map(({ label, value }, i) => (
            <Box
              key={label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.25,
                px: 0.5,
                borderBottom: i < STACK_INFO.length - 2
                  ? `1px solid ${tokens.border}`
                  : 'none',
              }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {label}
              </Typography>
              <Chip
                label={value}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22, maxWidth: 180 }}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Aditya Lottery Admin Dashboard &nbsp;·&nbsp; Built with ❤️ &nbsp;·&nbsp; All processing is done offline in your browser
        </Typography>
      </SettingsSection>
    </Container>
  );
}
