import React, { memo, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import useLotteryStore from '../store/useLotteryStore';
import { tokens } from '../theme';

const RANK_OPTIONS = [
  { value: '1st',         label: '🥇 1st Prize' },
  { value: '2nd',         label: '🥈 2nd Prize' },
  { value: '3rd',         label: '🥉 3rd Prize' },
  { value: '4th',         label: '4th Prize' },
  { value: '5th',         label: '5th Prize' },
  { value: 'consolation', label: '⭐ Consolation' },
];

const RANK_COLORS = {
  '1st': '#FFD700',
  '2nd': '#C0C0C0',
  '3rd': '#CD7F32',
  '4th': tokens.gold,
  '5th': tokens.gold,
  consolation: tokens.purple,
};

/**
 * NumberRow — memoized row in the parsed-numbers list.
 * Only re-renders when its own data changes.
 */
const NumberRow = memo(function NumberRow({ id, number, rank, index }) {
  const updateNumberRank = useLotteryStore((s) => s.updateNumberRank);
  const removeNumber     = useLotteryStore((s) => s.removeNumber);

  const handleRankChange = useCallback(
    (e) => updateNumberRank(id, e.target.value),
    [id, updateNumberRank]
  );

  const handleRemove = useCallback(
    () => removeNumber(id),
    [id, removeNumber]
  );

  const chipColor = RANK_COLORS[rank] || tokens.textSecondary;
  const selectId  = `rank-select-${id}`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.5 },
        py: 0.8,
        px: { xs: 1, sm: 1.5 },
        borderRadius: '8px',
        background: index % 2 === 0
          ? 'rgba(255,255,255,0.015)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${tokens.border}`,
        mb: 0.5,
        transition: 'background 0.15s ease, border-color 0.15s ease',
        '&:hover': {
          background: tokens.goldMuted,
          borderColor: tokens.goldBorder,
        },
      }}
    >
      {/* Index */}
      <Typography
        variant="caption"
        aria-hidden="true"
        sx={{
          width: 26,
          textAlign: 'center',
          color: tokens.textMuted,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {index + 1}
      </Typography>

      {/* Number chip */}
      <Chip
        label={number}
        size="small"
        aria-label={`Number ${number}`}
        sx={{
          fontWeight: 700,
          fontSize: '0.82rem',
          minWidth: 68,
          fontFamily: 'monospace',
          background: `${chipColor}18`,
          color: chipColor,
          border: `1px solid ${chipColor}3A`,
          borderRadius: '6px',
          height: 26,
          flexShrink: 0,
        }}
      />

      {/* Rank selector */}
      <FormControl size="small" sx={{ flexGrow: 1, minWidth: { xs: 110, sm: 140 } }}>
        <Select
          id={selectId}
          value={rank}
          onChange={handleRankChange}
          displayEmpty
          inputProps={{ 'aria-label': `Assign rank to number ${number}` }}
          renderValue={(v) =>
            v ? (
              RANK_OPTIONS.find((o) => o.value === v)?.label || v
            ) : (
              <em style={{ opacity: 0.38, fontSize: '0.8rem' }}>No rank</em>
            )
          }
          sx={{
            fontSize: '0.8rem',
            '& .MuiSelect-select': { py: 0.6 },
          }}
        >
          <MenuItem value="" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            <em>No Rank</em>
          </MenuItem>
          {RANK_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.82rem' }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Delete button */}
      <Tooltip title={`Remove ${number}`}>
        <IconButton
          size="small"
          onClick={handleRemove}
          aria-label={`Remove number ${number}`}
          sx={{
            color: tokens.textMuted,
            flexShrink: 0,
            padding: '4px',
            '&:hover': {
              color: tokens.crimsonLight,
              background: tokens.crimsonMuted,
            },
          }}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

export default NumberRow;
