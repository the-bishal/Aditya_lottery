import React, { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import Looks4Icon from '@mui/icons-material/Looks4';
import Looks5Icon from '@mui/icons-material/Looks5';
import SortIcon from '@mui/icons-material/Sort';

import { DEFAULT_POSTER_DATA } from '../utils/defaultPosterData';
import {
  renderPosterOnCanvas,
  DAY_KEYS,
  DAY_LABELS,
  resolveDayKey,
  sortNumbersAscending,
  arrange5thPrizeGrid,
} from '../utils/posterCanvasRenderer';
import useLotteryStore from '../store/useLotteryStore';

export default function PosterDesigner({ session = 'morning' }) {
  const store = useLotteryStore();
  const isMorning = session === 'morning';
  const [templateSession, setTemplateSession] = useState(isMorning ? 'morning' : 'evening');

  // ── Extract winning data helper ─────────────────────────────────────────────
  const extractWinningDataFromStore = useCallback(() => {
    const isCurrentSession = !session || session === store.activeSession;
    const directArrays = (isCurrentSession ? store.rankArrays : store.sessionData?.[session]?.rankArrays) || store.rankArrays || {};

    const ra = {
      '1CR': [...(directArrays['1CR'] || [])],
      '2ND': [...(directArrays['2ND'] || [])],
      '3RD': [...(directArrays['3RD'] || [])],
      '4TH': [...(directArrays['4TH'] || [])],
      '5TH': [...(directArrays['5TH'] || [])],
    };

    // Also include any ocrEntries assigned to ranks that haven't been placed yet
    const entries = store.ocrEntries || [];
    if (entries.length > 0) {
      for (const entry of entries) {
        const r = (entry.rank || '').toUpperCase().trim();
        let num = (entry.number || '').trim();
        if (['2ND', '3RD', '4TH', '5TH'].includes(r)) {
          num = num.replace(/\D/g, '');
        }
        if (r && ra[r] && num) {
          if (!ra[r].includes(num)) {
            ra[r].push(num);
          }
        }
      }
    }

    const metaDate = (isCurrentSession ? store.resultDate : store.sessionData?.[session]?.resultDate) || store.resultDate;
    const metaDrawNum = (isCurrentSession ? store.drawNumber : store.sessionData?.[session]?.drawNumber) || store.drawNumber;

    const patch = {};
    let hasAnyWinner = false;

    if (ra['1CR']?.length > 0) {
      const ticket = String(ra['1CR'][0]).trim();
      patch.firstPrizeTicket = ticket;
      const m = ticket.match(/\d{5}$/) || ticket.match(/\d{5}/);
      if (m) patch.consPrizeNumber = m[0];
      hasAnyWinner = true;
    }

    // Check for explicit consolation entry in ocrEntries
    const consEntry = entries.find(
      (e) => /cons/i.test(e.rank || '') || /cons/i.test(e.raw || '') || /cons/i.test(e.source || '')
    );
    if (consEntry && consEntry.number) {
      const m = consEntry.number.match(/\d{5}/);
      if (m) patch.consPrizeNumber = m[0];
    }

    if (ra['2ND']?.length > 0) {
      patch.secondPrizeNumbers = sortNumbersAscending(ra['2ND']);
      hasAnyWinner = true;
    }

    if (ra['3RD']?.length > 0) {
      patch.thirdPrizeNumbers = sortNumbersAscending(ra['3RD']);
      hasAnyWinner = true;
    }

    if (ra['4TH']?.length > 0) {
      patch.fourthPrizeNumbers = sortNumbersAscending(ra['4TH']);
      hasAnyWinner = true;
    }

    if (ra['5TH']?.length > 0) {
      patch.fifthPrizeNumbers = arrange5thPrizeGrid(ra['5TH']);
      hasAnyWinner = true;
    }

    if (metaDate) {
      try {
        const d = new Date(metaDate);
        if (!isNaN(d.getTime())) {
          const pad = (n) => String(n).padStart(2, '0');
          patch.drawDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
          patch.day = DAY_KEYS[d.getDay()];
        }
      } catch { /* keep existing */ }
    }

    if (metaDrawNum) {
      patch.drawNumber = String(metaDrawNum);
    }

    return { patch, hasAnyWinner };
  }, [session, store]);

  // Only dynamic overlay fields
  const [posterData, setPosterData] = useState(() => {
    const initial = JSON.parse(JSON.stringify(DEFAULT_POSTER_DATA));
    const now = new Date();
    const todayDayKey = DAY_KEYS[now.getDay()];
    const pad = (n) => String(n).padStart(2, '0');
    const todayFormatted = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

    initial.day = todayDayKey;
    initial.drawDate = todayFormatted;

    if (!isMorning) {
      initial.drawTime     = '9 PM';
      initial.drawSubtitle = 'GOLD THURSDAY WEEKLY LOTTERY';
    }

    // Immediately overlay store winning numbers if present on mount
    const isCurrentSession = !session || session === store.activeSession;
    const directArrays = (isCurrentSession ? store.rankArrays : store.sessionData?.[session]?.rankArrays) || store.rankArrays || {};
    const entries = store.ocrEntries || [];

    const ra = {
      '1CR': [...(directArrays['1CR'] || [])],
      '2ND': [...(directArrays['2ND'] || [])],
      '3RD': [...(directArrays['3RD'] || [])],
      '4TH': [...(directArrays['4TH'] || [])],
      '5TH': [...(directArrays['5TH'] || [])],
    };
    for (const entry of entries) {
      const r = (entry.rank || '').toUpperCase().trim();
      let num = (entry.number || '').trim();
      if (['2ND', '3RD', '4TH', '5TH'].includes(r)) num = num.replace(/\D/g, '');
      if (r && ra[r] && num && !ra[r].includes(num)) ra[r].push(num);
    }

    if (ra['1CR']?.length > 0) {
      initial.firstPrizeTicket = String(ra['1CR'][0]).trim();
      const m = initial.firstPrizeTicket.match(/\d{5}$/) || initial.firstPrizeTicket.match(/\d{5}/);
      if (m) initial.consPrizeNumber = m[0];
    }
    if (ra['2ND']?.length > 0) initial.secondPrizeNumbers = sortNumbersAscending(ra['2ND']);
    if (ra['3RD']?.length > 0) initial.thirdPrizeNumbers  = sortNumbersAscending(ra['3RD']);
    if (ra['4TH']?.length > 0) initial.fourthPrizeNumbers = sortNumbersAscending(ra['4TH']);
    if (ra['5TH']?.length > 0) initial.fifthPrizeNumbers  = arrange5thPrizeGrid(ra['5TH']);

    const metaDate = (isCurrentSession ? store.resultDate : store.sessionData?.[session]?.resultDate) || store.resultDate;
    if (metaDate) {
      try {
        const d = new Date(metaDate);
        if (!isNaN(d.getTime())) {
          initial.drawDate = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
          initial.day = DAY_KEYS[d.getDay()];
        }
      } catch { /* ignore */ }
    }
    const metaDrawNum = (isCurrentSession ? store.drawNumber : store.sessionData?.[session]?.drawNumber) || store.drawNumber;
    if (metaDrawNum) initial.drawNumber = String(metaDrawNum);

    return initial;
  });

  // UI & Canvas Controls
  const [zoom, setZoom]               = useState(0.72);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [notice, setNotice]           = useState('');
  const [rendering, setRendering]     = useState(false);

  const canvasRef = useRef(null);

  // ── Sync winning numbers from store ────────────────────────────────────────
  const syncFromStore = useCallback((silent = false) => {
    const { patch, hasAnyWinner } = extractWinningDataFromStore();
    if (hasAnyWinner || patch.drawDate || patch.drawNumber) {
      setPosterData((prev) => ({ ...prev, ...patch }));
      if (!silent) {
        showNotification('Synced winning numbers from current draw session!');
      }
    }
  }, [extractWinningDataFromStore]);

  // Keep posterData in sync whenever store updates
  useEffect(() => {
    syncFromStore(true);
  }, [store.rankArrays, store.ocrEntries, store.resultDate, store.drawNumber, syncFromStore]);

  const activeDay = posterData.day || resolveDayKey(null, posterData.drawDate, posterData.drawSubtitle);

  // Re-render canvas on any data change
  const executeRender = useCallback(async () => {
    if (!canvasRef.current) return;
    setRendering(true);
    try {
      await renderPosterOnCanvas(canvasRef.current, posterData, {
        session: templateSession,
        day: posterData.day || activeDay,
        scale: 1,
      });
    } catch (err) {
      console.error('Canvas render error:', err);
    } finally {
      setRendering(false);
    }
  }, [posterData, templateSession, activeDay]);

  useEffect(() => { executeRender(); }, [executeRender]);

  const showNotification = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleFieldChange = (key, value) => {
    setPosterData(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'drawDate') {
        // Automatically sync day to the newly typed date
        next.day = resolveDayKey(null, value, prev.drawSubtitle);
      }
      return next;
    });
  };

  const handleArrayFieldChange = (key, rawText) => {
    const numbers = rawText.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
    setPosterData(prev => ({ ...prev, [key]: numbers }));
  };

  const handleSortAllAscending = () => {
    setPosterData((prev) => ({
      ...prev,
      secondPrizeNumbers: sortNumbersAscending(prev.secondPrizeNumbers || []),
      thirdPrizeNumbers: sortNumbersAscending(prev.thirdPrizeNumbers || []),
      fourthPrizeNumbers: sortNumbersAscending(prev.fourthPrizeNumbers || []),
      fifthPrizeNumbers: arrange5thPrizeGrid(prev.fifthPrizeNumbers || []),
    }));
    showNotification('All prize numbers arranged in ascending order!');
  };

  // ── Export Helpers ──────────────────────────────────────────────────────────
  const exportCanvas = async (type = 'image/png', quality = 0.95) => {
    try {
      // Use the live canvas element if available for instant, 100% accurate export
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        await renderPosterOnCanvas(canvas, posterData, {
          session: templateSession,
          day: posterData.day || activeDay,
          scale: 1,
        });
      }

      const d = (posterData.drawDate || 'draw').replace(/[\/\.]/g, '-');
      const t = (posterData.drawTime || 'time').replace(/\s+/g, '');
      const daySuffix = (posterData.day || activeDay).toUpperCase();
      const ext = type === 'image/png' ? 'png' : 'jpg';
      const fileName = `Rajshree_${templateSession}_${daySuffix}_${d}_${t}.${ext}`;

      const triggerDownload = (downloadUrl) => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 200);
        showNotification(`Downloaded ${ext.toUpperCase()} (753 × 1024)`);
      };

      if (canvas.toBlob) {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              triggerDownload(url);
              // Delay revocation so download manager has plenty of time to save
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            } else {
              // Fallback to data URL
              const dataUrl = canvas.toDataURL(type, quality);
              triggerDownload(dataUrl);
            }
          },
          type,
          quality
        );
      } else {
        const dataUrl = canvas.toDataURL(type, quality);
        triggerDownload(dataUrl);
      }
    } catch (err) {
      console.error('Export error:', err);
      showNotification(`Export failed: ${err.message}`);
    }
  };

  const handleCopyClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedSuccess(true);
        showNotification('Poster image copied to clipboard!');
        setTimeout(() => setCopiedSuccess(false), 3000);
      }, 'image/png');
    } catch {
      showNotification('Clipboard write not supported on this browser.');
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all fields to the default sample values?')) {
      const initial = JSON.parse(JSON.stringify(DEFAULT_POSTER_DATA));
      if (!isMorning) {
        initial.drawTime     = '9 PM';
        initial.drawSubtitle = 'GOLD THURSDAY WEEKLY LOTTERY';
      }
      setPosterData(initial);
      showNotification('Reset to default values');
    }
  };

  // ── Label helpers ───────────────────────────────────────────────────────────
  const sectionLabel = (icon, text, color = '#00d2ff') => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography variant="body2" sx={{ fontWeight: 700, color }}>{text}</Typography>
    </Box>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      {/* Notification */}
      {notice && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px' }}>
          {notice}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left: Fields Panel ── */}
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              bgcolor: '#131c2e',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              maxHeight: '850px',
              overflowY: 'auto',
            }}
          >
            {/* Header toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff' }}>
                  Result Fields
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Only the dynamic data overlaid on the template
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title="Arrange 2nd, 3rd, 4th, and 5th prize numbers in ascending order">
                  <Button
                    size="small" variant="outlined"
                    startIcon={<SortIcon />}
                    onClick={handleSortAllAscending}
                    sx={{ borderColor: 'rgba(105,240,174,0.4)', color: '#69F0AE', fontSize: '0.75rem', '&:hover': { borderColor: '#69F0AE', background: 'rgba(105,240,174,0.08)' } }}
                  >
                    Sort Ascending
                  </Button>
                </Tooltip>
                <Tooltip title="Sync winning numbers from Step 2">
                  <Button
                    size="small" variant="outlined"
                    startIcon={<SyncIcon />}
                    onClick={syncFromStore}
                    sx={{ borderColor: 'rgba(0,210,255,0.4)', color: '#00d2ff', fontSize: '0.75rem' }}
                  >
                    Sync Draw
                  </Button>
                </Tooltip>
                <Tooltip title="Reset to sample values">
                  <IconButton size="small" onClick={handleResetToDefault} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Session Toggle */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, p: 0.5,
              bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { key: 'morning', label: '☀️ Morning (2 PM)', time: '2 PM', sub: 'DIAMOND SUNDAY WEEKLY LOTTERY',
                  bg: 'linear-gradient(135deg, #FFB300, #F57C00)', border: 'rgba(255,179,0,0.4)', shadow: 'rgba(245,124,0,0.35)' },
                { key: 'evening', label: '🌙 Evening (9 PM)', time: '9 PM', sub: 'GOLD THURSDAY WEEKLY LOTTERY',
                  bg: 'linear-gradient(135deg, #7C4DFF, #651FFF)', border: 'rgba(124,77,255,0.4)', shadow: 'rgba(101,31,255,0.35)' },
              ].map(({ key, label, time, sub, bg, border, shadow }) => (
                <Button
                  key={key}
                  size="small"
                  variant={templateSession === key ? 'contained' : 'outlined'}
                  onClick={() => {
                    setTemplateSession(key);
                    setPosterData(prev => ({ ...prev, drawTime: time, drawSubtitle: sub }));
                  }}
                  sx={{
                    fontWeight: 800, fontSize: '0.75rem', py: 0.75,
                    background: templateSession === key ? bg : 'transparent',
                    color: '#fff', borderColor: border,
                    boxShadow: templateSession === key ? `0 4px 12px ${shadow}` : 'none',
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>

            {/* Day of Week Selector */}
            <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Weekday Template
                </Typography>
                <Chip
                  size="small"
                  label={DAY_LABELS[activeDay] || activeDay}
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    bgcolor: templateSession === 'morning' ? 'rgba(255,179,0,0.15)' : 'rgba(124,77,255,0.18)',
                    color: templateSession === 'morning' ? '#FFB300' : '#B388FF',
                    border: `1px solid ${templateSession === 'morning' ? 'rgba(255,179,0,0.35)' : 'rgba(124,77,255,0.35)'}`,
                  }}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {DAY_KEYS.map((dk) => {
                  const isSelected = activeDay === dk;
                  const dayShort = dk.slice(0, 3).toUpperCase();
                  return (
                    <Button
                      key={dk}
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setPosterData(prev => ({ ...prev, day: dk }))}
                      sx={{
                        minWidth: 0,
                        px: 0.25,
                        py: 0.5,
                        fontSize: '0.68rem',
                        fontWeight: isSelected ? 900 : 600,
                        background: isSelected
                          ? (templateSession === 'morning' ? 'linear-gradient(135deg, #FFB300, #F57C00)' : 'linear-gradient(135deg, #7C4DFF, #651FFF)')
                          : 'transparent',
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
                        borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.1)',
                        '&:hover': {
                          borderColor: isSelected ? 'transparent' : 'rgba(255,255,255,0.3)',
                          bgcolor: isSelected ? undefined : 'rgba(255,255,255,0.06)',
                        },
                      }}
                    >
                      {dayShort}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />

            {/* ── Accordion 1: Draw Header ── */}
            <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d2ff' }} />}>
                {sectionLabel(<LooksOneIcon fontSize="small" />, 'Draw Info')}
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField
                    label="Draw Number"
                    size="small"
                    value={posterData.drawNumber}
                    onChange={(e) => handleFieldChange('drawNumber', e.target.value)}
                    inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 } }}
                  />
                  <TextField
                    label="Draw Date (DD/MM/YYYY)"
                    size="small"
                    value={posterData.drawDate}
                    onChange={(e) => handleFieldChange('drawDate', e.target.value)}
                    inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 } }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* ── Accordion 2: 1st Prize & Consolation ── */}
            <Accordion defaultExpanded sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#FFB300' }} />}>
                {sectionLabel(<LooksTwoIcon fontSize="small" />, '1st Prize & Consolation', '#FFB300')}
              </AccordionSummary>
              <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="1st Prize Ticket (e.g. 43C 35972)"
                  size="small"
                  fullWidth
                  value={posterData.firstPrizeTicket}
                  onChange={(e) => handleFieldChange('firstPrizeTicket', e.target.value)}
                  helperText="Series letters + space + 5 digits"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.08em' } }}
                />
                <TextField
                  label="Consolation Last-5 Digits"
                  size="small"
                  fullWidth
                  value={posterData.consPrizeNumber}
                  onChange={(e) => handleFieldChange('consPrizeNumber', e.target.value)}
                  helperText="The 5-digit number shown after 'for Seller ₹500/-'"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900 } }}
                />
              </AccordionDetails>
            </Accordion>

            {/* ── Accordion 3: 2nd Prize ── */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#F5C518' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {sectionLabel(<Looks3Icon fontSize="small" />, '2nd Prize Numbers', '#F5C518')}
                  <Chip
                    label={`${posterData.secondPrizeNumbers?.length || 0} / 10`}
                    size="small"
                    color={posterData.secondPrizeNumbers?.length === 10 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  multiline rows={3} size="small" fullWidth
                  value={posterData.secondPrizeNumbers?.join(' ') || ''}
                  onChange={(e) => handleArrayFieldChange('secondPrizeNumbers', e.target.value)}
                  helperText="10 space-separated 5-digit numbers"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em' } }}
                />
              </AccordionDetails>
            </Accordion>

            {/* ── Accordion 4: 3rd Prize ── */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00E5FF' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {sectionLabel(<Looks4Icon fontSize="small" />, '3rd Prize Numbers', '#00E5FF')}
                  <Chip
                    label={`${posterData.thirdPrizeNumbers?.length || 0} / 15`}
                    size="small"
                    color={posterData.thirdPrizeNumbers?.length === 15 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  multiline rows={3} size="small" fullWidth
                  value={posterData.thirdPrizeNumbers?.join(' ') || ''}
                  onChange={(e) => handleArrayFieldChange('thirdPrizeNumbers', e.target.value)}
                  helperText="15 space-separated 4-digit numbers"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em' } }}
                />
              </AccordionDetails>
            </Accordion>

            {/* ── Accordion 5: 4th Prize ── */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#B388FF' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {sectionLabel(<Looks5Icon fontSize="small" />, '4th Prize Numbers', '#B388FF')}
                  <Chip
                    label={`${posterData.fourthPrizeNumbers?.length || 0} / 15`}
                    size="small"
                    color={posterData.fourthPrizeNumbers?.length === 15 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  multiline rows={3} size="small" fullWidth
                  value={posterData.fourthPrizeNumbers?.join(' ') || ''}
                  onChange={(e) => handleArrayFieldChange('fourthPrizeNumbers', e.target.value)}
                  helperText="15 space-separated 4-digit numbers"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.04em' } }}
                />
              </AccordionDetails>
            </Accordion>

            {/* ── Accordion 6: 5th Prize ── */}
            <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '8px !important' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#69F0AE' }} />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {sectionLabel(<LooksOneIcon fontSize="small" />, '5th Prize Numbers (10×10 Grid)', '#69F0AE')}
                  <Chip
                    label={`${posterData.fifthPrizeNumbers?.length || 0} / 100`}
                    size="small"
                    color={posterData.fifthPrizeNumbers?.length === 100 ? 'success' : 'warning'}
                    sx={{ height: 20, fontSize: '0.7rem', ml: 1 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  label="100 Numbers (space/newline/comma separated)"
                  multiline rows={8} size="small" fullWidth
                  value={posterData.fifthPrizeNumbers?.join(' ') || ''}
                  onChange={(e) => handleArrayFieldChange('fifthPrizeNumbers', e.target.value)}
                  helperText="Leading zeros are strictly preserved (e.g. 0044, 0847)"
                  inputProps={{ style: { fontFamily: "'Arial Black', Arial, sans-serif", fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.03em' } }}
                />
              </AccordionDetails>
            </Accordion>
          </Paper>
        </Grid>

        {/* ── Right: Canvas Preview & Export ── */}
        <Grid item xs={12} lg={7}>
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              bgcolor: '#131c2e',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '850px',
            }}
          >
            {/* Canvas toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#fff' }}>
                  Live Preview
                </Typography>
                <Chip label="753 × 1024" size="small"
                  sx={{ bgcolor: 'rgba(0,210,255,0.15)', color: '#00d2ff', fontWeight: 700 }} />
              </Box>

              {/* Zoom controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" onClick={() => setZoom(z => Math.max(0.3, z - 0.08))} sx={{ color: '#fff' }}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ color: '#00d2ff', fontWeight: 800, minWidth: 40, textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </Typography>
                <IconButton size="small" onClick={() => setZoom(z => Math.min(1.4, z + 0.08))} sx={{ color: '#fff' }}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setZoom(0.72)} title="Reset zoom" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <CenterFocusStrongIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Canvas viewport */}
            <Box sx={{
              flexGrow: 1, bgcolor: '#0a0e17', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'auto', display: 'flex', alignItems: 'center',
              justifyContent: 'center', p: 3, minHeight: '620px', position: 'relative',
            }}>
              {rendering && (
                <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10,
                  bgcolor: 'rgba(0,0,0,0.6)', borderRadius: '20px', px: 1.5, py: 0.5,
                  display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: '#00d2ff' }} />
                  <Typography variant="caption" sx={{ color: '#fff' }}>Re-drawing…</Typography>
                </Box>
              )}

              <Box
                component="canvas"
                ref={canvasRef}
                sx={{
                  width: `${753 * zoom}px`,
                  height: `${1024 * zoom}px`,
                  boxShadow: '0 16px 45px rgba(0,0,0,0.85)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  transition: 'width 0.15s ease, height 0.15s ease',
                }}
              />
            </Box>

            {/* Export actions */}
            <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportCanvas('image/png')}
                  sx={{ background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
                    fontWeight: 800, px: 3, boxShadow: '0 4px 15px rgba(0,114,255,0.4)' }}
                >
                  Download PNG
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportCanvas('image/jpeg', 0.95)}
                  sx={{ borderColor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 600 }}
                >
                  Download JPG
                </Button>
              </Box>

              <Button
                variant="outlined"
                startIcon={copiedSuccess ? <CheckCircleIcon /> : <ContentCopyIcon />}
                onClick={handleCopyClipboard}
                sx={{
                  borderColor: copiedSuccess ? '#10b981' : 'rgba(0,210,255,0.4)',
                  color: copiedSuccess ? '#10b981' : '#00d2ff', fontWeight: 600,
                }}
              >
                {copiedSuccess ? 'Copied!' : 'Copy Image'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
