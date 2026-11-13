/**
 * StudentAvatar: vẽ học sinh nhìn thẳng bằng SVG nhiều lớp.
 * - Avatar sinh ra từ hash tên tài khoản → kiểu tóc, màu tóc, màu áo, phụ kiện CỐ ĐỊNH theo tên.
 * - Hỗ trợ các biểu cảm: dung (mặc định), vui (đúng), buon (sai), ngac (ngạc nhiên), chao (mới vào).
 * - Học sinh girl / boy khác nhau về kiểu tóc khả dụng.
 */

import { hashName } from './Hair';

// ── Bảng màu ──────────────────────────────────────────────────────────────────
const HAIR_COLORS = [
  '#1a1209', '#231a0f', '#2f2214', '#3d2b18', '#4a3321', // đen / nâu rất đậm
  '#5c3d20', '#7a4b2a', '#9b6033', '#b87a3c',            // nâu
  '#c9924a', '#d4a855', '#e8c56a',                        // vàng nâu / mật ong
  '#d94a7a', '#c03a9e',                                   // hiếm: hồng / tím
];

const SHIRT_COLORS_GIRL = ['#f9a8d4', '#fda4af', '#a5f3fc', '#86efac', '#fde68a', '#c4b5fd', '#fb923c'];
const SHIRT_COLORS_BOY  = ['#93c5fd', '#6ee7b7', '#fde68a', '#fca5a5', '#a3e635', '#38bdf8', '#f0abfc'];
const SKIN_TONES = ['#ffe0c2', '#fecba1', '#f4b682', '#d4956a', '#c07d4e'];
const ACCESSORIES = ['none', 'none', 'none', 'glasses', 'bow', 'ribbon', 'hat'];

type Mood = 'dung' | 'vui' | 'buon' | 'ngac' | 'chao';

interface AvatarConfig {
  hairStyle: number; // index
  hairColor: string;
  shirtColor: string;
  skinTone: string;
  accessory: string;
  girl: boolean;
}

function getConfig(username: string, girl: boolean): AvatarConfig {
  const h = hashName(username);
  return {
    hairStyle:   (h >> 2)  % (girl ? 6 : 4),
    hairColor:   HAIR_COLORS[(h >> 5)  % HAIR_COLORS.length],
    shirtColor:  (girl ? SHIRT_COLORS_GIRL : SHIRT_COLORS_BOY)[(h >> 9) % 7],
    skinTone:    SKIN_TONES[(h >> 13) % SKIN_TONES.length],
    accessory:   ACCESSORIES[(h >> 17) % ACCESSORIES.length],
    girl,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const darken = (hex: string, pct = 0.25) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) * (1 - pct)) | 0;
  const g = Math.max(0, ((n >> 8)  & 255) * (1 - pct)) | 0;
  const b = Math.max(0, ( n        & 255) * (1 - pct)) | 0;
  return `rgb(${r},${g},${b})`;
};

// ── Layers ───────────────────────────────────────────────────────────────────

function BodyLayer({ cfg, mood }: { cfg: AvatarConfig; mood: Mood }) {
  const { shirtColor, skinTone, girl } = cfg;
  const shade = darken(shirtColor, 0.18);

  return (
    <g id="body">
      {/* Cổ */}
      <rect x="43" y="62" width="14" height="12" rx="4" fill={skinTone} />

      {/* Thân áo */}
      {girl ? (
        // Áo đầm học sinh nữ
        <path
          d="M24 72 C22 76 20 85 20 100 L80 100 L80 85 C80 76 78 72 76 72 Q68 68 50 68 Q32 68 24 72 Z"
          fill={shirtColor}
          stroke={shade}
          strokeWidth="1.5"
        />
      ) : (
        // Áo sơ mi học sinh nam
        <>
          <path
            d="M23 72 C21 76 19 85 19 100 L81 100 L81 85 C81 76 79 72 77 72 Q68 68 50 68 Q32 68 23 72 Z"
            fill={shirtColor}
            stroke={shade}
            strokeWidth="1.5"
          />
          {/* Cổ bẻ áo sơ mi */}
          <path d="M42 68 L50 76 L58 68 L50 72 Z" fill="white" stroke={shade} strokeWidth="1" />
          {/* Cúc áo */}
          <circle cx="50" cy="80" r="1.5" fill={shade} />
          <circle cx="50" cy="88" r="1.5" fill={shade} />
        </>
      )}

      {/* Tay trái */}
      <ArmLayer cfg={cfg} mood={mood} side="left" />

      {/* Tay phải */}
      <ArmLayer cfg={cfg} mood={mood} side="right" />
    </g>
  );
}

