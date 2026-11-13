/**
 * Design tokens chuẩn xác cho skin "gon"
 * Khớp 100% với 3 hình thiết kế gốc:
 * 1. Pastel: Nền kem, bảng xanh cổ vịt viền gỗ nâu, ngói gạch
 * 2. Giấy Ô Ly: Nền caro vở học sinh + lề đỏ, bảng trắng viền đỏ đổ bóng navy
 * 3. Neon: Nền tím đêm, bảng viền hồng phát sáng rực rỡ, chi tiết cyan
 */

export type GonThemeName = 'pastel' | 'giay-o-ly' | 'neon';

export interface GonThemeMeta {
  id: GonThemeName;
  name: string;
  description: string;
}

export const GON_THEMES: Record<GonThemeName, GonThemeMeta> = {
  pastel: { id: 'pastel', name: 'Pastel (Mặc định)', description: 'Bảng xanh vintage, viền nâu, nền kem ấm' },
  'giay-o-ly': { id: 'giay-o-ly', name: 'Giấy Ô Ly', description: 'Vở học sinh kẻ caro, viền đỏ, mực xanh' },
  neon: { id: 'neon', name: 'Neon Cyberpunk', description: 'Tím đêm huyền ảo, viền hồng phát sáng, cyan neon' },
};

