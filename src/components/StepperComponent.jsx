import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';

import FilterAltIcon      from '@mui/icons-material/FilterAlt';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import CloudUploadIcon    from '@mui/icons-material/CloudUpload';
import DownloadIcon       from '@mui/icons-material/Download';
import RefreshIcon        from '@mui/icons-material/Refresh';
import AddIcon            from '@mui/icons-material/Add';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon    from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import ArrowBackIcon      from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon   from '@mui/icons-material/InfoOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon           from '@mui/icons-material/Edit';

import ImageIcon          from '@mui/icons-material/Image';

import useLotteryStore from '../store/useLotteryStore';
import PosterDesigner from './PosterDesigner';
import {
  placeWinners,
  buildPlacementSummary,
  parseRankTextarea,
  serializeRankArray,
  countFilled,
  validateNumberForRank,
  RANK_CAPACITIES,
  RANK_LABELS,
  ALL_RANKS,
} from '../utils/placementEngine';
import { parseOCRForWinners } from '../utils/numberParser';
import {
  parsePrizeBlocks,
  extractExclusionCode,
  codeSetToSortedArray,
} from '../utils/exclusionCodes';
import { runOCR } from '../utils/ocrScanner';
import { captureElement } from '../utils/imageGenerator';
import { runAutoFill } from '../utils/autoFillEngine';
import { persistResultData } from '../utils/apiClient';
import { tokens } from '../theme';

const STEPS = ['Exclude Codes', 'Place Winning Numbers', 'Generate Result'];

// ── Rank dropdown options ─────────────────────────────────────────────────────
const RANK_OPTIONS = [
  { value: '1CR', label: '🏆 1 Crore' },
  { value: '2ND', label: '🥈 2nd Prize' },
  { value: '3RD', label: '🥉 3rd Prize' },
  { value: '4TH', label: '4th Prize' },
  { value: '5TH', label: '5th Prize' },
];

const RANK_COLORS = {
  '1CR': '#FFD700',
  '2ND': '#C0C0C0',
  '3RD': '#CD7F32',
  '4TH': tokens.gold,
  '5TH': tokens.gold,
};

// ── Shared step content wrapper ───────────────────────────────────────────────
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

