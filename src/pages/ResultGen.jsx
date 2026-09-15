import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import PageHeader from '../components/PageHeader';
import StepperComponent from '../components/StepperComponent';
import useLotteryStore from '../store/useLotteryStore';
import { tokens } from '../theme';

export default function ResultGen({ session: propSession }) {
  const { session: paramSession } = useParams();
  const navigate = useNavigate();

  // Determine active session: propSession takes priority, else paramSession, fallback to 'morning'
  const rawSession = propSession || paramSession || 'morning';
  const session = rawSession.toLowerCase() === 'evening' ? 'evening' : 'morning';
  const isMorning = session === 'morning';

  const switchSession = useLotteryStore((s) => s.switchSession);
  const activeSession = useLotteryStore((s) => s.activeSession);

  // Synchronize store with the active route session
  useEffect(() => {
    switchSession(session);
  }, [session, switchSession]);

  const otherSession = isMorning ? 'evening' : 'morning';
  const otherPath = `/result/${otherSession}`;

  const headerConfig = isMorning
    ? {
        title: 'Morning Result Generation',
        subtitle: 'Morning Draw Session (02:00 PM) — Exclude → Scan → Export',
        breadcrumbLabel: 'Morning Draw',
        icon: <WbSunnyRoundedIcon fontSize="inherit" />,
        iconBg: 'rgba(245,197,24,0.14)',
        iconColor: tokens.gold,
        accent: tokens.gold,
        badgeTag: '☀️ 02:00 PM DRAW',
        switchLabel: 'Switch to Evening Draw 🌙',
      }
    : {
        title: 'Evening Result Generation',
        subtitle: 'Evening Draw Session (09:00 PM) — Exclude → Scan → Export',
        breadcrumbLabel: 'Evening Draw',
        icon: <BedtimeRoundedIcon fontSize="inherit" />,
        iconBg: 'rgba(179,136,255,0.16)',
        iconColor: '#B388FF',
        accent: '#B388FF',
        badgeTag: '🌙 09:00 PM DRAW',
        switchLabel: 'Switch to Morning Draw ☀️',
      };

  return (
    <Container
      maxWidth="lg"
      className="page-content"
      sx={{ py: { xs: 3, sm: 4, md: 5 } }}
    >
      <PageHeader
        icon={headerConfig.icon}
        iconBg={headerConfig.iconBg}
        iconColor={headerConfig.iconColor}
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        breadcrumbs={[
          { label: 'Result Generation', path: '/result' },
          { label: headerConfig.breadcrumbLabel },
        ]}
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Slot indicator chip */}
            <Chip
              label={headerConfig.badgeTag}
              size="small"
              sx={{
                background: headerConfig.iconBg,
                color: headerConfig.iconColor,
                border: `1px solid ${headerConfig.accent}40`,
                fontWeight: 700,
                fontSize: '0.75rem',
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            />

            {/* Quick toggle to opposite session */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<SwapHorizRoundedIcon />}
              onClick={() => navigate(otherPath)}
              sx={{
                borderRadius: '9px',
                fontSize: '0.8rem',
                fontWeight: 600,
                py: 0.7,
                px: 1.5,
                borderColor: `${headerConfig.accent}45`,
                color: headerConfig.iconColor,
                background: 'rgba(255,255,255,0.02)',
                '&:hover': {
                  borderColor: headerConfig.accent,
                  background: headerConfig.iconBg,
                  color: headerConfig.iconColor,
                },
              }}
            >
              {headerConfig.switchLabel}
            </Button>

            {/* Back to session selection */}
            <Button
              variant="text"
              size="small"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => navigate('/result')}
              sx={{
                borderRadius: '9px',
                fontSize: '0.8rem',
                color: tokens.textSecondary,
                display: { xs: 'none', md: 'inline-flex' },
                '&:hover': { color: tokens.textPrimary },
              }}
            >
              All Draws
            </Button>
          </Stack>
        }
      />

      {/* 3-step workflow (shared component, isolated session state) */}
      <StepperComponent session={session} />
    </Container>
  );
}
