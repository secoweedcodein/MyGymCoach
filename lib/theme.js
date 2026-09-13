// lib/theme.js
// Sistema de diseño unificado de la app. Todo lo visual (color, espaciado,
// radios, tipografía) vive acá para que las pantallas nunca "inventen" valores.
//
// Tokens alineados con la paleta real usada en la mayoría de las pantallas
// (BG #0D0D0D, SURFACE #161616, ACCENT #C0FF3E, etc.).

export const colors = {
  // Fondos
  bg: '#0D0D0D',       // fondo base de pantalla
  bg2: '#161616',      // superficie de tarjeta
  bg3: '#1E1E1E',      // superficie elevada (inputs, chips, tarjeta activa)
  bg4: '#1E1E1E',      // alias usado por inputs/fields (authscreen)
  border: '#FFFFFF0D', // línea sutil sobre fondos oscuros
  border2: '#FFFFFF18',// línea sutil más visible

  // Acento
  accent: '#C0FF3E',   // lima — dato principal, CTA
  accent2: '#8B7CFF',  // violeta — dato secundario, evita que todo sea lima
  accentSoft: '#C0FF3E1A', // fondo suave para chips/badges con acento

  // Estado
  success: '#3DD68C',
  danger: '#FF5A5F',
  dangerSoft: '#FF5A5F1A',
  warning: '#FFB84D',

  // Texto
  t1: '#FFFFFF',   // primario
  t2: '#A0A0A0',   // secundario
  t3: '#555555',   // terciario / labels
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