function ArmLayer({ cfg, mood, side }: { cfg: AvatarConfig; mood: Mood; side: 'left' | 'right' }) {
  const { shirtColor, skinTone } = cfg;
  const shade = darken(shirtColor, 0.18);
  const isLeft = side === 'left';
  const ax = isLeft ? 18 : 82; // vai
  const hx = isLeft ? 14 : 86; // bàn tay

  // Góc tay theo mood
  let armPath: string;
  let handCx: number;
  let handCy: number;

  if (mood === 'chao') {
    // Vẫy tay chào: tay phải giơ cao
    if (!isLeft) {
      armPath = `M${ax} 74 Q90 60 ${hx} 48`;
      handCx = hx; handCy = 46;
    } else {
      armPath = `M${ax} 74 Q12 82 ${hx} 92`;
      handCx = hx; handCy = 94;
    }
  } else if (mood === 'vui') {
    // Giơ cả 2 tay lên mừng
    armPath = isLeft
      ? `M${ax} 74 Q12 60 ${hx} 48`
      : `M${ax} 74 Q88 60 ${hx} 48`;
    handCx = hx; handCy = 46;
  } else if (mood === 'buon') {
    // Tay thõng xuống buồn
    armPath = isLeft
      ? `M${ax} 74 Q12 86 ${hx} 98`
      : `M${ax} 74 Q88 86 ${hx} 98`;
    handCx = hx; handCy = 100;
  } else {
    // Tay thả tự nhiên nhẹ nhàng
    armPath = isLeft
      ? `M${ax} 74 Q14 82 ${hx} 94`
      : `M${ax} 74 Q86 82 ${hx} 94`;
    handCx = hx; handCy = 96;
  }

  return (
    <g>
      <path d={armPath} stroke={shirtColor} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d={armPath} stroke={shade} strokeWidth="11" strokeLinecap="round" fill="none" opacity="0.25" />
      <circle cx={handCx} cy={handCy} r="5" fill={skinTone} stroke={darken(skinTone, 0.15)} strokeWidth="1" />
    </g>
  );
}

function FaceLayer({ cfg, mood }: { cfg: AvatarConfig; mood: Mood }) {
  const { skinTone } = cfg;
  const lineFace = darken(skinTone, 0.3);

  return (
    <g id="face">
      {/* Khuôn mặt bầu tròn dễ thương */}
      <ellipse cx="50" cy="40" rx="24" ry="26" fill={skinTone} stroke={lineFace} strokeWidth="1.5" />

      {/* 2 tai */}
      <ellipse cx="26" cy="42" rx="4.5" ry="6" fill={skinTone} stroke={lineFace} strokeWidth="1.5" />
      <ellipse cx="74" cy="42" rx="4.5" ry="6" fill={skinTone} stroke={lineFace} strokeWidth="1.5" />

      {/* Má hồng phấn */}
      <ellipse cx="38" cy="50" rx="7" ry="4" fill="#ff9eb5" opacity="0.45" />
      <ellipse cx="62" cy="50" rx="7" ry="4" fill="#ff9eb5" opacity="0.45" />

      {/* Mắt theo mood */}
      <EyesLayer mood={mood} />

      {/* Mũi nhỏ nhắn */}
      <ellipse cx="50" cy="47" rx="2.5" ry="1.5" fill={darken(skinTone, 0.2)} />

      {/* Miệng theo mood */}
      <MouthLayer mood={mood} />
    </g>
  );
}

