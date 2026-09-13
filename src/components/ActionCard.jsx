import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { tokens } from '../theme';

/**
 * ActionCard — glassmorphism navigation card for the Home page.
 *
 * Props:
 *   icon        {ReactNode}
 *   title       {string}
 *   description {string}
 *   to          {string}      react-router route
 *   accentColor {string}
 *   delay       {number}      animation delay in ms
 */
const ActionCard = memo(function ActionCard({
  icon,
  title,
  description,
  to,
  accentColor = '#F5C518',
  delay = 0,
}) {
  const navigate = useNavigate();

  const handleClick = () => navigate(to);
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(to);
    }
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Go to ${title}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      sx={{
        // Glass surface
        background: 'rgba(24, 24, 52, 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',

        // Layout
        p: { xs: 2.5, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        minHeight: { xs: 160, sm: 190 },

        // Subtle top border line
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`,
          transition: 'opacity 0.25s ease',
          opacity: 0,
        },

        // Transitions
        transition: 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease',

        '&:hover': {
          border: `1px solid ${accentColor}40`,
          boxShadow: `0 0 0 1px ${accentColor}20, 0 8px 32px rgba(0,0,0,0.45)`,
          transform: 'translateY(-3px)',
          '&::before': { opacity: 1 },
          '& .card-icon': {
            background: `linear-gradient(135deg, ${accentColor}28 0%, ${accentColor}48 100%)`,
            border: `1px solid ${accentColor}50`,
          },
          '& .card-arrow': { opacity: 1, transform: 'translateX(0)' },
        },

        '&:focus-visible': {
          outline: `2px solid ${accentColor}`,
          outlineOffset: '3px',
          borderColor: `${accentColor}50`,
        },

        '&:active': { transform: 'translateY(-1px)' },
      }}
    >
      {/* Icon */}
      <Box
        className="card-icon"
        aria-hidden="true"
        sx={{
          width: 52,
          height: 52,
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${accentColor}18 0%, ${accentColor}30 100%)`,
          border: `1px solid ${accentColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          fontSize: 26,
          transition: 'all 0.22s ease',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      {/* Text */}
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.05rem' },
            color: tokens.textPrimary,
            mb: 0.75,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: tokens.textSecondary,
            lineHeight: 1.65,
            fontSize: { xs: '0.82rem', sm: '0.85rem' },
          }}
        >
          {description}
        </Typography>
      </Box>

      {/* Arrow CTA */}
      <Box
        className="card-arrow"
        aria-hidden="true"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: accentColor,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          opacity: 0,
          transform: 'translateX(-6px)',
          transition: 'all 0.22s ease',
          alignSelf: 'flex-end',
        }}
      >
        Open
        <ArrowForwardIcon sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  );
});

export default ActionCard;
