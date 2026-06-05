/**
 * Warm Professional Healthcare Palette
 * Login & App Design System Colors
 */

export const PALETTE = {
  // Primary Brand Colors
  primary: {
    green: '#059669',        // Medical green (main accent)
    greenLight: '#86EFAC',   // Light green (secondary text)
    greenDark: '#047857',    // Dark green (hover states)
  },

  // Backgrounds
  background: {
    light: '#E8ECEF',        // Main page background
    lightAlt: '#F8FAFC',     // Alternative light background
    white: '#FFFFFF',        // Pure white (cards, inputs)
  },

  // Text Colors
  text: {
    primary: '#334155',      // Main body text
    secondary: '#64748B',    // Secondary text, descriptions
    light: '#CBD5E1',        // Very light text (footer)
    muted: '#6b7399',        // Muted/disabled text
    dark: '#0F172A',         // Dark text (headings)
    black: '#111111',        // Off-black
  },

  // Semantic Colors
  status: {
    error: '#DC2626',        // Error red
    success: '#059669',      // Success (uses primary green)
    warning: '#FBBF24',      // Warning yellow
  },

  // UI Elements
  ui: {
    border: '#E2E8F0',       // Light border color
    borderDark: '#334155',   // Dark border color
    shadow: 'rgba(0,0,0,0.1)',
  },

  // Form States
  form: {
    errorBg: '#FEE2E2',      // Error background
    errorBorder: '#DC2626',  // Error border
    errorText: '#991B1B',    // Error text
    successBg: '#DCFCE7',    // Success background
    successBorder: '#059669', // Success border
    successText: '#065F46',  // Success text
  },
}

/**
 * Tailwind-compatible utility aliases
 * Use these in className for consistency
 */
export const COLORS = {
  // Backgrounds
  bgPrimary: 'bg-[#E8ECEF]',
  bgLight: 'bg-white',
  bgGreen: 'bg-[#059669]',

  // Text
  textPrimary: 'text-[#334155]',
  textSecondary: 'text-[#64748B]',
  textGreen: 'text-[#059669]',
  textGreenLight: 'text-[#86EFAC]',

  // Borders
  borderLight: 'border-[#E2E8F0]',
  borderDark: 'border-[#334155]',

  // Status
  errorBg: 'bg-[#FEE2E2]',
  successBg: 'bg-[#DCFCE7]',
}