export const GON_THEME_VARS: Record<GonThemeName, Record<string, string>> = {
  /* ─── 1. PASTEL (Hình 1) ────────────────────────────────────── */
  pastel: {
    '--g-bg':               '#fbf6ee',
    '--g-text-main':        '#1c1917',
    '--g-text-sub':         '#57534e',
    '--g-text-muted':       '#78716c',

    /* Header chips */
    '--g-chip-bg':          '#ffffff',
    '--g-chip-border':      '#e7dfd4',
    '--g-chip-text':        '#1c1917',
    '--g-chip-active-bg':   '#1c332b',
    '--g-chip-active-text': '#ffffff',

    /* Sub chips */
    '--g-chip-gold-bg':     '#fde047',
    '--g-chip-gold-text':   '#1c1917',
    '--g-chip-event-bg':    '#ede9fe',
    '--g-chip-event-text':  '#1c1917',

    /* Bảng chữ */
    '--g-board-bg':         '#2b4a3e',
    '--g-board-border':     '#9f5f38',
    '--g-board-shadow':     'none',
    '--g-board-text':       '#ffffff',
    '--g-tag-bg':           'rgba(255, 255, 255, 0.16)',
    '--g-tag-text':         '#ffffff',

    /* Timer */
    '--g-timer-ring':       '#e58f2d',
    '--g-timer-bg':         '#223d33',
    '--g-timer-text':       '#ffffff',

    /* Tiles & Slots */
    '--g-tile-bg':          '#fff9eb',
    '--g-tile-border':      '#f3e5c8',
    '--g-tile-shadow':      '0 8px 0 #d9bc8c',
    '--g-tile-text':        '#1c1917',
    '--g-slot-border':      '#527c6e',
    '--g-slot-bg':          'transparent',
    '--g-slot-text':        '#facc15',

    /* Cards */
    '--g-card-bg':          '#ffffff',
    '--g-card-border':      '#f0e7dc',
    '--g-card-shadow':      'none',
    '--g-card-title':       '#374151',

    /* Teacher Bar */
    '--g-teacher-bg':       '#ffffff',
    '--g-teacher-border':   '#f0e7dc',
    '--g-teacher-avatar-bg':'#d1fae5',
    '--g-teacher-accent':   '#ea580c',
    '--g-teacher-badge-bg': '#f5eee6',
    '--g-teacher-badge-text':'#1c1917',

    /* Tổ & Bàn học */
    '--g-team-track':       '#f3ece1',
    '--g-team1':            '#f87171',
    '--g-team2':            '#60a5fa',
    '--g-team3':            '#4ade80',
    '--g-team4':            '#facc15',
    '--g-desk-bg':          '#faeed7',
    '--g-desk-border':      '#ebd3b0',
  },

  /* ─── 2. GIẤY Ô LY (Hình 2) ─────────────────────────────────── */
  'giay-o-ly': {
    '--g-bg':               '#f8fafc',
    '--g-text-main':        '#1e293b',
    '--g-text-sub':         '#475569',
    '--g-text-muted':       '#64748b',

    /* Header chips */
    '--g-chip-bg':          '#ffffff',
    '--g-chip-border':      '#cbd5e1',
    '--g-chip-text':        '#1e293b',
    '--g-chip-active-bg':   '#1e293b',
    '--g-chip-active-text': '#ffffff',

    /* Sub chips */
    '--g-chip-gold-bg':     '#fde047',
    '--g-chip-gold-text':   '#1c1917',
    '--g-chip-event-bg':    '#ede9fe',
    '--g-chip-event-text':  '#1e293b',

    /* Bảng chữ */
    '--g-board-bg':         '#ffffff',
    '--g-board-border':     '#dc2626',
    '--g-board-shadow':     '8px 8px 0 #1e293b',
    '--g-board-text':       '#1e293b',
    '--g-tag-bg':           '#fef08a',
    '--g-tag-text':         '#1c1917',

    /* Timer */
    '--g-timer-ring':       '#dc2626',
    '--g-timer-bg':         '#ffffff',
    '--g-timer-text':       '#1e293b',

    /* Tiles & Slots */
    '--g-tile-bg':          '#fef08a',
    '--g-tile-border':      '#fde047',
    '--g-tile-shadow':      '0 8px 0 #ca8a04',
    '--g-tile-text':        '#1c1917',
    '--g-slot-border':      '#1e293b',
    '--g-slot-bg':          'transparent',
    '--g-slot-text':        '#dc2626',

    /* Cards */
    '--g-card-bg':          '#ffffff',
    '--g-card-border':      '#cbd5e1',
    '--g-card-shadow':      'none',
    '--g-card-title':       '#1e293b',

    /* Teacher Bar */
    '--g-teacher-bg':       '#ffffff',
    '--g-teacher-border':   '#cbd5e1',
    '--g-teacher-avatar-bg':'#fed7aa',
    '--g-teacher-accent':   '#dc2626',
    '--g-teacher-badge-bg': '#f1f5f9',
    '--g-teacher-badge-text':'#1e293b',

    /* Tổ & Bàn học */
    '--g-team-track':       '#e2e8f0',
    '--g-team1':            '#f87171',
    '--g-team2':            '#60a5fa',
    '--g-team3':            '#4ade80',
    '--g-team4':            '#facc15',
    '--g-desk-bg':          '#eff6ff',
    '--g-desk-border':      '#bfdbfe',
  },

  /* ─── 3. NEON (Hình 3) ──────────────────────────────────────── */
  neon: {
    '--g-bg':               '#0c0622',
    '--g-text-main':        '#ffffff',
    '--g-text-sub':         '#cbd5e1',
    '--g-text-muted':       '#94a3b8',

    /* Header chips */
    '--g-chip-bg':          '#1a103c',
    '--g-chip-border':      '#4c1d95',
    '--g-chip-text':        '#ffffff',
    '--g-chip-active-bg':   '#22d3ee',
    '--g-chip-active-text': '#0c0622',

    /* Sub chips */
    '--g-chip-gold-bg':     '#facc15',
    '--g-chip-gold-text':   '#0c0622',
    '--g-chip-event-bg':    '#f43f5e',
    '--g-chip-event-text':  '#ffffff',

    /* Bảng chữ phát sáng neon hồng */
    '--g-board-bg':         '#140a33',
    '--g-board-border':     '#f43f5e',
    '--g-board-shadow':     '0 0 28px #f43f5e, 0 0 50px rgba(244,63,94,0.4)',
    '--g-board-text':       '#ffffff',
    '--g-tag-bg':           '#3b186b',
    '--g-tag-text':         '#ffffff',

    /* Timer */
    '--g-timer-ring':       '#22d3ee',
    '--g-timer-bg':         '#0c0622',
    '--g-timer-text':       '#ffffff',

    /* Tiles & Slots */
    '--g-tile-bg':          '#f5f3ff',
    '--g-tile-border':      '#c084fc',
    '--g-tile-shadow':      '0 8px 0 #7c3aed, 0 0 16px rgba(168,85,247,0.6)',
    '--g-tile-text':        '#0c0622',
    '--g-slot-border':      '#a855f7',
    '--g-slot-bg':          'rgba(168, 85, 247, 0.05)',
    '--g-slot-text':        '#22d3ee',

    /* Cards */
    '--g-card-bg':          '#140c36',
    '--g-card-border':      '#3b186b',
    '--g-card-shadow':      'none',
    '--g-card-title':       '#ffffff',

    /* Teacher Bar */
    '--g-teacher-bg':       '#140c36',
    '--g-teacher-border':   '#3b186b',
    '--g-teacher-avatar-bg':'#312e81',
    '--g-teacher-accent':   '#22d3ee',
    '--g-teacher-badge-bg': '#241454',
    '--g-teacher-badge-text':'#ffffff',

    /* Tổ & Bàn học */
    '--g-team-track':       '#241550',
    '--g-team1':            '#f43f5e',
    '--g-team2':            '#22d3ee',
    '--g-team3':            '#4ade80',
    '--g-team4':            '#facc15',
    '--g-desk-bg':          '#1d1248',
    '--g-desk-border':      '#3b1875',
  },
};

export function getGonTheme(): GonThemeName {
  if (typeof window === 'undefined') return 'pastel';
  const url = new URLSearchParams(window.location.search).get('theme') as GonThemeName | null;
  if (url && url in GON_THEMES) return url;
  const saved = localStorage.getItem('lop_hoc_gon_theme') as GonThemeName | null;
  if (saved && saved in GON_THEMES) return saved;
  return 'pastel';
}

export function applyGonTheme(theme: GonThemeName, el?: HTMLElement | null) {
  const target = el ?? (typeof document !== 'undefined' ? (document.querySelector('.gon-stage') as HTMLElement) : null);
  if (!target) return;
  const vars = GON_THEME_VARS[theme];
  for (const [k, v] of Object.entries(vars)) {
    target.style.setProperty(k, v);
  }
  target.setAttribute('data-gon-theme', theme);
}