// ── Step 1: Exclusion Codes ───────────────────────────────────────────────────
function StepExclude({ onNext }) {
  const { excludedRangeText, setExcludedRangeText, applyExclusionCodes, excludedCodeSet } =
    useLotteryStore();

  const [processing, setProcessing] = useState(false);
  const [applied, setApplied]       = useState(false);
  const [previewRows, setPreviewRows] = useState([]);

  const handleExtract = useCallback(() => {
    setProcessing(true);
    setApplied(false);

    setTimeout(() => {
      applyExclusionCodes(excludedRangeText);

      const ranges = parsePrizeBlocks(excludedRangeText);
      const seen   = new Set();
      const rows   = [];
      for (const { start, end } of ranges) {
        const code = extractExclusionCode(start);
        if (!code) continue;
        const rangeLabel = start === end ? start : `${start} – ${end}`;
        if (!seen.has(code)) {
          seen.add(code);
          rows.push({ range: rangeLabel, code });
        } else {
          rows.push({ range: rangeLabel, code, duplicate: true });
        }
      }
      setPreviewRows(rows);
      setProcessing(false);
      setApplied(true);
    }, 0);
  }, [excludedRangeText, applyExclusionCodes]);

  const codes = useMemo(() => codeSetToSortedArray(excludedCodeSet), [excludedCodeSet]);

  return (
    <StepContent>
      <Alert
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        severity="info"
        sx={{ '& .MuiAlert-message': { lineHeight: 1.7 } }}
      >
        Paste <strong>previous winning prize blocks</strong> below. The system will extract a
        2-digit exclusion code from each range — these codes are used during auto-generation to
        prevent new numbers from repeating previous winning patterns.
        <br />
        <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.82rem', opacity: 0.85 }}>
          Example: &nbsp;10100–10199 → prefix "101" → code <strong>01</strong>
          &nbsp;&nbsp;|&nbsp;&nbsp; 86200–86298 → prefix "862" → code <strong>62</strong>
        </Box>
      </Alert>

      <TextField
        label="Previous Prize Blocks"
        multiline
        rows={7}
        fullWidth
        value={excludedRangeText}
        onChange={(e) => { setExcludedRangeText(e.target.value); setApplied(false); }}
        placeholder={
          '25    10100 - 10199\n10    86200 - 86298\n10    44700 - 44798\n 5    98400 - 98495\n 5    59200 - 59295'
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
              <FilterAltIcon sx={{ color: tokens.gold, fontSize: 18, opacity: 0.7 }} />
            </InputAdornment>
          ),
        }}
        inputProps={{ 'aria-label': 'Paste previous prize blocks for exclusion code extraction' }}
        sx={{
          '& textarea': {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.875rem',
            lineHeight: 1.9,
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
          onClick={handleExtract}
          disabled={processing || !excludedRangeText.trim()}
          sx={{ minWidth: 160, fontWeight: 700 }}
        >
          {processing ? 'Extracting…' : 'Extract & Apply'}
        </Button>
        {excludedRangeText && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setExcludedRangeText('');
              setApplied(false);
              useLotteryStore.getState().applyExclusionCodes('');
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {applied && codes.length > 0 && (
        <Paper
          sx={{
            background: 'linear-gradient(135deg, rgba(245,197,24,0.08), rgba(245,197,24,0.04))',
            border: `1.5px solid ${tokens.goldBorder}`,
            borderRadius: '12px',
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <CheckCircleIcon sx={{ color: tokens.gold, fontSize: 18 }} />
            <Typography variant="subtitle2" sx={{ color: tokens.gold, fontWeight: 700 }}>
              {codes.length} Exclusion Code{codes.length !== 1 ? 's' : ''} Extracted
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {codes.map((c) => (
              <Chip
                key={c}
                label={c}
                sx={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontWeight: 800,
                  fontSize: '1rem',
                  height: 36,
                  px: 0.5,
                  background: 'rgba(245,197,24,0.15)',
                  color: tokens.gold,
                  border: `1.5px solid ${tokens.goldBorder}`,
                  borderRadius: '8px',
                  letterSpacing: '0.08em',
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
            Any auto-generated number whose exclusion code matches one of the above will be rejected.
          </Typography>
        </Paper>
      )}

      {applied && codes.length === 0 && (
        <Alert severity="warning">
          No valid 5-digit prize ranges found. Check that ranges look like <code>10100 - 10199</code>.
        </Alert>
      )}

      {applied && previewRows.length > 0 && (
        <Paper
          sx={{
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${tokens.border}`,
            overflow: 'hidden',
          }}
        >
          <Table size="small" aria-label="Exclusion code extraction breakdown">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>RANGE</TableCell>
                <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>
                  START NUMBER &nbsp;
                  <Box component="span" sx={{ color: tokens.textMuted, fontWeight: 400 }}>
                    (A <Box component="span" sx={{ color: tokens.gold }}>B C</Box> D E)
                  </Box>
                </TableCell>
                <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>EXCLUSION CODE</TableCell>
                <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {previewRows.map(({ range, code, duplicate }, i) => {
                const startNum = range.split('–')[0].trim().replace(/\D/g, '');
                const d0    = startNum[0] ?? '';
                const dCode = startNum.slice(1, 3);
                const dRest = startNum.slice(3);
                return (
                  <TableRow
                    key={i}
                    sx={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
                      '&:hover': { background: tokens.goldMuted },
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.83rem', color: tokens.textSecondary }}>
                      {range}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.06em' }}>
                      <Box component="span" sx={{ color: tokens.textMuted }}>{d0}</Box>
                      <Box component="span" sx={{ color: tokens.gold, fontWeight: 800 }}>{dCode}</Box>
                      <Box component="span" sx={{ color: tokens.textMuted }}>{dRest}</Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={code}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          height: 22,
                          background: duplicate ? 'rgba(192,57,43,0.12)' : 'rgba(245,197,24,0.15)',
                          color: duplicate ? tokens.crimsonLight : tokens.gold,
                          border: `1px solid ${duplicate ? 'rgba(192,57,43,0.3)' : tokens.goldBorder}`,
                          borderRadius: '6px',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {duplicate ? (
                        <Typography variant="caption" sx={{ color: tokens.textMuted, fontStyle: 'italic' }}>
                          duplicate — already excluded
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ color: tokens.success }}>
                          ✓ added
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Box sx={{ p: 1.5, borderTop: `1px solid ${tokens.border}` }}>
            <Typography variant="caption" color="text.disabled">
              ⚠ Exclusion codes apply to <strong>auto-generated numbers only</strong>.
              OCR-scanned and manually entered winners are always preserved.
            </Typography>
          </Box>
        </Paper>
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

// ── OCR Entry Row — one row in the editable table ─────────────────────────────
const OCR_ENTRY_RANK_OPTIONS = [
  { value: '',    label: '— No Rank —' },
  ...RANK_OPTIONS,
];

function OcrEntryRow({ entry, index }) {
  const updateOcrEntry = useLotteryStore((s) => s.updateOcrEntry);
  const removeOcrEntry = useLotteryStore((s) => s.removeOcrEntry);

  // Use entry.number as the controlled base; local edits are flushed on blur.
  // We track the in-progress value separately so typing feels instant.
  const [localNumber, setLocalNumber] = useState(entry.number);

  // If the entry changes externally (e.g. clear all), re-sync local input
  const prevEntryNumber = useRef(entry.number);
  if (prevEntryNumber.current !== entry.number) {
    prevEntryNumber.current = entry.number;
    // Safe: direct state assignment during render (not inside effect)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    // We can't call setLocalNumber here without a hook violation — use derived state instead:
    // Reset localNumber only if it's not currently being edited (i.e., matches old value)
  }
  // Simpler approach: derive display value — use localNumber for active typing,
  // but when entry.number changes from outside, reset. Ref-guard avoids extra renders.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setLocalNumber(entry.number);
  }, [entry.number]); // only resets when source-of-truth changes externally

  const handleNumberBlur = useCallback(() => {
    const trimmed = localNumber.trim();
    if (trimmed !== entry.number) {
      updateOcrEntry(entry.id, { number: trimmed });
    }
  }, [localNumber, entry.number, entry.id, updateOcrEntry]);

  const handleRankChange = useCallback((e) => {
    updateOcrEntry(entry.id, { rank: e.target.value });
  }, [entry.id, updateOcrEntry]);

  const handleRemove = useCallback(() => {
    removeOcrEntry(entry.id);
  }, [entry.id, removeOcrEntry]);

  // Inline validation — only show error when rank is selected
  const validation = entry.rank
    ? validateNumberForRank(localNumber.trim(), entry.rank)
    : { valid: true, reason: '' };

  const rankColor = RANK_COLORS[entry.rank] || tokens.textSecondary;
  const confPct   = Math.round((entry.confidence ?? 1) * 100);

  return (
    <TableRow
      sx={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
        '&:hover': { background: tokens.goldMuted },
        verticalAlign: 'middle',
      }}
    >
      {/* # */}
      <TableCell
        sx={{
          width: 32,
          color: tokens.textMuted,
          fontVariantNumeric: 'tabular-nums',
          fontSize: '0.78rem',
          textAlign: 'center',
          pr: 0,
        }}
      >
        {index + 1}
      </TableCell>

      {/* Editable number */}
      <TableCell sx={{ minWidth: 110 }}>
        <TextField
          value={localNumber}
          onChange={(e) => setLocalNumber(e.target.value)}
          onBlur={handleNumberBlur}
          size="small"
          error={!validation.valid}
          inputProps={{
            'aria-label': `Number for entry ${index + 1}`,
            style: {
              fontFamily: 'monospace',
              fontSize: '0.88rem',
              fontWeight: 700,
              padding: '4px 8px',
              letterSpacing: '0.06em',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: !validation.valid
                  ? 'rgba(192,57,43,0.7)'
                  : entry.edited
                  ? `${tokens.gold}66`
                  : `${tokens.border}`,
              },
            },
          }}
        />
        {!validation.valid && (
          <Typography
            variant="caption"
            sx={{ color: 'error.main', display: 'block', mt: 0.25, fontSize: '0.68rem' }}
          >
            {validation.reason}
          </Typography>
        )}
      </TableCell>

      {/* Rank dropdown */}
      <TableCell sx={{ minWidth: 140 }}>
        <FormControl size="small" fullWidth>
          <Select
            value={entry.rank}
            onChange={handleRankChange}
            displayEmpty
            inputProps={{ 'aria-label': `Rank for entry ${index + 1}` }}
            sx={{
              fontSize: '0.8rem',
              '& .MuiSelect-select': { py: 0.65, color: rankColor },
              '& fieldset': { borderColor: entry.rank ? `${rankColor}66` : tokens.border },
            }}
          >
            {OCR_ENTRY_RANK_OPTIONS.map((opt) => (
              <MenuItem
                key={opt.value}
                value={opt.value}
                sx={{
                  fontSize: '0.82rem',
                  color: opt.value ? RANK_COLORS[opt.value] : 'text.secondary',
                }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </TableCell>

      {/* Source + confidence */}
      <TableCell sx={{ textAlign: 'center' }}>
        <Chip
          label={entry.source === 'manual' ? 'Manual' : `OCR ${confPct}%`}
          size="small"
          sx={{
            fontSize: '0.68rem',
            height: 20,
            fontWeight: 700,
            background: entry.source === 'manual'
              ? 'rgba(155,89,182,0.15)'
              : 'rgba(52,152,219,0.12)',
            color: entry.source === 'manual' ? '#9B59B6' : '#3498DB',
            border: `1px solid ${entry.source === 'manual' ? '#9B59B244' : '#3498DB44'}`,
            borderRadius: '6px',
          }}
        />
        {entry.edited && (
          <Chip
            label="Edited"
            size="small"
            sx={{
              fontSize: '0.65rem',
              height: 18,
              ml: 0.5,
              background: `${tokens.gold}18`,
              color: tokens.gold,
              border: `1px solid ${tokens.goldBorder}`,
              borderRadius: '6px',
            }}
          />
        )}
      </TableCell>

      {/* Delete */}
      <TableCell sx={{ textAlign: 'center' }}>
        <Tooltip title={`Remove entry ${index + 1}`}>
          <IconButton
            size="small"
            onClick={handleRemove}
            aria-label={`Remove OCR entry ${index + 1}`}
            sx={{
              color: tokens.textMuted,
              padding: '4px',
              '&:hover': { color: tokens.crimsonLight, background: tokens.crimsonMuted },
            }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ── Rank Panel — per-rank input field with counter ────────────────────────────
function RankPanel({ rank, rankArray, onTextareaChange }) {
  const capacity = RANK_CAPACITIES[rank];
  const filled   = countFilled(rankArray);
  const pct      = capacity > 0 ? Math.round((filled / capacity) * 100) : 0;
  const isFull   = filled >= capacity;
  const label    = RANK_LABELS[rank];
  const color    = RANK_COLORS[rank] || tokens.gold;
  const textValue = serializeRankArray(rankArray);

  return (
    <Paper
      sx={{
        p: 2,
        background: `${color}08`,
        border: `1px solid ${color}33`,
        borderRadius: '10px',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              flexShrink: 0,
            }}
          />
          <Typography variant="subtitle2" sx={{ color, fontWeight: 700, fontSize: '0.85rem' }}>
            {label}
          </Typography>
          {rank === '1CR' && (
            <Typography variant="caption" sx={{ color: tokens.textMuted, fontSize: '0.7rem' }}>
              (series + 5 digits)
            </Typography>
          )}
          {rank === '2ND' && (
            <Typography variant="caption" sx={{ color: tokens.textMuted, fontSize: '0.7rem' }}>
              (5 digits each)
            </Typography>
          )}
          {(rank === '3RD' || rank === '4TH' || rank === '5TH') && (
            <Typography variant="caption" sx={{ color: tokens.textMuted, fontSize: '0.7rem' }}>
              (4 digits each)
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isFull && (
            <Chip
              label="FULL"
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 18,
                background: 'rgba(192,57,43,0.15)',
                color: tokens.crimsonLight,
                border: `1px solid rgba(192,57,43,0.3)`,
                borderRadius: '6px',
                fontWeight: 800,
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: isFull ? tokens.crimsonLight : color,
            }}
          >
            {filled} / {capacity}
          </Typography>
        </Box>
      </Box>

      {/* Progress bar */}
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mb: 1.5,
          height: 4,
          borderRadius: 2,
          background: `${color}18`,
          '& .MuiLinearProgress-bar': { background: color, borderRadius: 2 },
        }}
      />

      {/* Textarea */}
      <TextField
        multiline
        minRows={2}
        maxRows={8}
        fullWidth
        value={textValue}
        onChange={(e) => onTextareaChange(rank, e.target.value)}
        placeholder={
          rank === '1CR'
            ? 'e.g. AB 12345'
            : rank === '2ND'
            ? 'One 5-digit number per line'
            : 'One 4-digit number per line'
        }
        inputProps={{
          'aria-label': `${label} numbers`,
          style: {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.83rem',
            lineHeight: 1.85,
            color: color,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: `${color}33` },
            '&:hover fieldset': { borderColor: `${color}66` },
            '&.Mui-focused fieldset': { borderColor: color },
          },
        }}
      />
    </Paper>
  );
}

// ── Step 2: Place Winning Numbers ─────────────────────────────────────────────
function StepNumbers({ onNext, onBack }) {
  const {
    ocrEntries,
    appendOcrEntries,
    clearOcrEntries,
    addManualEntry,
    rankArrays,
    setRankArrays,
    setRankArray,
    uploadedImageURLs,
    addUploadedImageURL,
    clearUploadedImageURLs,
    ocrProgress,
    ocrStatus,
    setOcrProgress,
    setOcrStatus,
    generationStatus,
    setGenerationStatus,
    placementStatus,
    setPlacementStatus,
    saveStatus,
    setSaveStatus,
    saveError,
    setSaveError,
    autoFillLogs,
    setAutoFillLogs,
    appendAutoFillLog,
  } = useLotteryStore();

  const [dragOver, setDragOver]           = useState(false);
  const [manualNum, setManualNum]         = useState('');
  const [manualRank, setManualRank]       = useState('');
  const [placementResult, setPlacementResult] = useState(null);
  const [showSummary, setShowSummary]     = useState(false);
  const [showInvalid, setShowInvalid]     = useState(false);
  const fileInputRef = useRef(null);

  // ── OCR processing ───────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    // Support up to 4 images — add URL to preview list, don't reset
    const url = URL.createObjectURL(file);
    addUploadedImageURL(url);
    setOcrStatus('scanning');
    setOcrProgress(0);

    try {
      const rawText = await runOCR(file, (p) => setOcrProgress(p));

      // Parse using the new winner-specific parser
      const ocrResults = parseOCRForWinners(rawText);

      if (ocrResults.length === 0) {
        setOcrStatus('done');
        return;
      }

      // Build new entries — append to existing (multi-image support)
      const newEntries = ocrResults.map((r, i) => ({
        id:         `ocr-${Date.now()}-${i}-${Math.random()}`,
        number:     r.number,
        rank:       r.suggestedRank,
        confidence: r.confidence,
        source:     'ocr',
        edited:     false,
        placed:     false,
        raw:        r.raw,
      }));

      appendOcrEntries(newEntries);
      setOcrStatus('done');
    } catch (err) {
      console.error('OCR error:', err);
      setOcrStatus('error');
    }
  }, [addUploadedImageURL, setOcrStatus, setOcrProgress, appendOcrEntries]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = [...(e.dataTransfer.files ?? [])].slice(0, 4);
    files.forEach((f) => processFile(f));
  }, [processFile]);

  const handleFileSelect = useCallback((e) => {
    const files = [...(e.target.files ?? [])].slice(0, 4);
    files.forEach((f) => processFile(f));
    // Reset file input so same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  // ── Manual add ───────────────────────────────────────────────────────────────
  const handleAddManual = useCallback(() => {
    const trimmed = manualNum.trim();
    if (!trimmed) return;
    addManualEntry(trimmed);
    // If a rank was also chosen in the manual add, update the entry immediately
    if (manualRank) {
      // The entry is appended as the last item in ocrEntries; we'll patch it
      // using a store action that reads current state
      useLotteryStore.setState((state) => {
        const entries = state.ocrEntries;
        const last = entries[entries.length - 1];
        if (last && last.source === 'manual' && last.number === trimmed) {
          return {
            ocrEntries: entries.map((e) =>
              e.id === last.id ? { ...e, rank: manualRank } : e
            ),
          };
        }
        return {};
      });
    }
    setManualNum('');
    setManualRank('');
  }, [manualNum, manualRank, addManualEntry]);

  // ── Rank textarea direct edit ─────────────────────────────────────────────────
  const handleTextareaChange = useCallback((rank, text) => {
    const arr = parseRankTextarea(text);
    setRankArray(rank, arr);
    // Clear placement result when user edits directly
    setPlacementResult(null);
    setShowSummary(false);
  }, [setRankArray]);

  // ── PLACE IN RANKS ────────────────────────────────────────────────────────────
  //
  // Critical requirements (from spec):
  //   1. Read CURRENT ocrEntries from store — not original OCR data.
  //   2. Read CURRENT rankArrays from store — preserve existing manual numbers.
  //   3. Deduplicate within each rank.
  //   4. Validate digit length per rank.
  //   5. Respect capacity limits.
  //   6. Operation is idempotent.
  //   7. OCR winners are NEVER filtered by exclusion codes.
  //
  const handlePlaceInRanks = useCallback(() => {
    // Read current state directly from store to avoid stale closure issues
    const currentState = useLotteryStore.getState();
    const currentEntries = currentState.ocrEntries;
    const currentArrays  = currentState.rankArrays;

    const result = placeWinners(currentEntries, currentArrays);

    // Update rank arrays with placement result
    setRankArrays(result.rankArrays);

    // Mark placed entries in ocrEntries
    const placedNumbers = new Set(result.placed.map((p) => `${p.rank}::${p.number}`));
    useLotteryStore.setState((state) => ({
      ocrEntries: state.ocrEntries.map((e) =>
        placedNumbers.has(`${e.rank}::${e.number}`)
          ? { ...e, placed: true }
          : e
      ),
    }));

    setPlacementResult(result);
    setShowSummary(true);
    setShowInvalid(result.invalid.length > 0 || result.capacityExceeded.length > 0);
  }, [setRankArrays]);

  // ── Clear all OCR entries and images ─────────────────────────────────────────
  const handleClearOCR = useCallback(() => {
    clearOcrEntries();
    clearUploadedImageURLs();
    setPlacementResult(null);
    setShowSummary(false);
    setOcrStatus('idle');
    setOcrProgress(0);
  }, [clearOcrEntries, clearUploadedImageURLs, setOcrStatus, setOcrProgress]);

  // ── Auto-fill Remaining Slots (Decoupled generation & safe save) ─────────────
  const handleAutoFill = useCallback(async () => {
    setGenerationStatus('generating');
    setSaveError('');

    const currentState = useLotteryStore.getState();
    const fillResult = runAutoFill({
      rankArrays: currentState.rankArrays,
      excludedCodeSet: currentState.excludedCodeSet,
    });

    // 1. Update rank arrays with generated numbers
    setRankArrays(fillResult.rankArrays);
    setGenerationStatus('success');
    setPlacementStatus('success');
    setAutoFillLogs(fillResult.logLines);

    // 2. Persist to server / API safely
    setSaveStatus('saving');
    try {
      const payload = {
        drawDate: currentState.resultDate,
        drawNumber: currentState.drawNumber,
        resultTitle: currentState.resultTitle,
        rankArrays: fillResult.rankArrays,
        totalWinners: fillResult.totalPlaced,
      };
      const res = await persistResultData(payload);
      setSaveStatus('saved');
      appendAutoFillLog(res.message || '✓ Result saved successfully to server');
    } catch (err) {
      console.warn('Server save error caught safely:', err.message);
      setSaveStatus('error');
      setSaveError(err.message);
      appendAutoFillLog(`⚠️ Server save failed: ${err.message}`);
    }
  }, [setRankArrays, setGenerationStatus, setPlacementStatus, setAutoFillLogs, setSaveStatus, setSaveError, appendAutoFillLog]);

  // ── Retry Save (Safe idempotency — retries save without regenerating numbers) ──
  const handleRetrySave = useCallback(async () => {
    setSaveStatus('saving');
    setSaveError('');
    appendAutoFillLog('Retrying save to server…');

    const currentState = useLotteryStore.getState();
    const total =
      countFilled(currentState.rankArrays['1CR']) +
      countFilled(currentState.rankArrays['2ND']) +
      countFilled(currentState.rankArrays['3RD']) +
      countFilled(currentState.rankArrays['4TH']) +
      countFilled(currentState.rankArrays['5TH']);

    const payload = {
      drawDate: currentState.resultDate,
      drawNumber: currentState.drawNumber,
      resultTitle: currentState.resultTitle,
      rankArrays: currentState.rankArrays,
      totalWinners: total,
    };

    try {
      const res = await persistResultData(payload);
      setSaveStatus('saved');
      appendAutoFillLog(res.message || '✓ Result saved successfully to server');
    } catch (err) {
      console.warn('Retry save error caught safely:', err.message);
      setSaveStatus('error');
      setSaveError(err.message);
      appendAutoFillLog(`⚠️ Retry failed: ${err.message}`);
    }
  }, [setSaveStatus, setSaveError, appendAutoFillLog]);

  // Derived counts for display
  const entryCount   = ocrEntries.length;
  const hasEntries   = entryCount > 0;
  const hasAnyFilled = ALL_RANKS.some((r) => countFilled(rankArrays[r]) > 0);

  // Summary lines
  const summaryLines = useMemo(
    () => (placementResult ? buildPlacementSummary(placementResult) : []),
    [placementResult]
  );

  return (
    <StepContent>
      {/* ── Info Banner ── */}
      <Alert
        icon={<InfoOutlinedIcon fontSize="inherit" />}
        severity="info"
        sx={{ '& .MuiAlert-message': { lineHeight: 1.7 } }}
      >
        <strong>How this works:</strong> Upload 1–4 winning ticket images (OCR detects numbers
        automatically) or enter numbers manually. Review and correct the list, assign ranks, then
        click <strong>Place in Ranks</strong>. OCR winners are <em>never</em> filtered by exclusion
        codes.
      </Alert>

      {/* ── Drop zone (supports up to 4 images) ── */}
      <Box
        role="button"
        tabIndex={0}
        aria-label="Upload lottery ticket images (up to 4). Click or drag and drop."
        className={dragOver ? 'drop-zone-active' : ''}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        sx={{
          border: '2px dashed rgba(245,197,24,0.25)',
          borderRadius: '12px',
          p: { xs: 2.5, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          cursor: 'pointer',
          minHeight: 130,
          transition: 'all 0.2s ease',
          background: dragOver ? tokens.goldMuted : 'rgba(255,255,255,0.015)',
          '&:hover': { borderColor: 'rgba(245,197,24,0.45)', background: tokens.goldMuted },
          '&:focus-visible': { outline: `2px solid ${tokens.gold}`, outlineOffset: '2px' },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileSelect}
          aria-hidden="true"
        />
        {uploadedImageURLs.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {uploadedImageURLs.map((url, i) => (
              <Box
                key={i}
                component="img"
                src={url}
                alt={`Uploaded ticket ${i + 1}`}
                sx={{
                  maxHeight: 120,
                  maxWidth: 140,
                  borderRadius: '8px',
                  objectFit: 'contain',
                  border: `1px solid ${tokens.border}`,
                }}
              />
            ))}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                opacity: 0.65,
              }}
            >
              <ImageIcon sx={{ color: tokens.gold, fontSize: 24 }} />
              <Typography variant="caption" color="text.secondary">
                Add more (up to 4)
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 40, color: tokens.gold, opacity: 0.65 }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Drag & drop winning ticket images, or{' '}
                <Box component="span" sx={{ color: tokens.gold, fontWeight: 700 }}>
                  click to browse
                </Box>
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
                Up to 4 images · JPG, PNG, WEBP · OCR runs on each image
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* ── OCR Progress ── */}
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
          OCR complete — found <strong>{entryCount}</strong> candidate number{entryCount !== 1 ? 's' : ''}.
          Review the list below, correct any errors, then click <strong>Place in Ranks</strong>.
        </Alert>
      )}
      {ocrStatus === 'error' && (
        <Alert severity="error">
          OCR failed. Try a clearer image or add numbers manually below.
        </Alert>
      )}

      {/* ── Editable OCR Entry Table ── */}
      {hasEntries && (
        <Paper
          sx={{
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${tokens.border}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${tokens.border}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon sx={{ color: tokens.gold, fontSize: 16 }} />
              <Typography variant="subtitle2" sx={{ color: tokens.gold, fontWeight: 700 }}>
                {entryCount} Entr{entryCount !== 1 ? 'ies' : 'y'} — Review & Edit
              </Typography>
            </Box>
            <Button
              size="small"
              color="secondary"
              startIcon={<RefreshIcon />}
              onClick={handleClearOCR}
              sx={{ fontSize: '0.75rem', py: 0.4 }}
            >
              Clear All
            </Button>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="OCR entries — edit before placing">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700, width: 32, pr: 0 }}>
                    #
                  </TableCell>
                  <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>
                    NUMBER
                  </TableCell>
                  <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700 }}>
                    RANK
                  </TableCell>
                  <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700, textAlign: 'center' }}>
                    SOURCE
                  </TableCell>
                  <TableCell sx={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 700, textAlign: 'center' }}>
                    DEL
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ocrEntries.map((entry, idx) => (
                  <OcrEntryRow key={entry.id} entry={entry} index={idx} />
                ))}
              </TableBody>
            </Table>
          </Box>

          <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${tokens.border}` }}>
            <Typography variant="caption" color="text.disabled">
              ✏ Edit the number or change the rank in each row before placing.
              Rank suggestions are based on digit count — always verify.
              Entries with validation errors (red border) will be skipped.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ── Manual Add ── */}
      <Paper sx={{ p: 2, background: 'rgba(255,255,255,0.02)', border: `1px solid ${tokens.border}` }}>
        <Typography variant="subtitle2" sx={{ color: tokens.textSecondary, fontWeight: 600, mb: 1.5, fontSize: '0.82rem' }}>
          Add Number Manually
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Ticket number"
            value={manualNum}
            onChange={(e) => setManualNum(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            sx={{ flexGrow: 1, minWidth: 120 }}
            inputProps={{
              inputMode: 'numeric',
              'aria-label': 'Enter a ticket number to add manually',
              style: { fontFamily: 'monospace', fontWeight: 700 },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={manualRank}
              onChange={(e) => setManualRank(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Select rank for manual number' }}
              sx={{ fontSize: '0.82rem', '& .MuiSelect-select': { py: 0.65 } }}
            >
              {OCR_ENTRY_RANK_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.82rem' }}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
      </Paper>

      {/* ── Action Buttons: Place in Ranks, Run Auto-Fill & Reset ── */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {hasEntries && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={handlePlaceInRanks}
            sx={{ minWidth: 170, fontWeight: 700 }}
            aria-label="Place all reviewed OCR entries into their assigned rank fields"
          >
            Place in Ranks
          </Button>
        )}

        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={
            generationStatus === 'generating' || saveStatus === 'saving' ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AutoAwesomeIcon />
            )
          }
          onClick={handleAutoFill}
          disabled={generationStatus === 'generating' || saveStatus === 'saving'}
          sx={{
            minWidth: 200,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${tokens.goldDark}, ${tokens.gold})`,
            color: '#000',
            '&:hover': { background: `linear-gradient(135deg, ${tokens.gold}, ${tokens.goldLight})` },
          }}
          aria-label="Auto-fill remaining prize ranks up to 141 winners"
        >
          {generationStatus === 'generating'
            ? 'Generating…'
            : saveStatus === 'saving'
            ? 'Saving to Server…'
            : 'Run Auto-Fill (Fill to 141)'}
        </Button>

        {hasAnyFilled && (
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<RefreshIcon />}
            onClick={() => {
              useLotteryStore.getState().resetRankArrays();
              setPlacementResult(null);
              setShowSummary(false);
              setGenerationStatus('idle');
              setSaveStatus('idle');
              setSaveError('');
              useLotteryStore.getState().clearAutoFillLogs();
            }}
            sx={{ minWidth: 140 }}
          >
            Reset Ranks
          </Button>
        )}
      </Box>

      {/* ── Operational Log & Status Console (Matches Screenshot) ── */}
      {autoFillLogs.length > 0 && (
        <Paper
          sx={{
            p: 2.5,
            background: '#0B0F19',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: '0.85rem',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          {/* Status Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
              pb: 1,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: tokens.textMuted, fontFamily: 'monospace', fontWeight: 600 }}>
              TERMINAL LOG & SERVER STATUS
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {generationStatus === 'success' && (
                <Chip size="small" label="✓ Generation OK" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
              {placementStatus === 'success' && (
                <Chip size="small" label="✓ 141 Placed" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
              {saveStatus === 'saving' && (
                <Chip size="small" label="Saving to Server…" color="info" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
              {saveStatus === 'saved' && (
                <Chip size="small" label="✓ Saved" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
              {saveStatus === 'error' && (
                <Chip size="small" label="⚠️ Server Save Failed" color="warning" sx={{ height: 22, fontSize: '0.7rem' }} />
              )}
            </Box>
          </Box>

          {/* Console Log Lines */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {autoFillLogs.map((log, idx) => {
              const isError = log.startsWith('⚠️') || log.startsWith('Error') || log.includes('failed');
              const isSuccess =
                log.startsWith('✓') ||
                log.startsWith('Auto-generated') ||
                log.startsWith('Fill done') ||
                log.startsWith('Placed');
              return (
                <Typography
                  key={idx}
                  sx={{
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    lineHeight: 1.8,
                    color: isError ? '#FF6B6B' : isSuccess ? '#4ECCA3' : tokens.textSecondary,
                  }}
                >
                  {log}
                </Typography>
              );
            })}
          </Box>

          {/* Separate Recovery / Retry Bar when Server Save Fails */}
          {saveStatus === 'error' && (
            <Box
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#FFB86C', fontWeight: 600, fontSize: '0.82rem' }}>
                  Numbers generated and placed successfully (100% safe locally).
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.textMuted, display: 'block' }}>
                  {saveError || 'Backend endpoint returned an invalid response.'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRetrySave}
                disabled={saveStatus === 'saving'}
                sx={{ fontWeight: 700, fontSize: '0.75rem', px: 2 }}
              >
                {saveStatus === 'saving' ? 'Retrying…' : 'Retry Save'}
              </Button>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Placement Summary ── */}
      <Collapse in={showSummary}>
        {placementResult && (
          <Paper
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(39,174,96,0.08), rgba(39,174,96,0.04))',
              border: `1px solid rgba(39,174,96,0.25)`,
              borderRadius: '10px',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: tokens.success, fontWeight: 700, mb: 1 }}>
              Placement Summary
            </Typography>
            {summaryLines.map((line, i) => (
              <Typography
                key={i}
                variant="body2"
                sx={{ color: tokens.textSecondary, fontSize: '0.82rem', lineHeight: 1.8 }}
              >
                {line}
              </Typography>
            ))}

            {/* Rank counts */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
              {ALL_RANKS.map((rank) => {
                const filled = countFilled(
                  useLotteryStore.getState().rankArrays[rank]
                );
                const cap = RANK_CAPACITIES[rank];
                const color = RANK_COLORS[rank] || tokens.gold;
                return (
                  <Chip
                    key={rank}
                    label={`${RANK_LABELS[rank]}: ${filled}/${cap}`}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 24,
                      background: `${color}15`,
                      color,
                      border: `1px solid ${color}44`,
                      borderRadius: '6px',
                    }}
                  />
                );
              })}
            </Box>

            {/* Invalid entries detail */}
            {showInvalid && placementResult.invalid.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                  Validation errors (not placed):
                </Typography>
                {placementResult.invalid.map((inv, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{ display: 'block', color: 'error.main', fontSize: '0.72rem', ml: 1 }}
                  >
                    Entry {inv.entryIndex}: "{inv.number}" → {inv.rank} — {inv.reason}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Capacity exceeded detail */}
            {showInvalid && placementResult.capacityExceeded.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700 }}>
                  Capacity exceeded (not placed):
                </Typography>
                {placementResult.capacityExceeded.map((ce, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{ display: 'block', color: 'warning.main', fontSize: '0.72rem', ml: 1 }}
                  >
                    "{ce.number}" → {ce.rank}: {ce.reason}
                  </Typography>
                ))}
              </Box>
            )}
          </Paper>
        )}
      </Collapse>

      {/* ── Per-rank input panels ── */}
      <Divider sx={{ borderColor: tokens.border }}>
        <Typography variant="caption" sx={{ color: tokens.textMuted, px: 1 }}>
          RANK FIELDS — edit directly or use Place in Ranks above
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {ALL_RANKS.map((rank) => (
          <RankPanel
            key={rank}
            rank={rank}
            rankArray={rankArrays[rank] ?? []}
            onTextareaChange={handleTextareaChange}
          />
        ))}
      </Box>

      {/* ── Navigation ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          disabled={!hasAnyFilled}
        >
          Next — Generate Result
        </Button>
      </Box>
    </StepContent>
  );
}

// ── Step 3: Generate Result ────────────────────────────────────────────────────
function StepGenerate({ onBack, session = 'morning' }) {
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'card'
  const {
    rankArrays,
    resultTitle, setResultTitle,
    resultDate,  setResultDate,
    setResultImageURL, resultImageURL,
  } = useLotteryStore();

  const previewRef              = useRef(null);
  const [loading, setLoading]   = useState(false);
  const [captured, setCaptured] = useState(false);

  const isMorning = session === 'morning';

  const RANK_DISPLAY_ORDER = ['1CR', '2ND', '3RD', '4TH', '5TH'];
  const RANK_DISPLAY_LABELS = {
    '1CR': '1 Crore Prize',
    '2ND': '2nd Prize',
    '3RD': '3rd Prize',
    '4TH': '4th Prize',
    '5TH': '5th Prize',
  };
  const RANK_DISPLAY_COLORS = {
    '1CR': '#FFD700',
    '2ND': '#00E5FF',
    '3RD': '#FFA100',
    '4TH': '#B388FF',
    '5TH': '#F5C518',
  };

  // Only show ranks that have at least one placed number
  // RANK_DISPLAY_ORDER is a module-level constant — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filledRanks = useMemo(
    () => RANK_DISPLAY_ORDER.filter((r) => (rankArrays[r] ?? []).length > 0),
    [rankArrays] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
    const sessionPrefix = isMorning ? 'Morning' : 'Evening';
    link.download = `${sessionPrefix}_${(resultTitle || 'Lottery_Result').replace(/\s+/g, '_')}_${resultDate || 'draw'}.png`;
    link.click();
  };

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
      {/* View Mode Toggle Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={viewMode === 'canvas' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => setViewMode('canvas')}
            sx={{
              fontWeight: 800,
              background: viewMode === 'canvas' ? 'linear-gradient(135deg, #00c6ff, #0072ff)' : 'transparent',
              color: '#fff',
              borderColor: 'rgba(0, 210, 255, 0.4)',
              boxShadow: viewMode === 'canvas' ? '0 4px 12px rgba(0, 114, 255, 0.35)' : 'none'
            }}
          >
            🎨 Official Poster (HTML Canvas)
          </Button>

          <Button
            variant={viewMode === 'card' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setViewMode('card')}
            sx={{
              fontWeight: 700,
              color: viewMode === 'card' ? '#fff' : 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.2)'
            }}
          >
            📱 Simple Card Preview
          </Button>
        </Box>

        <Chip
          label={isMorning ? '☀️ MORNING DRAW (02:00 PM)' : '🌙 EVENING DRAW (09:00 PM)'}
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: '0.75rem',
            background: isMorning ? 'rgba(245,197,24,0.18)' : 'rgba(179,136,255,0.18)',
            color: isMorning ? tokens.gold : '#D1C4E9',
            border: `1px solid ${isMorning ? 'rgba(245,197,24,0.40)' : 'rgba(179,136,255,0.40)'}`
          }}
        />
      </Box>

      {/* Mode 1: HTML Canvas Interactive Poster Designer */}
      {viewMode === 'canvas' ? (
        <PosterDesigner session={session} />
      ) : (
        /* Mode 2: Minimal Card Preview (html2canvas) */
        <>
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
              border: isMorning ? '1px solid rgba(245,197,24,0.28)' : '1px solid rgba(179,136,255,0.28)',
              p: { xs: 2.5, sm: 4 },
              fontFamily: 'Poppins, sans-serif',
            }}
          >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <EmojiEventsIcon sx={{ color: tokens.gold, fontSize: 32 }} />
            <Typography
              component="h2"
              sx={{
                fontWeight: 900,
                color: tokens.gold,
                fontSize: { xs: '1.4rem', sm: '1.9rem' },
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                textShadow: '0 0 24px rgba(245,197,24,0.35)',
              }}
            >
              {resultTitle || 'Lottery Result'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
            {resultDate && (
              <Typography variant="body2" color="text.secondary">
                Draw Date:{' '}
                <Box component="strong" sx={{ color: tokens.textPrimary }}>
                  {formattedDate}
                </Box>
              </Typography>
            )}
            <Chip
              size="small"
              label={isMorning ? '☀️ MORNING DRAW (02:00 PM)' : '🌙 EVENING DRAW (09:00 PM)'}
              sx={{
                background: isMorning ? 'rgba(245,197,24,0.18)' : 'rgba(179,136,255,0.18)',
                color: isMorning ? tokens.goldLight : '#D1C4E9',
                border: `1px solid ${isMorning ? 'rgba(245,197,24,0.40)' : 'rgba(179,136,255,0.40)'}`,
                fontWeight: 800,
                fontSize: '0.72rem',
                letterSpacing: '0.04em',
                height: '24px',
              }}
            />
          </Box>
          <Divider sx={{ mt: 2, borderColor: isMorning ? 'rgba(245,197,24,0.20)' : 'rgba(179,136,255,0.20)' }} />
        </Box>

        {/* Results by rank */}
        {filledRanks.length === 0 ? (
          <Typography variant="body2" color="text.disabled" textAlign="center" py={3}>
            No winning numbers placed yet. Go back to Step 2 and place winners.
          </Typography>
        ) : (
          filledRanks.map((rank) => {
            const numbers = rankArrays[rank] ?? [];
            const color   = RANK_DISPLAY_COLORS[rank];
            const is1Cr   = rank === '1CR';
            return (
              <Box key={rank} sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      color,
                      textTransform: 'capitalize',
                      letterSpacing: '0.02em',
                      fontSize: '0.9rem',
                    }}
                  >
                    {RANK_DISPLAY_LABELS[rank]}
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.textMuted, ml: 0.5 }}>
                    ({numbers.length} winner{numbers.length !== 1 ? 's' : ''})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: is1Cr ? 1.5 : 0.85, pl: { xs: 0.5, sm: 2 } }}>
                  {numbers.map((num, ni) => (
                    <Box
                      key={`${num}-${ni}`}
                      data-prize-badge="true"
                      data-rank={rank}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: is1Cr ? 36 : 28,
                        minWidth: is1Cr ? 116 : rank === '2ND' ? 66 : 52,
                        px: is1Cr ? 1.5 : 1,
                        py: 0,
                        borderRadius: '6px',
                        background: `${color}18`,
                        border: `1.5px solid ${color}55`,
                        color,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontWeight: 700,
                        fontSize: is1Cr ? '1.05rem' : '0.86rem',
                        lineHeight: 1,
                        letterSpacing: 0,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                        transition: 'transform 0.1s ease',
                        userSelect: 'none',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          lineHeight: 1,
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          marginTop: '-1px', // visual cap-height adjustment for monospace digit baseline
                        }}
                      >
                        {num}
                      </span>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })
        )}

        {/* Footer */}
        <Divider sx={{ mt: 2, mb: 1.5, borderColor: 'rgba(245,197,24,0.12)' }} />
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          Generated by Tirupati Final Admin Dashboard
        </Typography>
      </Paper>

      {/* Captured image */}
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

      {/* Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
          onClick={handleGenerate}
          disabled={loading || filledRanks.length === 0}
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
        </>
      )}

      <Box sx={{ pt: 2 }}>
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
export default function StepperComponent({ session: propSession }) {
  const [activeStep, setActiveStep] = useState(0);
  const storeSession = useLotteryStore((s) => s.activeSession);
  const session = (propSession || storeSession || 'morning').toLowerCase();
  const isMorning = session === 'morning';

  const { resultDate, setResultDate, drawNumber, setDrawNumber } = useLotteryStore();

  const next = () => setActiveStep((s) => s + 1);
  const back = () => setActiveStep((s) => s - 1);

  return (
    <Box>
      {/* ── Draw Config Bar ── */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          background: 'rgba(255,255,255,0.02)',
          border: isMorning ? `1px solid rgba(245,197,24,0.25)` : `1px solid rgba(179,136,255,0.25)`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={isMorning ? '☀️ MORNING DRAW (02:00 PM)' : '🌙 EVENING DRAW (09:00 PM)'}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                height: 26,
                background: isMorning ? 'rgba(245,197,24,0.18)' : 'rgba(179,136,255,0.18)',
                color: isMorning ? tokens.gold : '#D1C4E9',
                border: isMorning ? `1px solid ${tokens.goldBorder}` : '1px solid rgba(179,136,255,0.40)',
              }}
            />
            <Chip
              label={`DRAW ${drawNumber || (isMorning ? '1' : '2')}`}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                height: 26,
                color: isMorning ? tokens.gold : '#B388FF',
                borderColor: isMorning ? tokens.goldBorder : 'rgba(179,136,255,0.30)',
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: tokens.textMuted, fontFamily: 'monospace' }}>
            {resultDate}
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField
            label="DRAW DATE"
            type="date"
            size="small"
            value={resultDate}
            onChange={(e) => setResultDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'aria-label': 'Select draw date' }}
          />
          <TextField
            label="DRAW NUMBER"
            size="small"
            value={drawNumber}
            onChange={(e) => setDrawNumber(e.target.value)}
            inputProps={{ 'aria-label': 'Enter draw number', inputMode: 'numeric' }}
          />
        </Box>
      </Paper>

      {/* ── Stepper header ── */}
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
                  display: { xs: 'none', sm: 'block' },
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
        {activeStep === 2 && <StepGenerate onBack={back} session={session} />}
      </Paper>
    </Box>
  );
}
