import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { tokens } from '../theme';

/**
 * PageHeader — shared component for all inner pages.
 *
 * Props:
 *   icon         {ReactNode}   Page icon element
 *   iconBg       {string}      Background color for the icon box
 *   iconColor    {string}      Icon color
 *   title        {string}      Page title
 *   subtitle     {string}      Page subtitle / description
 *   breadcrumb   {string}      Current page breadcrumb label
 *   action       {ReactNode?}  Optional right-side action button
 */
export default function PageHeader({
  icon,
  iconBg = 'rgba(245,197,24,0.12)',
  iconColor = '#F5C518',
  title,
  subtitle,
  breadcrumb,
  breadcrumbs,
  action,
}) {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: { xs: 3, sm: 4 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 14, color: tokens.textMuted }} />}
        aria-label="breadcrumb"
        sx={{ mb: 2.5 }}
      >
        <Link
          component="button"
          underline="hover"
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            color: tokens.textSecondary,
            fontSize: '0.8rem',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            padding: 0,
            '&:hover': { color: tokens.gold },
            '&:focus-visible': {
              outline: `2px solid ${tokens.gold}`,
              outlineOffset: '2px',
              borderRadius: '4px',
            },
          }}
        >
          <HomeIcon sx={{ fontSize: 13 }} />
          Home
        </Link>
        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
          breadcrumbs.map((item, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            if (isLast || !item.path) {
              return (
                <Typography
                  key={item.label}
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: tokens.gold,
                  }}
                >
                  {item.label}
                </Typography>
              );
            }
            return (
              <Link
                key={item.label}
                component="button"
                underline="hover"
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  color: tokens.textSecondary,
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  '&:hover': { color: tokens.gold },
                }}
              >
                {item.label}
              </Link>
            );
          })
        ) : (
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: tokens.gold,
            }}
          >
            {breadcrumb || title}
          </Typography>
        )}
      </Breadcrumbs>

      {/* Title row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          {/* Icon box */}
          <Box
            aria-hidden="true"
            sx={{
              width: { xs: 44, sm: 52 },
              height: { xs: 44, sm: 52 },
              borderRadius: '14px',
              background: iconBg,
              border: `1px solid ${iconColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: iconColor,
              fontSize: { xs: 22, sm: 26 },
            }}
          >
            {icon}
          </Box>

          {/* Text */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.4rem', sm: '1.75rem' },
                lineHeight: 1.2,
                letterSpacing: '-0.3px',
                color: tokens.textPrimary,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: tokens.textSecondary,
                  mt: 0.3,
                  fontSize: '0.85rem',
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Optional right-side action */}
        {action && (
          <Box sx={{ flexShrink: 0 }}>{action}</Box>
        )}
      </Box>
    </Box>
  );
}
