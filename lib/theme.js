// lib/theme.js
// Sistema de diseño unificado de la app. Todo lo visual (color, espaciado,
// radios, tipografía) vive acá para que las pantallas nunca "inventen" valores.

export const colors = {
  // Fondos
  bg: '#0B0B0F',       // fondo base de pantalla
  bg2: '#14141B',      // superficie de tarjeta
  bg3: '#1C1C26',      // superficie elevada (inputs, chips, tarjeta activa)
  border: '#FFFFFF14', // línea sutil sobre fondos oscuros

  // Acento
  accent: '#D8FF3F',      // lima — dato principal, CTA
  accent2: '#8B7CFF',     // violeta — dato secundario, evita que todo sea lima
  accentSoft: '#D8FF3F1A',// fondo suave para chips/badges con acento

  // Estado
  success: '#4ADE80',
  danger: '#FF5A5F',
  dangerSoft: '#FF5A5F1A',
  warning: '#FFB84D',

  // Texto
  t1: '#F5F5F7',   // primario
  t2: '#AFAFBC',   // secundario
  t3: '#6E6E7A',   // terciario / labels
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '500' },
  caption: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
};

