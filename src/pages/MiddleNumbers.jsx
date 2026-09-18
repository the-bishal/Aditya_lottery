import React, { useState, useCallback, useMemo } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VerifiedIcon from '@mui/icons-material/Verified';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

import useLotteryStore from '../store/useLotteryStore';
import {
  generateMiddleSets,
  verifyMiddleSets,
  formatSetsForClipboard,
} from '../utils/middleNumbersEngine';
import PageHeader from '../components/PageHeader';
import { tokens } from '../theme';

const ACCENT = tokens.purple;
const ACCENT_BG = 'rgba(142,68,173,0.12)';
const ACCENT_BORDER = 'rgba(142,68,173,0.25)';

// Color mapping for prize denomination badges
const PRIZE_COLORS = {
  '200': '#FFD700', // Gold
  '100': '#00E5FF', // Cyan
  '50':  '#FFA100', // Amber
  '25':  '#B388FF', // Violet
  '10':  '#2ECC71', // Green
  '5':   '#F5C518', // Warm Yellow
};

export default function MiddleNumbers() {
  const {
    middleSetCount,
    middleGeneratedSets,
    middleVerificationStatus,
    middleVerificationErrors,
    middleIsGenerating,
    setMiddleSetCount,
    setMiddleGeneratedSets,
    setMiddleVerificationStatus,
    setMiddleVerificationErrors,
    setMiddleIsGenerating,
    resetMiddleNumbers,
    excludedCodeSet,
  } = useLotteryStore();

  const [inputError, setInputError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0); // 0: Visual Cards, 1: Raw Output

  // Maximum available unique sets (each set requires 8 distinct 2-digit middle numbers)
  const maxAvailableSets = useMemo(() => {
    const excludedCount = excludedCodeSet?.size || 0;
    const available = Math.max(0, 100 - excludedCount);
    return Math.floor(available / 8);
  }, [excludedCodeSet]);

  // Quick preset counts clamped by maximum available sets
  const presetList = useMemo(() => {
    const base = [1, 2, 5, 8, 10, 12];
    const filtered = base.filter((p) => p <= maxAvailableSets);
    if (maxAvailableSets > 0 && !filtered.includes(maxAvailableSets) && maxAvailableSets <= 12) {
      filtered.push(maxAvailableSets);
      filtered.sort((a, b) => a - b);
    }
    return filtered.length > 0 ? filtered : [1];
  }, [maxAvailableSets]);

  // Validate user sets input
  const validateInput = useCallback((val) => {
    if (!val || String(val).trim() === '') {
      return 'Please enter the number of sets to generate.';
    }
    if (String(val).includes('.') || String(val).includes(',')) {
      return 'Number of sets must be a whole integer, not a decimal.';
    }
    const n = parseInt(val, 10);
    if (isNaN(n) || n <= 0) {
      return 'Number of sets must be greater than 0.';
    }
    if (n > maxAvailableSets) {
      return `Maximum ${maxAvailableSets} unique sets can be generated at a time (100 total middle codes, 8 per set).`;
    }
    return '';
  }, [maxAvailableSets]);

  // Handle generation
  const handleGenerate = useCallback(() => {
    const errorMsg = validateInput(middleSetCount);
    if (errorMsg) {
      setInputError(errorMsg);
      setMiddleVerificationStatus('idle');
      setMiddleVerificationErrors([errorMsg]);
      return;
    }

    setInputError('');
    setMiddleIsGenerating(true);

    try {
      const count = parseInt(middleSetCount, 10);
      const res = generateMiddleSets(count, { excludedCodeSet });

      if (res.error) {
        setMiddleVerificationStatus('failed');
        setMiddleVerificationErrors([res.error]);
        setMiddleGeneratedSets([]);
        setMiddleIsGenerating(false);
        return;
      }

      // Verify the generated sets
      const verification = verifyMiddleSets(res.sets, count);

      if (verification.isValid) {
        setMiddleGeneratedSets(res.sets);
        setMiddleVerificationStatus('verified');
        setMiddleVerificationErrors([]);
      } else {
        setMiddleGeneratedSets(res.sets);
        setMiddleVerificationStatus('failed');
        setMiddleVerificationErrors(verification.errors);
      }
    } catch (err) {
      setMiddleVerificationStatus('failed');
      setMiddleVerificationErrors([err.message || 'An unexpected error occurred during generation.']);
    } finally {
      setMiddleIsGenerating(false);
    }
  }, [
    middleSetCount,
    excludedCodeSet,
    validateInput,
    setMiddleGeneratedSets,
    setMiddleVerificationStatus,
    setMiddleVerificationErrors,
    setMiddleIsGenerating,
  ]);

  // Handle key press (Enter generates)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Full clipboard copy (exact operational format)
  const handleCopyAll = useCallback(() => {
    if (!middleGeneratedSets || middleGeneratedSets.length === 0) return;

    const formatted = formatSetsForClipboard(
      middleGeneratedSets,
      middleVerificationStatus === 'verified'
    );

    navigator.clipboard.writeText(formatted).then(
      () => {
        setCopyMessage(`Copied ${middleGeneratedSets.length} sets to clipboard!`);
        setCopySuccess(true);
      },
      () => {
        setCopyMessage('Failed to copy to clipboard.');
        setCopySuccess(true);
      }
    );
  }, [middleGeneratedSets, middleVerificationStatus]);

  // Copy single set
  const handleCopySingleSet = useCallback((set) => {
    const lines = [`${set.setNumber}\n`];
    set.rows.forEach((row) => {
      lines.push(`${String(row.prize).padEnd(7, ' ')}${row.start} - ${row.end}`);
    });
    const text = lines.join('\n');

    navigator.clipboard.writeText(text).then(
      () => {
        setCopyMessage(`Copied Set ${set.setNumber} to clipboard!`);
        setCopySuccess(true);
      },
      () => {
        setCopyMessage('Failed to copy.');
        setCopySuccess(true);
      }
    );
  }, []);

  const hasResults = middleGeneratedSets.length > 0;
  const isVerified = middleVerificationStatus === 'verified';

  // Memoized formatted text for raw preview
  const formattedRawText = useMemo(() => {
    if (!hasResults) return '';
    return formatSetsForClipboard(middleGeneratedSets, isVerified);
  }, [middleGeneratedSets, isVerified, hasResults]);

  return (
    <Container
      maxWidth="xl"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={<FormatListNumberedIcon fontSize="inherit" />}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title="Middle Numbers"
        subtitle="Generate and verify operational 8-row lottery prize sets"
        breadcrumb="Middle Numbers"
      />

      {/* ── Control Bar ──────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: '16px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          {/* Input and Quick Presets */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Sets to Generate"
              type="number"
              size="medium"
              value={middleSetCount}
              onChange={(e) => {
                setMiddleSetCount(e.target.value);
                setInputError('');
              }}
              onKeyDown={handleKeyDown}
              error={Boolean(inputError)}
              helperText={inputError || (maxAvailableSets < 12 ? `Max ${maxAvailableSets} sets (${excludedCodeSet?.size || 0} codes excluded)` : '')}
              inputProps={{ min: 1, max: maxAvailableSets, step: 1, 'aria-label': 'Number of sets to generate' }}
              sx={{
                width: { xs: '100%', sm: 200 },
                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: ACCENT },
                '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
              }}
            />

            {/* Presets */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                Quick:
              </Typography>
              {presetList.map((preset) => (
                <Chip
                  key={preset}
                  label={`${preset} Set${preset > 1 ? 's' : ''}`}
                  size="small"
                  clickable
                  onClick={() => {
                    setMiddleSetCount(String(preset));
                    setInputError('');
                  }}
                  variant={middleSetCount === String(preset) ? 'filled' : 'outlined'}
                  sx={{
                    borderColor: ACCENT_BORDER,
                    background: middleSetCount === String(preset) ? ACCENT_BG : 'transparent',
                    color: middleSetCount === String(preset) ? '#fff' : tokens.textSecondary,
                    fontWeight: 600,
                    '&:hover': { background: ACCENT_BG, borderColor: ACCENT },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={
                middleIsGenerating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoAwesomeIcon />
                )
              }
              onClick={handleGenerate}
              disabled={middleIsGenerating}
              sx={{
                minWidth: 160,
                background: `linear-gradient(135deg, ${ACCENT}, #7D3C98)`,
                color: '#fff',
                fontWeight: 700,
                '&:hover': {
                  background: `linear-gradient(135deg, #7D3C98, ${ACCENT})`,
                  boxShadow: '0 4px 18px rgba(142,68,173,0.38)',
                },
              }}
            >
              {middleIsGenerating ? 'Generating…' : 'Generate Sets'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyAll}
              disabled={!hasResults}
              sx={{
                minWidth: 150,
                borderColor: tokens.goldBorder,
                color: tokens.gold,
                fontWeight: 700,
                '&:hover': {
                  borderColor: tokens.gold,
                  background: `${tokens.gold}18`,
                },
              }}
            >
              Copy Number
            </Button>

            {hasResults && (
              <Tooltip title="Reset Middle Numbers">
                <IconButton
                  onClick={resetMiddleNumbers}
                  size="large"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: tokens.crimson, background: 'rgba(231,76,60,0.1)' },
                  }}
                >
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* ── Status Banners ───────────────────────────────────────────── */}
      {isVerified && (
        <Alert
          severity="success"
          icon={<VerifiedIcon fontSize="inherit" />}
          sx={{
            mb: 3,
            background: 'rgba(46,204,113,0.12)',
            border: '1px solid rgba(46,204,113,0.3)',
            borderRadius: '12px',
          }}
        >
          <strong>NEW {middleGeneratedSets.length} SETS (Verified)</strong> — Successfully generated{' '}
          <strong>{middleGeneratedSets.length * 8}</strong> total prize blocks across{' '}
          <strong>{middleGeneratedSets.length}</strong> independent sets. All 2-digit middle numbers are strictly unique with zero duplicates and zero overlapping ranges.
        </Alert>
      )}

      {middleVerificationStatus === 'failed' && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            background: 'rgba(231,76,60,0.12)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: '12px',
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>
            Set Generation / Verification Failed
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {middleVerificationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* ── Results Container ────────────────────────────────────────── */}
      {!hasResults ? (
        <Paper
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${tokens.border}`,
            borderRadius: '16px',
          }}
        >
          <FormatListNumberedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700} gutterBottom>
            No Middle Number Sets Generated Yet
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 460, mx: 'auto', mb: 3 }}>
            Choose how many sets you need (e.g. 5) and click <strong>Generate Sets</strong>. Each set contains 8 verified prize denomination ranges (200, 100, 50, 25, 10, 10, 5, 5).
          </Typography>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGenerate}
            sx={{
              background: `linear-gradient(135deg, ${ACCENT}, #7D3C98)`,
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Generate {Math.min(5, maxAvailableSets)} Sets Now
          </Button>
        </Paper>
      ) : (
        <Box>
          {/* View Mode Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: ACCENT },
                '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600 },
                '& .MuiTab-root.Mui-selected': { color: ACCENT },
              }}
            >
              <Tab icon={<DashboardCustomizeIcon fontSize="small" />} iconPosition="start" label="Visual Sets" />
              <Tab icon={<TerminalIcon fontSize="small" />} iconPosition="start" label="Raw Dealer Text" />
            </Tabs>

            <Typography variant="caption" color="text.secondary">
              Total: <strong>{middleGeneratedSets.length} Sets</strong> ({middleGeneratedSets.length * 8} ranges)
            </Typography>
          </Box>

          {/* TAB 0: Visual Cards */}
          {activeTab === 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fit, minmax(360px, 1fr))' },
                gap: 2.5,
              }}
            >
              {middleGeneratedSets.map((set) => (
                <Paper
                  key={set.setNumber}
                  sx={{
                    p: 2.5,
                    background: 'rgba(255,255,255,0.025)',
                    border: `1px solid ${ACCENT_BORDER}`,
                    borderRadius: '16px',
                    transition: 'border-color 0.2s ease, transform 0.2s ease',
                    '&:hover': {
                      borderColor: ACCENT,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  {/* Set Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 1.5,
                      borderBottom: `1px solid ${tokens.border}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          background: ACCENT_BG,
                          border: `1px solid ${ACCENT_BORDER}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: ACCENT,
                          fontWeight: 800,
                          fontSize: '0.95rem',
                        }}
                      >
                        {set.setNumber}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#fff' }}>
                        SET {set.setNumber}
                      </Typography>
                      {isVerified && (
                        <Chip
                          label="Verified"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            background: 'rgba(46,204,113,0.15)',
                            color: tokens.success,
                            border: '1px solid rgba(46,204,113,0.3)',
                          }}
                        />
                      )}
                    </Box>

                    <Tooltip title={`Copy Set ${set.setNumber}`}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopySingleSet(set)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: ACCENT, background: ACCENT_BG },
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Set Rows */}
                  <Stack spacing={1}>
                    {set.rows.map((row, rIdx) => {
                      const badgeColor = PRIZE_COLORS[row.prize] || ACCENT;
                      return (
                        <Box
                          key={`${row.id}-${rIdx}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 1.5,
                            py: 0.8,
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.04)',
                            },
                          }}
                        >
                          {/* Prize Denomination */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 44,
                                height: 26,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                background: `${badgeColor}18`,
                                border: `1px solid ${badgeColor}55`,
                                color: badgeColor,
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                lineHeight: 1,
                              }}
                            >
                              {row.prize}
                            </Box>

                            {/* Middle Number Badge and Prefix */}
                            <Tooltip title={`2-digit Middle: ${row.middle || row.prefix.slice(1)} | Prefix: ${row.prefix}`}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Chip
                                  label={`Mid ${row.middle || row.prefix.slice(1)}`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    background: 'rgba(142,68,173,0.18)',
                                    color: '#D7BDE2',
                                    border: '1px solid rgba(142,68,173,0.35)',
                                    cursor: 'help',
                                  }}
                                />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    color: 'text.disabled',
                                    fontSize: '0.72rem',
                                  }}
                                >
                                  #{row.prefix}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Box>

                          {/* Range Box */}
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: 28,
                              px: 1.5,
                              borderRadius: '6px',
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${tokens.border}`,
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: '#fff',
                              letterSpacing: 0,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {row.start} - {row.end}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}

          {/* TAB 1: Raw Operational Dealer Text */}
          {activeTab === 1 && (
            <Paper
              sx={{
                p: 3,
                background: '#0a0a14',
                border: `1px solid ${ACCENT_BORDER}`,
                borderRadius: '16px',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="overline" color={ACCENT}>
                  Raw Clipboard Text Format
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyAll}
                  sx={{
                    borderColor: ACCENT_BORDER,
                    color: ACCENT,
                    '&:hover': { borderColor: ACCENT, background: ACCENT_BG },
                  }}
                >
                  Copy All Text
                </Button>
              </Box>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2.5,
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.5)',
                  border: `1px solid ${tokens.border}`,
                  color: '#e0e0e0',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {formattedRawText}
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* ── Copy Notification Toast ──────────────────────────────────── */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2500}
        onClose={() => setCopySuccess(false)}
        message={copyMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