function EyesLayer({ mood }: { mood: Mood }) {
  if (mood === 'vui' || mood === 'chao') {
    // Mắt cười tít ^-^
    return (
      <g id="eyes-happy">
        <path d="M37 38 Q42 33 47 38" stroke="#2a1a0a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M53 38 Q58 33 63 38" stroke="#2a1a0a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </g>
    );
  }
  if (mood === 'buon') {
    // Mắt cụp xuống buồn v_v
    return (
      <g id="eyes-sad">
        {/* Lông mày cau lại */}
        <path d="M35 32 Q42 36 46 33" stroke="#2a1a0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M54 33 Q58 36 65 32" stroke="#2a1a0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <ellipse cx="42" cy="41" rx="6" ry="5.5" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
        <circle cx="43" cy="42" r="3.5" fill="#2a1a0a" />
        <circle cx="44" cy="40" r="1.2" fill="white" />
        <ellipse cx="58" cy="41" rx="6" ry="5.5" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
        <circle cx="57" cy="42" r="3.5" fill="#2a1a0a" />
        <circle cx="58" cy="40" r="1.2" fill="white" />
      </g>
    );
  }
  if (mood === 'ngac') {
    // Mắt mở to tròn O_O
    return (
      <g id="eyes-surprised">
        <path d="M36 32 Q42 29 46 32" stroke="#2a1a0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M54 32 Q58 29 64 32" stroke="#2a1a0a" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="42" cy="41" r="7" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
        <circle cx="42" cy="41" r="4.5" fill="#2a1a0a" />
        <circle cx="43.5" cy="39" r="1.8" fill="white" />
        <circle cx="58" cy="41" r="7" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
        <circle cx="58" cy="41" r="4.5" fill="#2a1a0a" />
        <circle cx="59.5" cy="39" r="1.8" fill="white" />
      </g>
    );
  }
  // Mặc định: mắt tròn hiền lành
  return (
    <g id="eyes-normal">
      <path d="M37 33 Q42 30 46 33" stroke="#2a1a0a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M54 33 Q58 30 63 33" stroke="#2a1a0a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="42" cy="40" rx="6" ry="5.5" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
      <circle cx="42" cy="40" r="3.5" fill="#2a1a0a" />
      <circle cx="43" cy="38.5" r="1.3" fill="white" />
      <ellipse cx="58" cy="40" rx="6" ry="5.5" fill="white" stroke="#2a1a0a" strokeWidth="1.5" />
      <circle cx="58" cy="40" r="3.5" fill="#2a1a0a" />
      <circle cx="59" cy="38.5" r="1.3" fill="white" />
    </g>
  );
}

function MouthLayer({ mood }: { mood: Mood }) {
  if (mood === 'vui' || mood === 'chao') {
    return (
      <g id="mouth-happy">
        <path d="M42 54 Q50 62 58 54" stroke="#e05070" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M44 55 Q50 60 56 55 Q50 56 44 55 Z" fill="#ff7090" opacity="0.6" />
      </g>
    );
  }
  if (mood === 'buon') {
    return <path d="M43 60 Q50 54 57 60" stroke="#e05070" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
  }
  if (mood === 'ngac') {
    return <ellipse cx="50" cy="57" rx="5" ry="6" fill="#e05070" stroke="#c03050" strokeWidth="1.5" />;
  }
  return <path d="M44 56 Q50 60 56 56" stroke="#e05070" strokeWidth="2" strokeLinecap="round" fill="none" />;
}

