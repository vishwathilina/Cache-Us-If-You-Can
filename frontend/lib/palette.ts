/** Enterprise navy palette — exact swatches */
export const palette = {
  navy900: '#0B1F3B',
  navy800: '#123A63',
  navy600: '#2F5D8C',
  periwinkle: '#C9D6E5',
  offWhite: '#F2F5F8',
  /** Text on white / off-white backgrounds */
  text: '#0B1F3B',
  textSecondary: '#2F5D8C',
  textMuted: '#5A7189',
  /** Text on blue surfaces (cards, sidebar, buttons) */
  textOnBlue: '#F2F5F8',
  textOnBlueMuted: '#C9D6E5',
  green: '#1B7F4E',
  red: '#C53030',
  yellow: '#B7791F',
  gradientPrimary: 'linear-gradient(135deg, #123A63, #2F5D8C)',
  gradientHero: 'linear-gradient(135deg, #0B1F3B, #123A63 55%, #2F5D8C)',
  gradientCard: 'linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(201,214,229,0.58) 48%, rgba(47,93,140,0.14) 100%)',
  glassBlur: '20px',
  surface: '#FFFFFF',
  surfaceTint: 'rgba(201, 214, 229, 0.45)',
  border: 'rgba(47, 93, 140, 0.22)',
  borderSubtle: 'rgba(201, 214, 229, 0.65)',
} as const

/** Icon colours on blue card surfaces */
export const iconTints = [
  palette.periwinkle,
  palette.offWhite,
  palette.navy600,
  palette.periwinkle,
  palette.navy600,
  palette.offWhite,
] as const

/** Icon colours on white page background */
export const iconTintsOnLight = [
  palette.navy800,
  palette.navy600,
  palette.navy900,
  palette.navy600,
  palette.navy800,
  palette.navy600,
] as const
