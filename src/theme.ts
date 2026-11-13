/**
 * ===================================================================
 * DESIGN TOKENS & HỆ THỐNG THEME CHO "LỚP HỌC CHỮ"
 * Hỗ trợ 4 theme:
 *  - classic (mặc định): Giao diện lớp học bảng đen truyền thống
 *  - pastel: Ngọt ngào, nhẹ nhàng, bo tròn dễ thương
 *  - neon: Cyberpunk / TikTok Arcade phát sáng rực rỡ
 *  - notebook: Giấy ô ly, mực tím học trò, nhãn vở thân thuộc
 * ===================================================================
 */

export type ThemeName = 'classic' | 'pastel' | 'neon' | 'notebook';

export interface ThemeMeta {
  id: ThemeName;
  name: string;
  description: string;
  accent: string;
}

export const THEMES: Record<ThemeName, ThemeMeta> = {
  classic: {
    id: 'classic',
    name: 'Lớp Học Cổ Điển',
    description: 'Bảng đen phấn trắng, gỗ mộc, giấy kraft truyền thống',
    accent: '#ffd84a',
  },
  pastel: {
    id: 'pastel',
    name: 'Ngọt Ngào Pastel',
    description: 'Tone kem sữa, hồng phấn và xanh mint dịu mắt',
    accent: '#f472b6',
  },
  neon: {
    id: 'neon',
    name: 'Cyberpunk Neon',
    description: 'Đêm đen ánh đèn neon cyan & magenta phát sáng',
    accent: '#06b6d4',
  },
  notebook: {
    id: 'notebook',
    name: 'Vở Kẻ Ô Ly',
    description: 'Giấy vở học sinh caro, mực bút máy tím và bút đỏ',
    accent: '#2563eb',
  },
};

/**
 * Đọc theme từ URL query parameter (?theme=pastel | neon | notebook | classic)
 * hoặc localStorage, mặc định là 'classic'.
 */
export function getActiveTheme(): ThemeName {
  if (typeof window === 'undefined') return 'classic';
  const urlTheme = new URLSearchParams(window.location.search).get('theme')?.toLowerCase() as ThemeName | undefined;
  if (urlTheme && urlTheme in THEMES) {
    return urlTheme;
  }
  const saved = localStorage.getItem('lop_hoc_theme') as ThemeName | null;
  if (saved && saved in THEMES) {
    return saved;
  }
  return 'classic';
}

/**
 * Gán data-theme lên thẻ gốc để CSS Variables tự động cập nhật
 */
export function applyTheme(theme: ThemeName) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  const stage = document.querySelector('.stage-container');
  if (stage) {
    stage.setAttribute('data-theme', theme);
  }
}

