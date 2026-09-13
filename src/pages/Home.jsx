import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CasinoIcon from '@mui/icons-material/Casino';
import ImageSearchIcon from '@mui/icons-material/ImageSearch';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ActionCard from '../components/ActionCard';
import { tokens } from '../theme';

// ── Subtle star-field background ──────────────────────────────────────────────
const Particles = React.memo(function Particles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id:       i,
        left:     `${5 + (i * 6.25) % 95}%`,
        top:      `${8 + (i * 11.3) % 84}%`,
        size:     `${2 + (i % 3)}px`,
        delay:    `${(i * 0.4) % 4}s`,
        duration: `${4 + (i % 3)}s`,
      })),
    []
  );

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <Box
          key={p.id}
          sx={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: tokens.gold,
            opacity: 0.12,
            animation: `twinkle ${p.duration} ${p.delay} ease-in-out infinite`,
          }}
        />
      ))}
    </Box>
  );
});

const CARDS = [
  {
    icon: <EmojiEventsIcon fontSize="inherit" />,
    title: 'Result Generation',
    description: 'Scan lottery ticket images with OCR, assign prize ranks, and export a polished result image.',
    to: '/result',
    accentColor: tokens.gold,
    delay: 0,
  },
  {
    icon: <ImageSearchIcon fontSize="inherit" />,
    title: 'Hardcopy Numbers',
    description: 'Extract numbers from physical ticket scans and archive them digitally with one click.',
    to: '/hardcopy',
    accentColor: tokens.crimson,
    delay: 60,
  },
  {
    icon: <FormatListNumberedIcon fontSize="inherit" />,
    title: 'Middle Numbers',
    description: 'Instantly compute the center numbers for any lottery range with a configurable count.',
    to: '/middle-numbers',
    accentColor: tokens.purple,
    delay: 120,
  },
];

const TAGS = ['OCR Powered', 'Offline First', 'One-Click Export'];

export default function Home() {
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Particles />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          py: { xs: 5, sm: 7, md: 9 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <Box
          component="section"
          aria-labelledby="hero-heading"
          sx={{
            textAlign: 'center',
            mb: { xs: 6, sm: 7 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 2, sm: 2.5 },
          }}
        >
          {/* Logo */}
          <Box
            aria-hidden="true"
            sx={{
              width: { xs: 80, sm: 96 },
              height: { xs: 80, sm: 96 },
              borderRadius: { xs: '22px', sm: '26px' },
              background: `linear-gradient(135deg, ${tokens.gold} 0%, ${tokens.crimson} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'glow-pulse 4s ease-in-out infinite',
              flexShrink: 0,
            }}
          >
            <CasinoIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: '#0D0D1A' }} />
          </Box>

          {/* Heading */}
          <Box>
            <Typography
              id="hero-heading"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3.2rem' },
                lineHeight: 1.1,
                letterSpacing: '-1px',
                background: `linear-gradient(135deg, ${tokens.gold} 0%, ${tokens.goldLight} 45%, ${tokens.crimson} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Aditya Lottery
            </Typography>
            <Typography
              component="p"
              sx={{
                fontWeight: 400,
                color: tokens.textSecondary,
                mt: 0.5,
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
              }}
            >
              Admin Dashboard &nbsp;·&nbsp; Result Management
            </Typography>
          </Box>

          {/* Feature tags */}
          <Box
            role="list"
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {TAGS.map((tag) => (
              <Box
                key={tag}
                role="listitem"
                sx={{
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '20px',
                  border: `1px solid rgba(245,197,24,0.22)`,
                  background: tokens.goldMuted,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: tokens.gold,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {tag}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Cards ─────────────────────────────────────────────────── */}
        <Box
          component="section"
          aria-label="Main modules"
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: { xs: 2, sm: 2.5, md: 3 },
            flexGrow: 1,
          }}
        >
          {CARDS.map((card) => (
            <ActionCard key={card.to} {...card} />
          ))}
        </Box>

        {/* ── Footer note ───────────────────────────────────────────── */}
        <Box
          component="footer"
          sx={{
            textAlign: 'center',
            mt: { xs: 6, sm: 8 },
            pt: 3,
            borderTop: `1px solid ${tokens.border}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: tokens.textMuted,
              fontSize: '0.75rem',
              letterSpacing: '0.02em',
            }}
          >
            Aditya Lottery Admin &nbsp;·&nbsp; All data processed locally &nbsp;·&nbsp; No internet required
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
