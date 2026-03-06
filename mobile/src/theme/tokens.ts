export const colors = {
  background: "#0f172a",
  surface: "#1e293b",
  surfaceElevated: "#334155",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  primary: "#3b82f6",
  primaryForeground: "#ffffff",
  success: "#22c55e",
  error: "#ef4444",
  link: "#60a5fa",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const typography = {
  xs: { fontSize: 12 },
  sm: { fontSize: 14 },
  base: { fontSize: 16 },
  lg: { fontSize: 18 },
  xl: { fontSize: 24 },
  "2xl": { fontSize: 28 },
  "3xl": { fontSize: 32 },
  bold: { fontWeight: "700" as const },
  semibold: { fontWeight: "600" as const },
} as const;
