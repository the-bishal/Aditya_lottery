import React, { useState, useRef, useCallback } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import useLotteryStore from '../store/useLotteryStore';
import { runOCR } from '../utils/ocrScanner';
import { cleanOCRText } from '../utils/numberParser';
import PageHeader from '../components/PageHeader';
import { tokens } from '../theme';

export default function Hardcopy() {
  const {
    hardcopyNumbers, setHardcopyNumbers,
    hardcopyImageURL, setHardcopyImageURL,
    hardcopyOcrProgress, setHardcopyOcrProgress,
    hardcopyOcrStatus, setHardcopyOcrStatus,
  } = useLotteryStore();

  const [dragOver, setDragOver]     = useState(false);
  const [copied, setCopied]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef                = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setHardcopyImageURL(url);
    setHardcopyOcrStatus('scanning');
    setHardcopyOcrProgress(0);

    try {
      const rawText = await runOCR(file, (p) => setHardcopyOcrProgress(p));
      const cleaned = cleanOCRText(rawText);
      setHardcopyNumbers(cleaned);
      setHardcopyOcrStatus('done');
    } catch {
      setHardcopyOcrStatus('error');
    }
  }, [setHardcopyImageURL, setHardcopyOcrStatus, setHardcopyOcrProgress, setHardcopyNumbers]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    processFile(e.target.files?.[0]);
  }, [processFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(hardcopyNumbers.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setHardcopyNumbers([]);
    setHardcopyImageURL(null);
    setHardcopyOcrStatus('idle');
  };

  const filtered = searchTerm
    ? hardcopyNumbers.filter((n) => n.includes(searchTerm))
    : hardcopyNumbers;

  const hasNumbers = hardcopyNumbers.length > 0;
  const accentColor = tokens.crimson;
  const accentBorder = 'rgba(192,57,43,0.20)';
  const accentBg = 'rgba(192,57,43,0.10)';

  return (
    <Container
      maxWidth="lg"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={<ImageSearchIcon fontSize="inherit" />}
        iconBg="rgba(192,57,43,0.12)"
        iconColor={tokens.crimson}
        title="Hardcopy Numbers"
        subtitle="Scan printed ticket images and extract all numbers digitally"
        breadcrumb="Hardcopy Numbers"
      />

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
          gap: { xs: 2.5, sm: 3 },
          alignItems: 'start',
        }}
      >
        {/* ── Left: Upload panel ────────────────────────────────────────── */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3 },
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${accentBorder}`,
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: accentColor, mb: 2, display: 'block' }}
          >
            Upload Image
          </Typography>

          {/* Drop zone */}
          <Box
            role="button"
            tabIndex={0}
            aria-label="Upload hardcopy image. Click or drag and drop."
            className={dragOver ? 'drop-zone-active' : ''}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
            sx={{
              border: '2px dashed rgba(192,57,43,0.30)',
              borderRadius: '12px',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              cursor: 'pointer',
              minHeight: 160,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'rgba(192,57,43,0.55)',
                background: accentBg,
              },
              '&:focus-visible': {
                outline: `2px solid ${accentColor}`,
                outlineOffset: '2px',
              },
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileSelect}
              aria-hidden="true"
            />
            {hardcopyImageURL ? (
              <Box
                component="img"
                src={hardcopyImageURL}
                alt="Uploaded hardcopy ticket"
                sx={{
                  maxHeight: 200,
                  maxWidth: '100%',
                  borderRadius: '10px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 40, color: accentColor, opacity: 0.7 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Drop hardcopy image or{' '}
                    <Box component="span" sx={{ color: accentColor, fontWeight: 700 }}>
                      browse
                    </Box>
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 0.3, display: 'block' }}>
                    JPG, PNG, WEBP
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          {/* OCR Progress */}
          {hardcopyOcrStatus === 'scanning' && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                  Scanning image…
                </Typography>
                <Typography variant="caption" sx={{ color: accentColor, fontWeight: 700 }}>
                  {hardcopyOcrProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={hardcopyOcrProgress}
                sx={{ '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${accentColor}, ${tokens.crimsonLight})` } }}
              />
            </Box>
          )}

          {/* Status messages */}
          {hardcopyOcrStatus === 'done' && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Extracted <strong>{hardcopyNumbers.length}</strong> numbers
            </Alert>
          )}
          {hardcopyOcrStatus === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Scan failed. Try a clearer image.
            </Alert>
          )}

          {/* Reset button */}
          {hasNumbers && (
            <Button
              startIcon={<RefreshIcon />}
              color="secondary"
              size="small"
              fullWidth
              onClick={handleReset}
              sx={{ mt: 2 }}
            >
              Clear &amp; Rescan
            </Button>
          )}
        </Paper>

        {/* ── Right: Results panel ─────────────────────────────────────── */}
        <Paper
          sx={{
            p: { xs: 2.5, sm: 3 },
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${accentBorder}`,
            minHeight: { xs: 260, md: 360 },
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
            <Typography variant="overline" sx={{ color: accentColor }}>
              Extracted Numbers
              {filtered.length > 0 && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.2,
                    borderRadius: '20px',
                    background: accentBg,
                    color: accentColor,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    border: `1px solid ${accentBorder}`,
                  }}
                >
                  {filtered.length}
                </Box>
              )}
            </Typography>

            {hasNumbers && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title={copied ? 'Copied!' : 'Copy all numbers'}>
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy all numbers'}
                    sx={{
                      color: copied ? tokens.success : 'text.secondary',
                      '&:hover': { color: copied ? tokens.success : 'primary.main', background: tokens.goldMuted },
                    }}
                  >
                    {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print">
                  <IconButton
                    size="small"
                    onClick={() => window.print()}
                    aria-label="Print extracted numbers"
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { color: 'primary.main', background: tokens.goldMuted },
                    }}
                  >
                    <PrintIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          {/* Search */}
          {hasNumbers && (
            <TextField
              size="small"
              fullWidth
              placeholder="Search number…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              inputProps={{ 'aria-label': 'Search extracted numbers' }}
              sx={{ mb: 2 }}
            />
          )}

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
              <ImageSearchIcon sx={{ fontSize: 52, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Upload an image to extract numbers
              </Typography>
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                No numbers match &ldquo;{searchTerm}&rdquo;
              </Typography>
            </Box>
          ) : (
            <Box
              className="number-list-scroll"
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignContent: 'flex-start' }}
            >
              {filtered.map((num, i) => (
                <Chip
                  key={`${num}-${i}`}
                  label={num}
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    height: 30,
                    background: accentBg,
                    color: tokens.crimsonLight,
                    border: `1px solid rgba(192,57,43,0.28)`,
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      background: 'rgba(192,57,43,0.20)',
                      borderColor: 'rgba(192,57,43,0.45)',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}
