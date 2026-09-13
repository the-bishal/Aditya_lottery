import React, { useState, useRef, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';

import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import useLotteryStore from '../store/useLotteryStore';
import NumberRow from './NumberRow';
import { parseRangeString, cleanOCRText, filterNumbers } from '../utils/numberParser';
import { runOCR } from '../utils/ocrScanner';
import { captureElement } from '../utils/imageGenerator';
import { tokens } from '../theme';

const STEPS = ['Exclude Numbers', 'Scan & Assign Ranks', 'Generate Result'];

// ── Shared step content wrapper ──────────────────────────────────────────────
function StepContent({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        animation: 'fadeInUp 0.25s ease both',
      }}
    >
      {children}
    </Box>
  );
}

// ── Step 1: Exclusion ─────────────────────────────────────────────────────────
function StepExclude({ onNext }) {
  const { excludedRangeText, setExcludedRangeText, applyExclusions, excludedSet } =
    useLotteryStore();
  const [processing, setProcessing] = useState(false);
  const [applied, setApplied]       = useState(false);

  const handleApply = useCallback(async () => {
    setProcessing(true);
    setApplied(false);

    const worker = new Worker(
      new URL('../workers/numberWorker.js', import.meta.url),
      { type: 'module' }
    );

    worker.postMessage({ type: 'PARSE_RANGES', payload: { text: excludedRangeText } });

    worker.onmessage = (e) => {
      if (e.data.type === 'PARSE_RANGES_DONE') {
        applyExclusions(new Set(e.data.result));
        worker.terminate();
        setProcessing(false);
        setApplied(true);
      }
    };

    worker.onerror = () => {
      applyExclusions(parseRangeString(excludedRangeText));
      worker.terminate();
      setProcessing(false);
      setApplied(true);
    };
  }, [excludedRangeText, applyExclusions]);

  return (
    <StepContent>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Paste number ranges or individual numbers to{' '}
          <Box component="strong" sx={{ color: tokens.textPrimary }}>exclude</Box>{' '}
          from the result.
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
          Formats: <code>100-200</code> &nbsp; <code>305</code> &nbsp; <code>410-420, 500-510</code> &nbsp; comma or newline separated
        </Typography>
      </Box>

      <TextField
        label="Excluded Ranges"
        multiline
        rows={6}
        fullWidth
        value={excludedRangeText}
        onChange={(e) => { setExcludedRangeText(e.target.value); setApplied(false); }}
        placeholder={'100-200\n305\n410-420, 500-510'}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
              <FilterAltIcon sx={{ color: tokens.gold, fontSize: 18, opacity: 0.7 }} />
            </InputAdornment>
          ),
        }}
        inputProps={{ 'aria-label': 'Enter number ranges to exclude' }}
        sx={{
          '& textarea': {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.875rem',
            lineHeight: 1.8,
          },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={
            processing
              ? <CircularProgress size={14} color="inherit" />
              : <FilterAltIcon />
          }
          onClick={handleApply}
          disabled={processing || !excludedRangeText.trim()}
          sx={{ minWidth: 152 }}
        >
          {processing ? 'Processing…' : 'Extract & Apply'}
        </Button>

        {applied && (
          <Chip
            icon={<CheckCircleIcon />}
            label={`${excludedSet.size.toLocaleString()} numbers excluded`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {applied && (
        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
          Exclusion set applied. These numbers will be filtered out in Step 2.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          sx={{ minWidth: 110 }}
        >
          Next
        </Button>
      </Box>
    </StepContent>
  );
}

// ── Step 2: OCR & Rank Assignment ─────────────────────────────────────────────
function StepNumbers({ onNext, onBack }) {
  const {
    parsedNumbers, setParsedNumbers, addNumber,
    uploadedImageURL, setUploadedImageURL,
    ocrProgress, ocrStatus, setOcrProgress, setOcrStatus,
    excludedSet, clearNumbers,
  } = useLotteryStore();

  const [dragOver, setDragOver]   = useState(false);
  const [manualNum, setManualNum] = useState('');
  const fileInputRef              = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    setUploadedImageURL(url);
    setOcrStatus('scanning');
    setOcrProgress(0);

    try {
      const rawText = await runOCR(file, (p) => setOcrProgress(p));
      const cleaned = cleanOCRText(rawText);
      const filtered = filterNumbers(cleaned, excludedSet);

      const numbered = filtered.map((n, i) => ({
        id: Date.now() + i,
        number: n,
        rank: '',
      }));

      setParsedNumbers(numbered);
      setOcrStatus('done');
    } catch (err) {
      console.error('OCR error:', err);
      setOcrStatus('error');
    }
  }, [excludedSet, setUploadedImageURL, setOcrStatus, setOcrProgress, setParsedNumbers]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleAddManual = useCallback(() => {
    if (manualNum.trim()) {
      addNumber(manualNum.trim());
      setManualNum('');
    }
  }, [manualNum, addNumber]);

  const numberList = useMemo(() => parsedNumbers, [parsedNumbers]);

  return (
    <StepContent>
      {/* Drop zone */}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Upload lottery ticket image. Click or drag and drop."
        className={dragOver ? 'drop-zone-active' : ''}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        sx={{
          border: '2px dashed rgba(245,197,24,0.25)',
          borderRadius: '12px',
          p: { xs: 3, sm: 3.5 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          cursor: 'pointer',
          minHeight: 150,
          transition: 'all 0.2s ease',
          background: dragOver ? tokens.goldMuted : 'rgba(255,255,255,0.015)',
          '&:hover': {
            borderColor: 'rgba(245,197,24,0.45)',
            background: tokens.goldMuted,
          },
          '&:focus-visible': {
            outline: `2px solid ${tokens.gold}`,
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
        {uploadedImageURL ? (
          <Box
            component="img"
            src={uploadedImageURL}
            alt="Uploaded lottery ticket"
            sx={{
              maxHeight: 180,
              maxWidth: '100%',
              borderRadius: '10px',
              objectFit: 'contain',
            }}
          />
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 40, color: tokens.gold, opacity: 0.65 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Drag &amp; drop a lottery ticket image, or{' '}
                <Box component="span" sx={{ color: tokens.gold, fontWeight: 700 }}>
                  click to browse
                </Box>
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
                Supports JPG, PNG, WEBP
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* OCR Progress */}
      {ocrStatus === 'scanning' && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              Scanning image with OCR…
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.gold, fontWeight: 700 }}>
              {ocrProgress}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={ocrProgress} />
        </Box>
      )}

      {ocrStatus === 'done' && (
        <Alert severity="success">
          Found <strong>{parsedNumbers.length}</strong> numbers.
          {excludedSet.size > 0 && (
            <> ({excludedSet.size.toLocaleString()} excluded numbers filtered out)</>
          )}
        </Alert>
      )}
      {ocrStatus === 'error' && (
        <Alert severity="error">
          OCR failed. Try a clearer image or add numbers manually below.
        </Alert>
      )}

      {/* Number list */}
      {numberList.length > 0 && (
        <Paper
          sx={{
            p: 2,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${tokens.border}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ color: tokens.gold, fontWeight: 700 }}>
              {numberList.length} Numbers
            </Typography>
            <Button
              size="small"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={clearNumbers}
              sx={{ fontSize: '0.75rem', py: 0.4 }}
            >
              Clear All
            </Button>
          </Box>

          <Box className="number-list-scroll">
            {numberList.map((item, idx) => (
              <NumberRow
                key={item.id}
                id={item.id}
                number={item.number}
                rank={item.rank}
                index={idx}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Manual add */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          label="Add number manually"
          value={manualNum}
          onChange={(e) => setManualNum(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
          sx={{ flexGrow: 1 }}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', 'aria-label': 'Enter a number to add manually' }}
        />
        <Button
          variant="outlined"
          onClick={handleAddManual}
          disabled={!manualNum.trim()}
          startIcon={<AddIcon />}
          sx={{ flexShrink: 0 }}
        >
          Add
        </Button>
      </Box>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          disabled={numberList.length === 0}
        >
          Next
        </Button>
      </Box>
    </StepContent>
  );
}

// ── Step 3: Generate Result ────────────────────────────────────────────────────
function StepGenerate({ onBack }) {
  const {
    parsedNumbers, resultTitle, setResultTitle,
    resultDate, setResultDate, setResultImageURL, resultImageURL,
  } = useLotteryStore();

  const previewRef          = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [captured, setCaptured] = useState(false);

  const RANK_ORDER = ['1st', '2nd', '3rd', '4th', '5th', 'consolation', 'Unranked'];
  const RANK_COLORS = {
    '1st': '#FFD700', '2nd': '#C0C0C0', '3rd': '#CD7F32',
    '4th': '#F5C518', '5th': '#F5C518', consolation: '#9B59B6',
    Unranked: '#6C757D',
  };

  const grouped = useMemo(() => {
    const map = {};
    parsedNumbers.forEach((n) => {
      const key = n.rank || 'Unranked';
      if (!map[key]) map[key] = [];
      map[key].push(n.number);
    });
    return map;
  }, [parsedNumbers]);

  const handleGenerate = async () => {
    setLoading(true);
    setCaptured(false);
    try {
      const url = await captureElement(previewRef.current);
      setResultImageURL(url);
      setCaptured(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImageURL) return;
    const link = document.createElement('a');
    link.href     = resultImageURL;
    link.download = `${(resultTitle || 'result').replace(/\s+/g, '_')}_${resultDate || 'result'}.png`;
    link.click();
  };

  // Format date for display
  const formattedDate = useMemo(() => {
    if (!resultDate) return '';
    try {
      return new Date(resultDate).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch { return resultDate; }
  }, [resultDate]);

  return (
    <StepContent>
      {/* Configuration row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 2 }}>
        <TextField
          label="Result Title"
          value={resultTitle}
          onChange={(e) => setResultTitle(e.target.value)}
          fullWidth
          inputProps={{ 'aria-label': 'Result title' }}
        />
        <TextField
          label="Draw Date"
          type="date"
          value={resultDate}
          onChange={(e) => setResultDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          inputProps={{ 'aria-label': 'Draw date' }}
          sx={{ minWidth: 160 }}
        />
      </Box>

      {/* Result preview card (captured by html2canvas) */}
      <Paper
        ref={previewRef}
        elevation={0}
        sx={{
          background: 'linear-gradient(145deg, #0D0D1A 0%, #121228 55%, #1A1A38 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(245,197,24,0.28)',
          p: { xs: 2.5, sm: 4 },
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <EmojiEventsIcon sx={{ color: tokens.gold, fontSize: 30 }} />
            <Typography
              component="h2"
              sx={{
                fontWeight: 800,
                background: `linear-gradient(90deg, ${tokens.gold}, ${tokens.goldLight}, ${tokens.gold})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '1.3rem', sm: '1.7rem' },
                lineHeight: 1.2,
              }}
            >
              {resultTitle || 'Lottery Result'}
            </Typography>
          </Box>
          {resultDate && (
            <Typography variant="body2" color="text.secondary">
              Draw Date:{' '}
              <Box component="strong" sx={{ color: tokens.textPrimary }}>
                {formattedDate}
              </Box>
            </Typography>
          )}
          <Divider sx={{ mt: 2, borderColor: 'rgba(245,197,24,0.20)' }} />
        </Box>

        {/* Results by rank */}
        {parsedNumbers.length === 0 ? (
          <Typography variant="body2" color="text.disabled" textAlign="center" py={3}>
            No numbers assigned yet.
          </Typography>
        ) : (
          RANK_ORDER.filter((r) => grouped[r]?.length).map((rankKey) => (
            <Box key={rankKey} sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: RANK_COLORS[rankKey] || tokens.gold,
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: RANK_COLORS[rankKey] || tokens.gold,
                    textTransform: 'capitalize',
                    letterSpacing: '0.02em',
                  }}
                >
                  {rankKey === 'consolation' ? 'Consolation Prize' : `${rankKey} Prize`}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, pl: 2.5 }}>
                {grouped[rankKey].map((num) => (
                  <Chip
                    key={num}
                    label={num}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.83rem',
                      height: 26,
                      background: `${RANK_COLORS[rankKey]}1A`,
                      color: RANK_COLORS[rankKey] || tokens.gold,
                      border: `1px solid ${RANK_COLORS[rankKey]}44`,
                      borderRadius: '6px',
                    }}
                  />
                ))}
              </Box>
            </Box>
          ))
        )}

        {/* Footer */}
        <Divider sx={{ mt: 2, mb: 1.5, borderColor: 'rgba(245,197,24,0.12)' }} />
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Generated by Aditya Lottery Admin Dashboard
        </Typography>
      </Paper>

      {/* Captured image preview */}
      {captured && resultImageURL && (
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Generated preview:
          </Typography>
          <Box
            component="img"
            src={resultImageURL}
            alt="Generated result"
            sx={{
              maxWidth: '100%',
              borderRadius: '12px',
              border: `1px solid ${tokens.border}`,
            }}
          />
        </Box>
      )}

      {/* Action buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleGenerate}
          disabled={loading || parsedNumbers.length === 0}
          sx={{ minWidth: 150 }}
        >
          {loading ? 'Capturing…' : 'Generate Image'}
        </Button>

        {captured && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download PNG
          </Button>
        )}
      </Stack>

      {captured && (
        <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
          Result image generated! Click <strong>Download PNG</strong> to save.
        </Alert>
      )}

      <Box sx={{ pt: 1 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back
        </Button>
      </Box>
    </StepContent>
  );
}

// ── Custom Step Icon ──────────────────────────────────────────────────────────
function CustomStepIcon({ active, completed, icon }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: completed
          ? 'linear-gradient(135deg, #27AE60, #2ECC71)'
          : active
          ? `linear-gradient(135deg, ${tokens.gold}, ${tokens.goldLight})`
          : 'rgba(255,255,255,0.07)',
        border: completed || active ? 'none' : `1px solid ${tokens.border}`,
        color: completed || active ? '#0D0D1A' : tokens.textMuted,
        fontWeight: 700,
        fontSize: '0.8rem',
        transition: 'all 0.3s ease',
        boxShadow: active ? `0 0 14px rgba(245,197,24,0.35)` : 'none',
        flexShrink: 0,
      }}
    >
      {completed ? '✓' : icon}
    </Box>
  );
}

// ── Main Stepper Shell ────────────────────────────────────────────────────────
export default function StepperComponent() {
  const [activeStep, setActiveStep] = useState(0);

  const next = () => setActiveStep((s) => s + 1);
  const back = () => setActiveStep((s) => s - 1);

  return (
    <Box>
      {/* ── Stepper header — always horizontal ── */}
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{ mb: { xs: 3, sm: 4 } }}
      >
        {STEPS.map((label, i) => (
          <Step key={label} completed={activeStep > i}>
            <StepLabel
              StepIconComponent={(props) => (
                <CustomStepIcon {...props} icon={i + 1} />
              )}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: activeStep === i ? 700 : 500,
                  color:
                    activeStep > i
                      ? tokens.success
                      : activeStep === i
                      ? tokens.gold
                      : tokens.textMuted,
                  fontSize: { xs: '0.7rem', sm: '0.78rem' },
                  display: { xs: 'none', sm: 'block' }, // hide labels on mobile to save space
                }}
              >
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ── Step content panel ── */}
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          background: 'rgba(255,255,255,0.025)',
          border: `1px solid ${tokens.border}`,
        }}
      >
        {/* Mobile step title */}
        <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1, mb: 2.5 }}>
          <Box
            sx={{
              px: 1.2,
              py: 0.25,
              borderRadius: '20px',
              background: tokens.goldMuted,
              border: `1px solid ${tokens.goldBorder}`,
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.gold, fontWeight: 700 }}>
              Step {activeStep + 1} / {STEPS.length}
            </Typography>
          </Box>
          <Typography variant="subtitle2" sx={{ color: tokens.textSecondary }}>
            {STEPS[activeStep]}
          </Typography>
        </Box>

        {activeStep === 0 && <StepExclude onNext={next} />}
        {activeStep === 1 && <StepNumbers onNext={next} onBack={back} />}
        {activeStep === 2 && <StepGenerate onBack={back} />}
      </Paper>
    </Box>
  );
}