function HairLayer({ cfg }: { cfg: AvatarConfig }) {
  const { hairColor, hairStyle, girl } = cfg;
  const shade = darken(hairColor, 0.3);
  const shine = 'rgba(255,255,255,0.14)';

  if (girl) {
    switch (hairStyle % 6) {
      case 0: // Tóc dài xõa
        return (
          <g>
            <path d="M6 20 A44 48 0 0 1 94 20 L96 60 Q80 72 50 72 Q20 72 4 60 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M6 20 A44 48 0 0 1 94 20 L92 54 Q80 65 50 65 Q20 65 8 54 Z"
              fill={hairColor} />
            <path d="M6 50 Q4 85 10 110 M94 50 Q96 85 90 110"
              stroke={hairColor} strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d="M20 65 Q16 90 18 115 M50 68 Q50 95 50 118 M80 65 Q84 90 82 115"
              stroke={shine} strokeWidth="2.5" fill="none" />
          </g>
        );
      case 1: // 2 bím tóc
        return (
          <g>
            <path d="M8 18 A42 46 0 0 1 92 18 L90 52 Q70 62 50 62 Q30 62 10 52 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M12 60 C8 85 10 105 16 125" stroke={hairColor} strokeWidth="13"
              strokeLinecap="round" fill="none" />
            <path d="M88 60 C92 85 90 105 84 125" stroke={hairColor} strokeWidth="13"
              strokeLinecap="round" fill="none" />
            <circle cx="12" cy="60" r="6" fill={darken(cfg.shirtColor)} stroke={shade} strokeWidth="1.5" />
            <circle cx="88" cy="60" r="6" fill={darken(cfg.shirtColor)} stroke={shade} strokeWidth="1.5" />
          </g>
        );
      case 2: // Tóc búi cao
        return (
          <g>
            <path d="M8 20 A42 46 0 0 1 92 20 L90 52 Q70 62 50 62 Q30 62 10 52 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <circle cx="50" cy="10" r="16" fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M38 18 Q50 24 62 18" stroke={darken(cfg.shirtColor)} strokeWidth="4"
              strokeLinecap="round" fill="none" />
          </g>
        );
      case 3: // Tóc ngắn ngang vai
        return (
          <g>
            <path d="M6 18 A44 48 0 0 1 94 18 L94 58 Q80 70 50 72 Q20 70 6 58 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M20 65 Q22 72 20 115 M50 70 Q50 76 50 118 M80 65 Q78 72 80 115"
              stroke={shine} strokeWidth="2" fill="none" />
          </g>
        );
      case 4: // 2 chùm tóc
        return (
          <g>
            <path d="M8 20 A42 46 0 0 1 92 20 L90 52 Q70 62 50 62 Q30 62 10 52 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <ellipse cx="6" cy="50" rx="12" ry="20" fill={hairColor} stroke={shade} strokeWidth="1.5" />
            <ellipse cx="94" cy="50" rx="12" ry="20" fill={hairColor} stroke={shade} strokeWidth="1.5" />
          </g>
        );
      default: // Tóc uốn xoăn
        return (
          <g>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <circle key={i} cx={50 + Math.cos(a) * 30} cy={30 + Math.sin(a) * 32} r="13"
                fill={hairColor} stroke={shade} strokeWidth="1.5" />;
            })}
            <ellipse cx="50" cy="30" rx="28" ry="30" fill={hairColor} />
          </g>
        );
    }
  } else {
    // Boy
    switch (hairStyle % 4) {
      case 0: // Tóc ngắn gọn
        return (
          <g>
            <path d="M8 20 A42 46 0 0 1 92 20 L90 48 Q70 56 50 56 Q30 56 10 48 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M22 50 Q22 60 24 55 M38 54 Q38 62 40 57 M62 54 Q62 62 60 57 M78 50 Q78 60 76 55"
              stroke={shine} strokeWidth="2" fill="none" />
          </g>
        );
      case 1: // Tóc rẽ ngôi
        return (
          <g>
            <path d="M8 18 A42 46 0 0 1 92 18 L90 50 Q70 58 50 58 Q30 58 10 50 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <line x1="50" y1="10" x2="50" y2="56" stroke={shade} strokeWidth="2" opacity="0.7" />
            <path d="M22 48 Q28 55 22 60 M78 48 Q72 55 78 60"
              stroke={shine} strokeWidth="2.5" fill="none" />
          </g>
        );
      case 2: // Mũ lưỡi trai
        return (
          <g>
            <path d="M8 22 A42 46 0 0 1 92 22 L90 48 Q70 56 50 56 Q30 56 10 48 Z"
              fill={hairColor} stroke={shade} strokeWidth="2" />
            <path d="M6 26 A44 44 0 0 1 94 26 L94 36 Q50 24 6 36 Z"
              fill={darken(cfg.shirtColor, 0.3)} stroke={darken(cfg.shirtColor, 0.5)} strokeWidth="1.5" />
            <path d="M6 36 L2 42 L28 40 L6 36 Z"
              fill={darken(cfg.shirtColor, 0.3)} stroke={darken(cfg.shirtColor, 0.5)} strokeWidth="1.5" />
          </g>
        );
      default: // Tóc xoăn
        return (
          <g>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <circle key={i} cx={50 + Math.cos(a) * 26} cy={26 + Math.sin(a) * 28} r="11"
                fill={hairColor} stroke={shade} strokeWidth="1.5" />;
            })}
            <ellipse cx="50" cy="26" rx="24" ry="26" fill={hairColor} />
          </g>
        );
    }
  }
}

