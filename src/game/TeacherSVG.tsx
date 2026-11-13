import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { StageView } from './useGame';
import { GAME, shownTeacherName } from './config';
import { voice } from '../live/voice';

export type TeacherMood = 'idle' | 'speaking' | 'praise' | 'roast' | 'surprise';

export function getTeacherMood(v: StageView, isSpeaking: boolean, now: number): TeacherMood {
  // 1. Bất ngờ: có bạn đi lên tặng hoa, sinh nhật, hoặc quỹ lớp đạt mốc
  if (v.walk && now - v.walk.at < GAME.walkMs * 0.45) return 'surprise';
  if (v.birthday || (v.fund && v.fund.party > 0)) return 'surprise';

  // 2. Khen: vừa nhận hoa trong 3.5s, đang ở pha vinh danh praise, vỗ tay, hoặc có người trả lời đúng
  if (now - v.lastFlowerAt < 3500) return 'praise';
  if (v.clapping || v.phase === 'praise') return 'praise';
  if ((v.phase === 'question' || v.phase === 'reveal') && v.correctCount > 0) return 'praise';

  // 3. Trêu / đố khó: pha bonus (thêm 10s vì chưa ai giải), hoặc reveal mà cả lớp không ai đúng
  if (v.phase === 'bonus') return 'roast';
  if (v.phase === 'reveal' && v.correctCount === 0) return 'roast';

  // 4. Đang nói: khi TTS đang phát âm
  if (isSpeaking) return 'speaking';

  // 5. Mặc định
  return 'idle';
}

interface TeacherSVGProps {
  v: StageView;
  now: number;
}

