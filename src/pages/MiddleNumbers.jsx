import React, { useState, useCallback, useMemo } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import useLotteryStore from '../store/useLotteryStore';
import { computeMiddleNumbers } from '../utils/numberParser';
import PageHeader from '../components/PageHeader';
import { tokens } from '../theme';

const ACCENT  = tokens.purple;
const ACCENT_BG     = 'rgba(142,68,173,0.12)';
const ACCENT_BORDER = 'rgba(142,68,173,0.22)';

export default function MiddleNumbers() {
  const {
    middleRangeStart, middleRangeEnd, middleNumbers,
    setMiddleRangeStart, setMiddleRangeEnd, setMiddleNumbers,
  } = useLotteryStore();

  const [count, setCount]   = useState(10);
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState('');

  const handleCompute = useCallback(() => {
    setError('');
    const s = parseInt(middleRangeStart, 10);
    const e = parseInt(middleRangeEnd, 10);

    if (isNaN(s) || isNaN(e)) {
      setError('Please enter valid numbers for both Start and End.');
      return;
    }
    if (s > e) {
      setError('Start must be less than or equal to End.');
      return;
    }
    if (e - s > 1_000_000) {
      setError('Range too large. Maximum range is 1,000,000.');
      return;
    }

    const result = computeMiddleNumbers(s, e, count);
    setMiddleNumbers(result);
  }, [middleRangeStart, middleRangeEnd, count, setMiddleNumbers]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCompute();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(middleNumbers.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const midpoint = useMemo(() => {
    const s = parseInt(middleRangeStart, 10);
    const e = parseInt(middleRangeEnd, 10);
    if (!isNaN(s) && !isNaN(e) && s <= e) return Math.floor((s + e) / 2);
    return null;
  }, [middleRangeStart, middleRangeEnd]);

  const rangeSize = useMemo(() => {
    const s = parseInt(middleRangeStart, 10);
    const e = parseInt(middleRangeEnd, 10);
    if (!isNaN(s) && !isNaN(e) && s <= e) return e - s + 1;
    return null;
  }, [middleRangeStart, middleRangeEnd]);

  const hasNumbers = middleNumbers.length > 0;
  const canCompute = middleRangeStart && middleRangeEnd;

  return (
    <Container
      maxWidth="lg"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={<FormatListNumberedIcon fontSize="inherit" />}
        iconBg={ACCENT_BG}
        iconColor={ACCENT}
        title="Middle Numbers"
        subtitle="Compute the center numbers of any lottery range"
        breadcrumb="Middle Numbers"
      />

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '320px 1fr' },
          gap: { xs: 2.5, sm: 3 },
          alignItems: 'start',
        }}
      >
        {/* ── Left: Configuration ─────────────────────────────────────── */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3 },
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${ACCENT_BORDER}`,
          }}
        >
          <Typography variant="overline" sx={{ color: ACCENT, mb: 2.5, display: 'block' }}>
            Range Configuration
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Range inputs */}
            <TextField
              label="Range Start"
              type="number"
              fullWidth
              value={middleRangeStart}
              onChange={(e) => { setMiddleRangeStart(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              inputProps={{ min: 0, 'aria-label': 'Range start number' }}
              sx={{
                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: ACCENT },
                '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
              }}
            />
            <TextField
              label="Range End"
              type="number"
              fullWidth
              value={middleRangeEnd}
              onChange={(e) => { setMiddleRangeEnd(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              inputProps={{ min: 0, 'aria-label': 'Range end number' }}
              sx={{
                '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: ACCENT },
                '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
              }}
            />

            {/* Range stats preview */}
            {midpoint !== null && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    background: ACCENT_BG,
                    border: `1px solid ${ACCENT_BORDER}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Midpoint
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: ACCENT, fontSize: '1rem' }}>
                    {midpoint.toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${tokens.border}`,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Range Size
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: tokens.textSecondary, fontSize: '1rem' }}>
                    {rangeSize.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Count slider */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary" id="count-label">
                  Count of middle numbers
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: '20px',
                    background: ACCENT_BG,
                    border: `1px solid ${ACCENT_BORDER}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: ACCENT, fontWeight: 700 }}>
                    {count}
                  </Typography>
                </Box>
              </Box>
              <Slider
                value={count}
                onChange={(_, v) => setCount(v)}
                min={2}
                max={50}
                step={2}
                aria-labelledby="count-label"
                sx={{ color: ACCENT }}
              />
            </Box>

            {/* Error */}
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Compute button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<AutoFixHighIcon />}
              onClick={handleCompute}
              disabled={!canCompute}
              sx={{
                background: `linear-gradient(135deg, ${ACCENT}, #7D3C98)`,
                color: '#fff',
                fontWeight: 700,
                '&:hover': {
                  background: `linear-gradient(135deg, #7D3C98, ${ACCENT})`,
                  boxShadow: `0 4px 18px rgba(142,68,173,0.38)`,
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': {
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.28)',
                },
              }}
            >
              Compute
            </Button>
          </Box>
        </Paper>

        {/* ── Right: Results ───────────────────────────────────────────── */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3 },
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${ACCENT_BORDER}`,
            minHeight: { xs: 240, md: 380 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: hasNumbers ? 2 : 0,
            }}
          >
            <Typography variant="overline" sx={{ color: ACCENT }}>
              Result
              {hasNumbers && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.2,
                    borderRadius: '20px',
                    background: ACCENT_BG,
                    fontSize: '0.65rem',
                    border: `1px solid ${ACCENT_BORDER}`,
                  }}
                >
                  {middleNumbers.length} numbers
                </Box>
              )}
            </Typography>

            {hasNumbers && (
              <Tooltip title={copied ? 'Copied!' : 'Copy all as comma-separated'}>
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  aria-label={copied ? 'Copied' : 'Copy results'}
                  sx={{
                    color: copied ? tokens.success : 'text.secondary',
                    '&:hover': { color: ACCENT, background: ACCENT_BG },
                  }}
                >
                  {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Empty state */}
          {!hasNumbers ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flexGrow: 1,
                py: 6,
                opacity: 0.38,
                gap: 1.5,
              }}
            >
              <FormatListNumberedIcon sx={{ fontSize: 52, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Enter a range and click <strong>Compute</strong>
              </Typography>
            </Box>
          ) : (
            <>
              {/* Summary */}
              <Alert severity="info" sx={{ mb: 2.5, borderColor: ACCENT_BORDER }}>
                Middle <strong>{middleNumbers.length}</strong> numbers from{' '}
                <strong>{parseInt(middleRangeStart).toLocaleString()}</strong> to{' '}
                <strong>{parseInt(middleRangeEnd).toLocaleString()}</strong>
              </Alert>

              <Divider sx={{ mb: 2 }} />

              {/* Number chips */}
              <Box
                sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignContent: 'flex-start' }}
              >
                {middleNumbers.map((num, i) => {
                  const isMid =
                    i === Math.floor(middleNumbers.length / 2) - 1 ||
                    i === Math.floor(middleNumbers.length / 2);
                  return (
                    <Chip
                      key={i}
                      label={num.toLocaleString()}
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: isMid ? 800 : 600,
                        fontSize: isMid ? '0.9rem' : '0.82rem',
                        height: isMid ? 34 : 28,
                        background: isMid ? 'rgba(142,68,173,0.30)' : ACCENT_BG,
                        color: isMid ? '#D7BDE2' : '#C39BD3',
                        border: isMid
                          ? '1px solid rgba(142,68,173,0.55)'
                          : `1px solid ${ACCENT_BORDER}`,
                        borderRadius: '8px',
                        boxShadow: isMid
                          ? `0 0 10px rgba(142,68,173,0.35)`
                          : 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          background: 'rgba(142,68,173,0.25)',
                          transform: 'scale(1.04)',
                        },
                      }}
                    />
                  );
                })}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
