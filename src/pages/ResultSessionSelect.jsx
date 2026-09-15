import React from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import PageHeader from '../components/PageHeader';
import { tokens } from '../theme';

const SESSIONS = [
  {
    id: 'morning',
    name: 'Morning Draw',
    time: '02:00 PM',
    path: '/result/morning',
    accent: tokens.gold,
    accentLight: tokens.goldLight,
    badgeBg: 'rgba(245,197,24,0.15)',
    glowBg: 'radial-gradient(circle at 50% 0%, rgba(245,197,24,0.18) 0%, transparent 70%)',
    iconBg: 'linear-gradient(135deg, rgba(245,197,24,0.25) 0%, rgba(255,161,0,0.15) 100%)',
    border: 'rgba(245,197,24,0.25)',
    borderHover: tokens.gold,
    icon: <WbSunnyRoundedIcon sx={{ fontSize: { xs: 34, sm: 42 }, color: tokens.gold }} />,
    tag: '02:00 PM SLOT',
    tagIcon: '☀️',
    summary: 'Morning Result Generation',
    description:
      'Configure previous exclusion codes, scan morning lottery tickets via OCR, auto-generate remaining prize tiers, and export the official morning result image.',
    highlights: [
      '02:00 PM Morning Draw slot',
      'Independent exclusion code pool',
      'Dedicated OCR ticket reader & auto-fill',
      'Morning result canvas export',
    ],
  },
  {
    id: 'evening',
    name: 'Evening Draw',
    time: '09:00 PM',
    path: '/result/evening',
    accent: '#B388FF',
    accentLight: '#D1C4E9',
    badgeBg: 'rgba(179,136,255,0.15)',
    glowBg: 'radial-gradient(circle at 50% 0%, rgba(179,136,255,0.18) 0%, transparent 70%)',
    iconBg: 'linear-gradient(135deg, rgba(124,77,255,0.25) 0%, rgba(106,27,154,0.15) 100%)',
    border: 'rgba(179,136,255,0.25)',
    borderHover: '#B388FF',
    icon: <BedtimeRoundedIcon sx={{ fontSize: { xs: 34, sm: 42 }, color: '#B388FF' }} />,
    tag: '09:00 PM SLOT',
    tagIcon: '🌙',
    summary: 'Evening Result Generation',
    description:
      'Configure previous exclusion codes, scan evening lottery tickets via OCR, auto-generate remaining prize tiers, and export the official evening result image.',
    highlights: [
      '09:00 PM Evening Draw slot',
      'Independent exclusion code pool',
      'Dedicated OCR ticket reader & auto-fill',
      'Evening result canvas export',
    ],
  },
];

export default function ResultSessionSelect() {
  const navigate = useNavigate();

  return (
    <Container
      maxWidth="lg"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={<EmojiEventsIcon fontSize="inherit" />}
        iconBg="rgba(245,197,24,0.12)"
        iconColor={tokens.gold}
        title="Result Generation"
        subtitle="Select a draw session to configure, scan tickets, and generate official results"
        breadcrumb="Result Generation"
      />

      <Box sx={{ mb: 4, textAlign: { xs: 'left', sm: 'center' } }}>
        <Typography
          variant="overline"
          sx={{
            color: tokens.gold,
            fontWeight: 800,
            letterSpacing: '0.12em',
            fontSize: '0.78rem',
            display: 'block',
            mb: 0.5,
          }}
        >
          DAILY DRAW SESSIONS
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.4rem', sm: '1.85rem' },
            color: tokens.textPrimary,
            letterSpacing: '-0.02em',
          }}
        >
          Choose Morning or Evening Draw
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: tokens.textSecondary,
            maxWidth: 600,
            mx: { xs: 0, sm: 'auto' },
            mt: 1,
            lineHeight: 1.6,
          }}
        >
          Both sessions provide the full 3-step workflow (Exclusion, OCR scanning, and Image Export)
          with completely separate, isolated winner data.
        </Typography>
      </Box>

      {/* Grid of Two Sessions */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 3, sm: 3.5, md: 4 },
        }}
      >
        {SESSIONS.map((sess) => (
          <Paper
            key={sess.id}
            elevation={0}
            onClick={() => navigate(sess.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(sess.path);
              }
            }}
            sx={{
              position: 'relative',
              borderRadius: '20px',
              p: { xs: 3, sm: 3.5, md: 4 },
              background: 'rgba(24, 24, 48, 0.70)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${sess.border}`,
              cursor: 'pointer',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
              '&:hover': {
                transform: 'translateY(-6px)',
                borderColor: sess.borderHover,
                boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${sess.accent}25`,
                '& .session-action-btn': {
                  background: sess.accent,
                  color: '#0D0D1A',
                  transform: 'translateX(4px)',
                },
                '& .session-icon-box': {
                  transform: 'scale(1.08) rotate(6deg)',
                },
              },
              '&:focus-visible': {
                outline: `2px solid ${sess.accent}`,
                outlineOffset: '4px',
              },
            }}
          >
            {/* Top ambient glow */}
            <Box
              aria-hidden="true"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '180px',
                background: sess.glowBg,
                pointerEvents: 'none',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Header row: Icon & Tag */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2.5,
                }}
              >
                <Box
                  className="session-icon-box"
                  sx={{
                    width: { xs: 58, sm: 68 },
                    height: { xs: 58, sm: 68 },
                    borderRadius: '16px',
                    background: sess.iconBg,
                    border: `1px solid ${sess.accent}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {sess.icon}
                </Box>

                <Chip
                  label={`${sess.tagIcon} ${sess.tag}`}
                  size="small"
                  sx={{
                    background: sess.badgeBg,
                    color: sess.accentLight,
                    border: `1px solid ${sess.accent}45`,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    fontSize: '0.75rem',
                    px: 0.5,
                  }}
                />
              </Box>

              {/* Title & Timing */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  component="h3"
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: sess.accentLight,
                    fontSize: { xs: '1.3rem', sm: '1.55rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {sess.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: tokens.textMuted,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Draw Time: {sess.time}
                </Typography>
              </Box>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  color: tokens.textSecondary,
                  lineHeight: 1.6,
                  mb: 3,
                  fontSize: '0.9rem',
                }}
              >
                {sess.description}
              </Typography>

              {/* Highlights */}
              <Stack spacing={1.2} sx={{ mb: 3.5 }}>
                {sess.highlights.map((h, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                    }}
                  >
                    <CheckCircleOutlineRoundedIcon
                      sx={{ fontSize: 18, color: sess.accent, flexShrink: 0 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: tokens.textPrimary,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Launch Button */}
            <Box sx={{ position: 'relative', zIndex: 1, pt: 2, borderTop: `1px solid ${tokens.border}` }}>
              <Button
                className="session-action-btn"
                variant="outlined"
                fullWidth
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(sess.path);
                }}
                sx={{
                  py: 1.3,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  borderColor: sess.border,
                  color: sess.accentLight,
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    borderColor: sess.accent,
                    background: sess.accent,
                    color: '#0D0D1A',
                  },
                }}
              >
                Open {sess.name}
              </Button>
            </Box>
          </Paper>
        ))}
      </Box>
    </Container>
  );
}