export function TeacherSVG({ v, now }: TeacherSVGProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isThay = v.cfg.teacher === 'thay';
  const gotFlower = now - v.lastFlowerAt < 3500;

  // Lắng nghe sự kiện phát giọng từ voice singleton
  useEffect(() => {
    const prevOnSpeaker = voice.onSpeaker;
    voice.onSpeaker = (who) => {
      prevOnSpeaker?.(who);
      setIsSpeaking(who !== null);
    };
    return () => {
      voice.onSpeaker = prevOnSpeaker;
    };
  }, []);

  const mood = getTeacherMood(v, isSpeaking, now);

  return (
    <div className="pointer-events-none absolute left-[74px] top-[400px] h-[510px] w-[340px] select-none">
      {/* Container SVG vẽ cô giáo / thầy giáo nhiều lớp */}
      <svg
        viewBox="0 0 340 510"
        className="h-full w-full drop-shadow-[0_12px_14px_rgba(0,0,0,0.32)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients cho Áo Dài Cô Giáo */}
          <linearGradient id="aoDaiGradCo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff758c" />
            <stop offset="50%" stopColor="#ff5858" />
            <stop offset="100%" stopColor="#f857a6" />
          </linearGradient>

          {/* Gradients cho Áo Dài Thầy Giáo */}
          <linearGradient id="aoDaiGradThay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a7bd5" />
            <stop offset="100%" stopColor="#00d2ff" />
          </linearGradient>

          {/* Gradient Quần Lụa Trắng */}
          <linearGradient id="quanLuaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fdfbfb" />
            <stop offset="100%" stopColor="#ebedee" />
          </linearGradient>

          {/* Gradient Làn Da Hồng Hào */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff5eb" />
            <stop offset="100%" stopColor="#ffe3d1" />
          </linearGradient>

          {/* Gradient Mái Tóc Đen Mượt */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2c3437" />
            <stop offset="50%" stopColor="#1c1d21" />
            <stop offset="100%" stopColor="#0f1012" />
          </linearGradient>
        </defs>

        {isThay ? (
          <TeacherThayLayers mood={mood} />
        ) : (
          <TeacherCoNganLayers mood={mood} />
        )}
      </svg>

      {/* Bảng tên đeo ngực áo */}
      <div
        className="pointer-events-none absolute left-1/2 top-[242px] -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full px-3.5 py-[2px] text-[20px] font-black text-white shadow-[0_3px_0_rgba(0,0,0,0.25)]"
        style={{
          background: isThay
            ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
            : 'linear-gradient(135deg, #ff4081, #d81b60)',
          border: '2.5px solid #fff6dd',
        }}
      >
        {isThay ? `📘 ${shownTeacherName(v.cfg)}` : `🌸 ${v.cfg.teacherName}`}
      </div>

      {/* Animation bó hoa khi được tặng */}
      <AnimatePresence>
        {gotFlower && (
          <motion.div
            key={v.lastFlowerAt}
            initial={{ scale: 0, y: 70, rotate: -20 }}
            animate={{ scale: [0, 1.25, 1], y: 0, rotate: [0, 10, 0] }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="pointer-events-none absolute left-[155px] top-[230px] text-[84px] drop-shadow-lg"
          >
            💐
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// LỚP VẼ CÔ GIÁO (Áo dài, tóc dài suôn mượt, biểu cảm khuôn mặt)
// ============================================================================
function TeacherCoNganLayers({ mood }: { mood: TeacherMood }) {
  return (
    <g id="co-giao-ngan">
      {/* 1. TÓC SAU (Xõa dài sau lưng) */}
      <path
        d="M110 130 C90 190 85 280 95 350 C105 380 120 400 135 410 C140 370 145 280 140 220 Z"
        fill="url(#hairGrad)"
      />
      <path
        d="M230 130 C250 190 255 280 245 350 C235 380 220 400 205 410 C200 370 195 280 200 220 Z"
        fill="url(#hairGrad)"
      />

      {/* 2. QUẦN LỤA TRẮNG DƯỚI TÀ ÁO */}
      <path
        d="M135 340 L125 490 L160 490 L166 350 Z"
        fill="url(#quanLuaGrad)"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />
      <path
        d="M205 340 L215 490 L180 490 L174 350 Z"
        fill="url(#quanLuaGrad)"
        stroke="#e2e8f0"
        strokeWidth="1.5"
      />

      {/* Giày cao gót */}
      <ellipse cx="142" cy="492" rx="18" ry="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <ellipse cx="198" cy="492" rx="18" ry="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

      {/* 3. THÂN & TÀ ÁO DÀI (Truyền thống thon thả) */}
      {/* Tà sau */}
      <path
        d="M130 250 Q170 280 210 250 L226 470 Q170 482 114 470 Z"
        fill="#e11d48"
        opacity="0.85"
      />

      {/* Thân áo & Tà trước */}
      <path
        d="M132 170 C130 210 125 240 142 270 C150 285 152 320 124 460 Q170 475 216 460 C188 320 190 285 198 270 C215 240 210 210 208 170 Z"
        fill="url(#aoDaiGradCo)"
      />

      {/* Hàng cúc bấm bên ngực áo dài */}
      <circle cx="178" cy="178" r="2.5" fill="#ffd700" />
      <circle cx="184" cy="189" r="2.5" fill="#ffd700" />
      <circle cx="190" cy="201" r="2.5" fill="#ffd700" />
      <circle cx="194" cy="214" r="2.5" fill="#ffd700" />

      {/* Cổ áo dài đứng cao thanh thoát */}
      <path
        d="M152 150 Q170 156 188 150 L190 166 Q170 172 150 166 Z"
        fill="url(#aoDaiGradCo)"
        stroke="#ffccd5"
        strokeWidth="1"
      />

      {/* Cổ & Xương quai xanh */}
      <path d="M155 130 L155 155 Q170 162 185 155 L185 130 Z" fill="url(#skinGrad)" />

      {/* 4. TAY ÁO DÀI & BÀN TAY (Tùy theo biểu cảm) */}
      <TeacherArms mood={mood} isThay={false} />

      {/* 5. KHUÔN MẶT CÔ GIÁO */}
      <g id="co-head">
        {/* Khuôn mặt trái xoan */}
        <path
          d="M130 85 C130 135 146 148 170 148 C194 148 210 135 210 85 C210 52 194 40 170 40 C146 40 130 52 130 85 Z"
          fill="url(#skinGrad)"
        />

        {/* Hai má hồng phấn */}
        <ellipse cx="144" cy="108" rx="10" ry="6" fill="#ff4081" opacity={mood === 'praise' ? 0.5 : 0.3} />
        <ellipse cx="196" cy="108" rx="10" ry="6" fill="#ff4081" opacity={mood === 'praise' ? 0.5 : 0.3} />

        {/* Đôi mắt & Lông mày theo biểu cảm */}
        <TeacherEyes mood={mood} />

        {/* Mũi thanh tú */}
        <path d="M170 98 Q172 106 168 107 Q173 108 172 107" stroke="#e0a080" strokeWidth="1.5" strokeLinecap="round" />

        {/* Miệng cô giáo (có Lip-sync khi đang nói) */}
        <TeacherMouth mood={mood} />
      </g>

      {/* 6. MÁI TÓC TRƯỚC (Tóc mái thưa, bồng bềnh nữ tính) */}
      <g id="co-hair-front">
        <path
          d="M130 80 C125 50 145 35 170 35 C195 35 215 50 210 80 C206 58 190 48 170 48 C150 48 134 58 130 80 Z"
          fill="url(#hairGrad)"
        />
        {/* Mái bay 2 bên gò má */}
        <path
          d="M130 70 C126 95 128 130 134 150 C136 130 135 95 138 75 Z"
          fill="url(#hairGrad)"
        />
        <path
          d="M210 70 C214 95 212 130 206 150 C204 130 205 95 202 75 Z"
          fill="url(#hairGrad)"
        />
        {/* Kẹp ngọc cài tóc */}
        <circle cx="140" cy="56" r="4.5" fill="#ffe082" />
        <circle cx="140" cy="56" r="2.5" fill="#fff" />
      </g>
    </g>
  );
}

// ============================================================================
// LỚP VẼ THẦY GIÁO (Áo sơ mi / Áo dài nam, tóc ngắn lịch lãm)
// ============================================================================
function TeacherThayLayers({ mood }: { mood: TeacherMood }) {
  return (
    <g id="thay-giao">
      {/* 1. QUẦN TÂY ĐEN */}
      <path d="M133 330 L123 490 L162 490 L168 340 Z" fill="#1e293b" />
      <path d="M207 330 L217 490 L178 490 L172 340 Z" fill="#1e293b" />

      {/* Giày da */}
      <ellipse cx="140" cy="492" rx="19" ry="6.5" fill="#0f172a" />
      <ellipse cx="200" cy="492" rx="19" ry="6.5" fill="#0f172a" />

      {/* 2. ÁO DÀI NAM / SƠ MI */}
      <path
        d="M128 170 C126 210 124 250 136 300 L128 440 Q170 450 212 440 L204 300 C216 250 214 210 212 170 Z"
        fill="url(#aoDaiGradThay)"
      />

      {/* Cổ áo sơ mi / cổ đứng */}
      <path d="M152 148 Q170 156 188 148 L188 168 Q170 174 152 168 Z" fill="#0284c7" />
      <path d="M156 130 L156 154 Q170 160 184 154 L184 130 Z" fill="url(#skinGrad)" />

      {/* 3. TAY ÁO & DÁNG ĐIỆU */}
      <TeacherArms mood={mood} isThay={true} />

      {/* 4. KHUÔN MẶT THẦY GIÁO */}
      <g id="thay-head">
        <path
          d="M132 82 C132 135 146 146 170 146 C194 146 208 135 208 82 C208 50 194 38 170 38 C146 38 132 50 132 82 Z"
          fill="url(#skinGrad)"
        />

        {/* Mắt & Lông mày */}
        <TeacherEyes mood={mood} />

        {/* Kính cận trí thức */}
        <rect x="136" y="90" width="28" height="20" rx="5" fill="none" stroke="#334155" strokeWidth="2" />
        <rect x="176" y="90" width="28" height="20" rx="5" fill="none" stroke="#334155" strokeWidth="2" />
        <line x1="164" y1="99" x2="176" y2="99" stroke="#334155" strokeWidth="2" />

        {/* Mũi */}
        <path d="M170 98 L170 108 L173 108" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />

        {/* Miệng */}
        <TeacherMouth mood={mood} />
      </g>

      {/* 5. TÓC NGẮN NAM LỊCH LÃM */}
      <path
        d="M128 78 C126 44 142 30 170 30 C198 30 214 44 212 78 C208 48 196 42 170 42 C144 42 132 48 128 78 Z"
        fill="url(#hairGrad)"
      />
    </g>
  );
}

// ============================================================================
// ĐÔI TAY (Arms & Hands theo trạng thái)
// ============================================================================
function TeacherArms({ mood, isThay }: { mood: TeacherMood; isThay: boolean }) {
  const sleeveColor = isThay ? 'url(#aoDaiGradThay)' : 'url(#aoDaiGradCo)';

  switch (mood) {
    case 'praise':
      // Giơ ngón tay cái like (👍) khen ngợi
      return (
        <g id="arms-praise">
          {/* Tay trái đặt trước eo */}
          <path d="M130 175 Q115 220 140 240" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="144" cy="242" r="8" fill="url(#skinGrad)" />

          {/* Tay phải giơ like 👍 */}
          <path d="M210 175 Q240 205 238 230" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <g transform="translate(232, 222)">
            <circle cx="8" cy="8" r="8" fill="url(#skinGrad)" />
            {/* Ngón cái trỏ lên */}
            <path d="M6 4 L6 -4 Q9 -4 9 4 Z" fill="url(#skinGrad)" stroke="#e0a080" strokeWidth="1" />
          </g>
        </g>
      );

    case 'roast':
      // Tay đưa lên trỏ trêu / gãi má
      return (
        <g id="arms-roast">
          <path d="M130 175 Q115 220 142 240" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="145" cy="242" r="8" fill="url(#skinGrad)" />

          {/* Tay phải co lên gần cằm */}
          <path d="M210 175 Q235 190 220 140" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="218" cy="136" r="8" fill="url(#skinGrad)" />
        </g>
      );

    case 'surprise':
      // Hai tay ôm má bất ngờ
      return (
        <g id="arms-surprise">
          <path d="M130 175 Q110 150 128 120" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <ellipse cx="128" cy="116" rx="8" ry="9" fill="url(#skinGrad)" />

          <path d="M210 175 Q230 150 212 120" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <ellipse cx="212" cy="116" rx="8" ry="9" fill="url(#skinGrad)" />
        </g>
      );

    case 'speaking':
      // Một tay chỉ về phía bảng đen
      return (
        <g id="arms-speaking">
          <path d="M130 175 Q112 215 138 245" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="142" cy="248" r="8" fill="url(#skinGrad)" />

          {/* Tay phải chỉ về phía bảng đen bên phải */}
          <path d="M210 175 Q245 195 272 185" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="276" cy="184" r="8" fill="url(#skinGrad)" />
        </g>
      );

    case 'idle':
    default:
      // Hai tay buông nhẹ nhàng đoan trang phía trước
      return (
        <g id="arms-idle">
          <path d="M130 175 Q116 225 152 248" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="156" cy="250" r="8" fill="url(#skinGrad)" />

          <path d="M210 175 Q224 225 188 248" stroke={sleeveColor} strokeWidth="18" strokeLinecap="round" />
          <circle cx="184" cy="250" r="8" fill="url(#skinGrad)" />
        </g>
      );
  }
}

// ============================================================================
// ĐÔI MẮT & LÔNG MÀY (Eyes & Eyebrows)
// ============================================================================
function TeacherEyes({ mood }: { mood: TeacherMood }) {
  switch (mood) {
    case 'praise':
      // Mắt cười tít hình trăng khuyết ^ ^
      return (
        <g id="eyes-praise">
          {/* Lông mày cong tươi vui */}
          <path d="M140 86 Q150 82 158 86" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M182 86 Q190 82 200 86" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Đôi mắt cười cong */}
          <path d="M142 98 Q150 90 158 98" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M182 98 Q190 90 198 98" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'roast':
      // Lông mày một bên nhướng cao trêu chọc
      return (
        <g id="eyes-roast">
          <path d="M140 88 Q150 86 158 88" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M182 82 Q190 76 200 82" stroke="#4a3525" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Mắt liếc nhẹ */}
          <ellipse cx="149" cy="98" rx="7" ry="6" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="151" cy="98" r="4" fill="#292524" />
          <circle cx="152" cy="96" r="1.5" fill="#fff" />

          <ellipse cx="191" cy="98" rx="7" ry="6" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="193" cy="98" r="4" fill="#292524" />
          <circle cx="194" cy="96" r="1.5" fill="#fff" />
        </g>
      );

    case 'surprise':
      // Mắt mở to tròn kinh ngạc
      return (
        <g id="eyes-surprise">
          <path d="M140 82 Q150 78 158 82" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M182 82 Q190 78 200 82" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />

          <circle cx="149" cy="98" r="8" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="149" cy="98" r="5" fill="#292524" />
          <circle cx="151" cy="96" r="2" fill="#fff" />

          <circle cx="191" cy="98" r="8" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="191" cy="98" r="5" fill="#292524" />
          <circle cx="193" cy="96" r="2" fill="#fff" />
        </g>
      );

    case 'idle':
    case 'speaking':
    default:
      // Mắt to tròn hiền hòa
      return (
        <g id="eyes-normal">
          <path d="M140 86 Q150 82 158 85" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M182 85 Q190 82 200 86" stroke="#4a3525" strokeWidth="2" strokeLinecap="round" fill="none" />

          <ellipse cx="149" cy="98" rx="7.5" ry="6.5" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="149" cy="98" r="4.2" fill="#292524" />
          <circle cx="150.5" cy="96" r="1.6" fill="#fff" />

          <ellipse cx="191" cy="98" rx="7.5" ry="6.5" fill="#fff" stroke="#1c1917" strokeWidth="1.5" />
          <circle cx="191" cy="98" r="4.2" fill="#292524" />
          <circle cx="192.5" cy="96" r="1.6" fill="#fff" />
        </g>
      );
  }
}

// ============================================================================
// KHẨU HÌNH MIỆNG (Mouth & Lip-Sync Animation)
// ============================================================================
function TeacherMouth({ mood }: { mood: TeacherMood }) {
  if (mood === 'speaking') {
    // Lip-sync: miệng đóng mở nhịp nhàng khi TTS đang phát âm
    return (
      <g id="mouth-speaking">
        <motion.path
          d="M162 120 Q170 126 178 120 Q170 134 162 120 Z"
          fill="#e11d48"
          stroke="#be123c"
          strokeWidth="1"
          animate={{
            d: [
              'M162 122 Q170 124 178 122 Q170 126 162 122 Z', // khép
              'M162 119 Q170 125 178 119 Q170 135 162 119 Z', // mở to
              'M163 120 Q170 125 177 120 Q170 130 163 120 Z', // mở vừa
              'M162 122 Q170 124 178 122 Q170 126 162 122 Z', // khép
            ],
          }}
          transition={{ duration: 0.38, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Răng trắng khi hé mở */}
        <motion.rect
          x="166"
          y="120"
          width="8"
          height="3"
          rx="1"
          fill="#fff"
          animate={{ opacity: [0, 1, 0.5, 0] }}
          transition={{ duration: 0.38, repeat: Infinity }}
        />
      </g>
    );
  }

  if (mood === 'praise') {
    // Miệng cười rạng rỡ hở răng tươi tắn
    return (
      <g id="mouth-praise">
        <path d="M160 118 Q170 132 180 118 Q170 120 160 118 Z" fill="#e11d48" stroke="#be123c" strokeWidth="1" />
        <path d="M163 119 Q170 124 177 119 Z" fill="#ffffff" />
      </g>
    );
  }

  if (mood === 'roast') {
    // Miệng cười mỉm lém lỉnh lệch nhẹ
    return (
      <path
        d="M163 123 Q170 126 179 120"
        stroke="#e11d48"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (mood === 'surprise') {
    // Miệng chữ O ngạc nhiên
    return (
      <ellipse
        cx="170"
        cy="123"
        rx="5.5"
        ry="7"
        fill="#9f1239"
        stroke="#be123c"
        strokeWidth="1.5"
      />
    );
  }

  // Mặc định: Nụ cười mỉm chúm chím dịu dàng
  return (
    <path
      d="M163 122 Q170 127 177 122"
      stroke="#e11d48"
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  );
}

