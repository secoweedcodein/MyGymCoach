// components/home/theme.js
// Tokens del HomeScreen. Mantienen la paleta original de MyGymCoach.

export const COLORS = {
  accent: '#C0FF3E',
  onAccent: '#0D0D0D',
  bg: '#0D0D0D',
  surface: '#161616',
  surface2: '#1E1E1E',
  border: '#FFFFFF0D',
  borderStrong: '#FFFFFF1A',
  text: '#FFFFFF',
  textMuted: '#A0A0A0',
  textDim: '#6B6B6B',
  danger: '#FF5A5F',
  challenge: '#FF6B3E',
};

export const SPACING = { screen: 20, gap: 12, section: 28 };

export const RADIUS = { sm: 10, md: 16, lg: 22, pill: 999 };

// Rutas tomadas del HomeScreen original.
// ⚠️ COACH: verifica que '/coach' sea la ruta real de tu app (app/coach.js o app/(tabs)/coach).
export const ROUTES = {
  steps: '/Steps',
  history: '/History',
  calendar: '/calendar',
  dashboard: '/dashboard',
  nutrition: '/nutrition',
  bmi: '/bmi',
  routines: '/routines',
  coach: '/coach',
  adminLogin: '/admin/login',
};

export const ROUTINE_ACCENTS = ['#C0FF3E', '#3EE5FF', '#FF6B3E', '#FF3EAA'];

export function formatNumber(n) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}