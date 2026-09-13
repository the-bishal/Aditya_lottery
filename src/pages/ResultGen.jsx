import React from 'react';
import Container from '@mui/material/Container';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PageHeader from '../components/PageHeader';
import StepperComponent from '../components/StepperComponent';
import { tokens } from '../theme';

export default function ResultGen() {
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
        subtitle="3-step workflow: Exclude → Scan → Export"
        breadcrumb="Result Generation"
      />
      <StepperComponent />
    </Container>
  );
}