function AccessoryLayer({ cfg }: { cfg: AvatarConfig }) {
  const { accessory, hairColor, girl } = cfg;
  if (accessory === 'glasses') {
    return (
      <g id="glasses">
        <rect x="34" y="36" width="12" height="10" rx="3" fill="none"
          stroke="#334155" strokeWidth="1.8" />
        <rect x="54" y="36" width="12" height="10" rx="3" fill="none"
          stroke="#334155" strokeWidth="1.8" />
        <line x1="46" y1="41" x2="54" y2="41" stroke="#334155" strokeWidth="1.8" />
        <line x1="22" y1="39" x2="34" y2="39" stroke="#334155" strokeWidth="1.8" />
        <line x1="66" y1="39" x2="78" y2="39" stroke="#334155" strokeWidth="1.8" />
      </g>
    );
  }
  if (accessory === 'bow' || (accessory === 'ribbon' && girl)) {
    // Nơ bướm cài tóc
    const bx = 68, by = 12;
    return (
      <g id="bow">
        <path d={`M${bx - 10} ${by} L${bx} ${by + 6} L${bx - 10} ${by + 12} Z`}
          fill={darken(cfg.shirtColor, 0.1)} stroke={darken(cfg.shirtColor, 0.35)} strokeWidth="1.2" />
        <path d={`M${bx + 10} ${by} L${bx} ${by + 6} L${bx + 10} ${by + 12} Z`}
          fill={darken(cfg.shirtColor, 0.1)} stroke={darken(cfg.shirtColor, 0.35)} strokeWidth="1.2" />
        <circle cx={bx} cy={by + 6} r="3" fill={darken(cfg.shirtColor, 0.2)} />
      </g>
    );
  }
  if (accessory === 'hat') {
    return (
      <g id="hat">
        <ellipse cx="50" cy="16" rx="30" ry="6" fill={hairColor} stroke={darken(hairColor)} strokeWidth="1.5" />
        <rect x="32" y="2" width="36" height="14" rx="4"
          fill={hairColor} stroke={darken(hairColor)} strokeWidth="1.5" />
        <rect x="30" y="13" width="40" height="4" rx="2"
          fill={darken(hairColor, 0.4)} />
      </g>
    );
  }
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

interface StudentAvatarProps {
  username: string;
  girl: boolean;
  mood: Mood;
  size?: number; // chiều rộng px
}

export function StudentAvatar({ username, girl, mood, size = 80 }: StudentAvatarProps) {
  const cfg = getConfig(username, girl);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ overflow: 'visible', display: 'block' }}
    >
      {/* Thứ tự vẽ: tóc sau → thân → mặt → tóc trước → phụ kiện */}
      <HairLayer cfg={cfg} />
      <BodyLayer cfg={cfg} mood={mood} />
      <FaceLayer cfg={cfg} mood={mood} />
      <AccessoryLayer cfg={cfg} />
    </svg>
  );
}

// Re-export helpers for GameStage
export type StudentMood = Mood;

