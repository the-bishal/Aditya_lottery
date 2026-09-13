import { createTheme } from '@mui/material/styles';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const tokens = {
  // Backgrounds
  bg:         '#0D0D1A',
  bgSurface:  '#121228',
  bgCard:     '#181830',
  bgPanel:    '#1A1A38',

  // Brand
  gold:       '#F5C518',
  goldLight:  '#FFD966',
  goldDark:   '#C9A500',
  goldMuted:  'rgba(245,197,24,0.12)',
  goldBorder: 'rgba(245,197,24,0.18)',

  // Crimson
  crimson:    '#C0392B',
  crimsonLight:'#E74C3C',
  crimsonMuted:'rgba(192,57,43,0.12)',

  // Purple (Middle Numbers accent)
  purple:     '#8E44AD',
  purpleLight:'#A569BD',

  // Text
  textPrimary:   '#EEEEF5',
  textSecondary: '#8888AA',
  textMuted:     '#55556A',

  // Status
  success:    '#27AE60',
  warning:    '#F39C12',
  error:      '#E74C3C',
  info:       '#2980B9',

  // Border
  border:     'rgba(255,255,255,0.07)',
  borderHover:'rgba(245,197,24,0.35)',
};

// ─── Glassmorphism mixin ──────────────────────────────────────────────────────
export const glass = {
  background: 'rgba(24, 24, 48, 0.65)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${tokens.goldBorder}`,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export const glassHover = {
  background: 'rgba(24, 24, 48, 0.85)',
  border: `1px solid rgba(245,197,24,0.40)`,
  boxShadow: `0 0 20px rgba(245,197,24,0.14), 0 8px 32px rgba(0,0,0,0.5)`,
};

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: tokens.bg,
      paper:   tokens.bgSurface,
    },
    primary: {
      main:        tokens.gold,
      light:       tokens.goldLight,
      dark:        tokens.goldDark,
      contrastText: '#0D0D1A',
    },
    secondary: {
      main:        tokens.crimson,
      light:       tokens.crimsonLight,
      dark:        '#922B21',
      contrastText: '#FFFFFF',
    },
    success: { main: tokens.success },
    warning: { main: tokens.warning },
    error:   { main: tokens.error },
    info:    { main: tokens.info },
    text: {
      primary:   tokens.textPrimary,
      secondary: tokens.textSecondary,
      disabled:  tokens.textMuted,
    },
    divider: tokens.border,
    action: {
      hover:    tokens.goldMuted,
      selected: 'rgba(245,197,24,0.16)',
      disabled: 'rgba(255,255,255,0.24)',
      disabledBackground: 'rgba(255,255,255,0.06)',
    },
  },

  typography: {
    fontFamily: `'Poppins', 'Inter', system-ui, -apple-system, sans-serif`,
    h1: {
      fontWeight: 800,
      letterSpacing: '-1px',
      lineHeight: 1.1,
    },
    h2: { fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.15 },
    h3: { fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.2 },
    h4: { fontWeight: 700, letterSpacing: '-0.2px', lineHeight: 1.25 },
    h5: { fontWeight: 600, lineHeight: 1.3 },
    h6: { fontWeight: 600, lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, lineHeight: 1.5, fontSize: '0.8rem', letterSpacing: '0.02em' },
    body1: { lineHeight: 1.65 },
    body2: { lineHeight: 1.6, fontSize: '0.875rem' },
    caption: { lineHeight: 1.4, letterSpacing: '0.02em' },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.1em',
      fontSize: '0.7rem',
    },
  },

  shape: { borderRadius: 12 },

  spacing: 8,

  components: {
    // ── Global Reset ──────────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        html: { fontSize: '16px', WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        body: {
          background: `
            radial-gradient(ellipse 80% 60% at 15% 10%, rgba(192,57,43,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 85% 90%, rgba(245,197,24,0.05) 0%, transparent 70%),
            ${tokens.bg}
          `,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          overflowX: 'hidden',
          color: tokens.textPrimary,
        },
        // Scrollbar
        '::-webkit-scrollbar': { width: '5px', height: '5px' },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': {
          background: 'rgba(245,197,24,0.25)',
          borderRadius: '10px',
        },
        '::-webkit-scrollbar-thumb:hover': { background: tokens.gold },
        // Code/monospace
        'code, pre': { fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" },
        // Focus visible outline
        ':focus-visible': {
          outline: `2px solid ${tokens.gold}`,
          outlineOffset: '2px',
        },
        // Media query for reduced motion
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },

    // ── AppBar ────────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(13,13,26,0.85)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: `1px solid ${tokens.border}`,
          boxShadow: 'none',
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: tokens.bgSurface,
        },
        elevation1: { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' },
        elevation2: { boxShadow: '0 4px 20px rgba(0,0,0,0.35)' },
        elevation3: { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
      },
    },

    // ── Card ──────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          ...glass,
          borderRadius: 16,
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': glassHover,
        },
      },
    },

    // ── Button ────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '0.875rem',
          padding: '9px 20px',
          transition: 'all 0.18s ease',
          '&:focus-visible': {
            outline: `2px solid ${tokens.gold}`,
            outlineOffset: '2px',
          },
        },
        sizeSmall: { padding: '6px 14px', fontSize: '0.8rem' },
        sizeLarge: { padding: '12px 28px', fontSize: '0.95rem' },
        containedPrimary: {
          background: `linear-gradient(135deg, ${tokens.gold} 0%, ${tokens.goldLight} 100%)`,
          color: '#0D0D1A',
          fontWeight: 700,
          '&:hover': {
            background: `linear-gradient(135deg, ${tokens.goldLight} 0%, ${tokens.gold} 100%)`,
            boxShadow: `0 4px 16px rgba(245,197,24,0.35)`,
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
          '&.Mui-disabled': {
            background: 'rgba(245,197,24,0.12)',
            color: 'rgba(255,255,255,0.28)',
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${tokens.crimson} 0%, ${tokens.crimsonLight} 100%)`,
          color: '#fff',
          '&:hover': {
            boxShadow: `0 4px 16px rgba(192,57,43,0.35)`,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: tokens.border,
          '&:hover': {
            borderColor: tokens.goldBorder,
            background: tokens.goldMuted,
          },
        },
        outlinedPrimary: {
          borderColor: 'rgba(245,197,24,0.35)',
          color: tokens.gold,
          '&:hover': {
            borderColor: tokens.gold,
            background: tokens.goldMuted,
          },
        },
        text: {
          '&:hover': { background: tokens.goldMuted },
        },
      },
    },

    // ── TextField ─────────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            background: 'rgba(255,255,255,0.025)',
            '& fieldset': { borderColor: tokens.border },
            '&:hover fieldset': { borderColor: 'rgba(245,197,24,0.3)' },
            '&.Mui-focused fieldset': { borderColor: tokens.gold, borderWidth: '1.5px' },
            '&.Mui-disabled fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
          },
          '& .MuiInputLabel-root': {
            color: tokens.textSecondary,
            '&.Mui-focused': { color: tokens.gold },
          },
          '& .MuiInputBase-input': {
            color: tokens.textPrimary,
            fontSize: '0.9rem',
          },
        },
      },
    },

    // ── Select ────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        outlined: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.border,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          background: tokens.bgCard,
          border: `1px solid ${tokens.border}`,
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backgroundImage: 'none',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 6,
          margin: '0 4px',
          padding: '8px 12px',
          '&.Mui-selected': {
            background: tokens.goldMuted,
            '&:hover': { background: 'rgba(245,197,24,0.18)' },
          },
          '&:hover': { background: tokens.goldMuted },
        },
      },
    },

    // ── Stepper ───────────────────────────────────────────────────────────
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.1)',
          '&.Mui-active': { color: tokens.gold },
          '&.Mui-completed': { color: tokens.success },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          color: tokens.textMuted,
          fontSize: '0.8rem',
          fontWeight: 500,
          '&.Mui-active': { color: tokens.gold, fontWeight: 700 },
          '&.Mui-completed': { color: tokens.success, fontWeight: 600 },
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        line: {
          borderColor: tokens.border,
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          fontSize: '0.8rem',
          height: 28,
        },
        colorPrimary: {
          background: tokens.goldMuted,
          color: tokens.gold,
          border: `1px solid rgba(245,197,24,0.25)`,
        },
      },
    },

    // ── LinearProgress ────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 6,
          background: 'rgba(255,255,255,0.06)',
        },
        bar: {
          background: `linear-gradient(90deg, ${tokens.crimson}, ${tokens.gold})`,
          borderRadius: 6,
        },
      },
    },

    // ── Alert ─────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid',
          fontSize: '0.875rem',
          padding: '10px 14px',
        },
        standardSuccess: {
          background: 'rgba(39,174,96,0.10)',
          borderColor: 'rgba(39,174,96,0.25)',
          color: '#5cb85c',
        },
        standardError: {
          background: 'rgba(231,76,60,0.10)',
          borderColor: 'rgba(231,76,60,0.25)',
          color: tokens.crimsonLight,
        },
        standardWarning: {
          background: 'rgba(243,156,18,0.10)',
          borderColor: 'rgba(243,156,18,0.25)',
          color: tokens.warning,
        },
        standardInfo: {
          background: 'rgba(41,128,185,0.10)',
          borderColor: 'rgba(41,128,185,0.25)',
          color: '#5dade2',
        },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          background: tokens.bgCard,
          border: `1px solid ${tokens.border}`,
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 500,
          padding: '6px 10px',
        },
        arrow: { color: tokens.bgCard },
      },
    },

    // ── Slider ────────────────────────────────────────────────────────────
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 4,
          '& .MuiSlider-rail': { background: tokens.border, opacity: 1 },
          '& .MuiSlider-thumb': {
            width: 16,
            height: 16,
            boxShadow: `0 0 0 0 rgba(245,197,24,0.25)`,
            '&:hover': { boxShadow: `0 0 0 8px rgba(245,197,24,0.12)` },
            '&.Mui-active': { boxShadow: `0 0 0 10px rgba(245,197,24,0.18)` },
          },
        },
      },
    },

    // ── Breadcrumbs ───────────────────────────────────────────────────────
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: { color: tokens.textMuted },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: tokens.border },
      },
    },

    // ── Switch ────────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            '& + .MuiSwitch-track': { background: tokens.gold, opacity: 0.9 },
            '& .MuiSwitch-thumb': { background: '#fff' },
          },
        },
        track: {
          background: 'rgba(255,255,255,0.15)',
          opacity: 1,
        },
      },
    },

    // ── IconButton ────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.18s ease',
          '&:focus-visible': {
            outline: `2px solid ${tokens.gold}`,
            outlineOffset: '2px',
          },
        },
      },
    },

    // ── Container ────────────────────────────────────────────────────────
    MuiContainer: {
      defaultProps: { maxWidth: 'lg' },
      styleOverrides: {
        root: {
          paddingLeft: 'clamp(16px, 4vw, 32px)',
          paddingRight: 'clamp(16px, 4vw, 32px)',
        },
      },
    },
  },
});

export default theme;
export { tokens as TOKENS };
