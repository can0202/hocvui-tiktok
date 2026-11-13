import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState, StageView } from '../../game/useGame';
import { shownTeacherName } from '../../game/config';
import { giftOf, tierOf } from '../../game/quiz';
import { getGonTheme, applyGonTheme, GON_THEME_VARS, type GonThemeName } from './theme';
import { GonTeacher } from './GonTeacher';
import './gon.css';

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const CIRCLE_COLORS = [
  '#f43f5e', '#06b6d4', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6',
  '#d946ef', '#e11d48', '#0ea5e9', '#84cc16'
];

function getInitialLetter(name: string): string {
  if (!name) return 'A';
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1]?.[0] || 'A').toUpperCase();
}

function getColorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CIRCLE_COLORS[h % CIRCLE_COLORS.length];
}

export function GonStage({ game }: { game: GameState }) {
  const now = useNow();
  const v = game.view;
  const [theme, setTheme] = useState<GonThemeName>(() => getGonTheme());

  useEffect(() => {
    applyGonTheme(theme);
    const handler = () => setTheme(getGonTheme());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [theme]);

  if (!v) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/80 text-center font-bold text-[36px] text-white">
        Chưa mở trang stage (?view=stage) nên chưa có dữ liệu xem trước
      </div>
    );
  }

  // Ép trạng thái xem thử qua ?state=reveal|recess|monitor|full|everest|chuong|flower|gift (nếu có trên URL)
  const urlState = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('state')
    : null;

  // Xác định chính xác phase hiện tại của game (không bị đè trạng thái)
  const isPreviewEverest = urlState === 'everest';
  const isPreviewChuong = urlState === 'chuong';
  const isPreviewFlower = urlState === 'flower';
  const isPreviewGift = urlState === 'gift';

  const isShow = isPreviewEverest || isPreviewChuong || (v.phase === 'show' && Boolean(v.show));
  const isTeam = !isShow && v.phase === 'team';
  const isVote = !isShow && v.phase === 'vote' && Boolean(v.vote);
  const isReveal = urlState === 'reveal' || (!isShow && v.phase === 'reveal');
  const isRecess = urlState === 'recess' || (!isShow && v.phase === 'recess');
  const isMonitor = urlState === 'monitor' || (!isShow && (v.phase === 'results' || v.phase === 'praise'));
  const isFullClass = urlState === 'full' || (!isShow && !isTeam && !isVote && !isReveal && !isRecess && !isMonitor && v.phase === 'question' && (v.seats.length >= 20 || v.roster.seated >= 20));

  // Nhận biết sự kiện tặng hoa / quà
  const giftCoins = game.lastGift ? (game.lastGift.diamondCount || 1) * (game.lastGift.repeatCount || 1) : 0;
  const isLastGiftBig = giftCoins >= 10 || (tierOf(giftCoins) >= 2) || (game.lastGift?.giftName?.toLowerCase().includes('mũ') ?? false);
  const isLastGiftRecent = Boolean(game.lastGift && now - game.lastGift.at < 6000);
  const isWalkRecent = Boolean(v.walk && now - v.walk.at < 6000);
  const isFlowerRecent = now - v.lastFlowerAt < 6000;
  const isFundPartyRecent = Boolean(v.fund?.party && v.fund.party > 0);

  const hasFlower = isPreviewFlower || isPreviewGift || isWalkRecent || isFlowerRecent || isLastGiftRecent || isFundPartyRecent;

  const giftInfo = isPreviewGift
    ? { nickname: 'Gia Huy', giftName: 'Món quà to (Mũ)', icon: '🎁', isBig: true }
    : isPreviewFlower
    ? { nickname: 'Bé Na', giftName: 'Hoa hồng', icon: '🌹', isBig: false }
    : isLastGiftRecent && game.lastGift
    ? {
        nickname: game.lastGift.nickname,
        giftName: isLastGiftBig ? (game.lastGift.giftName || 'Món quà to') : (giftOf(game.lastGift.giftName)?.say ?? game.lastGift.giftName ?? 'Hoa hồng'),
        icon: isLastGiftBig ? '🎁' : (giftOf(game.lastGift.giftName)?.icon ?? '🌹'),
        isBig: isLastGiftBig,
      }
    : isWalkRecent && v.walk
    ? {
        nickname: v.walk.nickname,
        giftName: v.walk.tier >= 2 ? 'Món quà to' : 'Bó hoa tươi',
        icon: v.walk.tier >= 2 ? '🎁' : (v.walk.icon || '🌹'),
        isBig: v.walk.tier >= 2,
      }
    : isFundPartyRecent && v.fund?.party
    ? {
        nickname: 'Cả lớp',
        giftName: `Đạt mốc ${v.fund.party} hoa!`,
        icon: '🎉',
        isBig: true,
      }
    : isFlowerRecent
    ? {
        nickname: 'Bé Na',
        giftName: 'Hoa hồng',
        icon: '🌹',
        isBig: false,
      }
    : null;

  const left = Math.max(0, Math.ceil((v.endsAt - now) / 1000));
  const teacherName = shownTeacherName(v.cfg);
  const nextShowName =
    v.nextShow?.kind === 'chuong'
      ? 'Rung chuông đồng'
      : v.nextShow?.kind === 'everest'
      ? 'Đường lên đỉnh Everest'
      : 'Rung chuông đồng';
  const nextShowRound = v.nextShow?.afterRound ?? 4;

  const sampleCorrect = [
    { nickname: 'Bé Na', pts: 10 },
    { nickname: 'Lan Anh', pts: 7 },
    { nickname: 'Khoa', pts: 5 },
    { nickname: 'Thu Hà', pts: 3 },
    { nickname: 'Đức', pts: 1 },
  ];

  const top1 = v.seats.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  const top1Student = top1 ? { nickname: top1.nickname, score: top1.score } : { nickname: 'Bé Na', score: 30 };

  const fastestList = v.correctTop.length > 0
    ? v.correctTop.slice(0, 5).map((c, i) => ({ nickname: c.nickname, pts: [10, 7, 5, 3, 1][i] || 1 }))
    : sampleCorrect;

  const activeShow = v.show || (isShow ? {
    kind: isPreviewChuong ? ('chuong' as const) : ('everest' as const),
    name: isPreviewChuong ? '🔔 Rung Chuông Đồng' : '🏔️ Đường lên đỉnh Everest',
    step: 'mc' as const,
    section: isPreviewChuong ? '🔥 Làm nóng' : '🌪️ Bão tốc độ',
    tag: 'warm' as const,
    stage: 'ask' as const,
    qNo: 1,
    question: isPreviewChuong
      ? 'Trống trường thường được làm từ chất liệu truyền thống nào sau đây?'
      : 'Đỉnh núi Everest thuộc dãy núi hùng vĩ nào trên thế giới?',
    opts: isPreviewChuong
      ? ['Gỗ mít da trâu', 'Nhựa tổng hợp', 'Gỗ thông ép', 'Kim loại đồng']
      : ['Dãy Himalaya', 'Dãy Andes', 'Dãy Rocky', 'Dãy Alps'],
    removed: [] as number[],
    ans: 0,
    counts: [4, 2, 1, 3],
    answered: 10,
    lastRight: 4,
    stakes: [6, 4],
    code: null,
    honors: [] as { username: string; nickname: string; score: number; title: string }[],
    top: [
      { nickname: 'Bé Na', score: 40 },
      { nickname: 'Minh Tuấn', score: 30 },
      { nickname: 'Lan Anh', score: 20 },
    ],
    players: 18,
  } : null);

  return (
    <div
      className="gon-stage"
      data-gon-theme={theme}
      style={GON_THEME_VARS[theme] as React.CSSProperties}
    >
      {/* ─── HIỆU ỨNG: Hạt sao vàng (Golden Question) ────────────────── */}
      {v.golden && v.phase !== 'recess' && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {Array.from({ length: 28 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ y: -50, opacity: 0, rotate: 0 }}
              animate={{ y: 1950, opacity: [0, 1, 1, 0], rotate: 720 }}
              transition={{ duration: 3.5 + (i % 5) * 0.5, delay: (i * 0.15) % 3, repeat: Infinity }}
              className="absolute text-[30px]"
              style={{ left: `${((i * 13) % 94) + 3}%`, color: '#facc15' }}
            >
              {['⭐', '✨', '🪙', '🌟'][i % 4]}
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── VỖ TAY KHI ĐÚNG / QUỸ HOA ĐỦ ───────────────────────────── */}
      {v.clapping && (
        <div className="pointer-events-none absolute inset-0 z-50">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ y: 1600, opacity: 0 }}
              animate={{ y: 600, opacity: [0, 1, 0] }}
              transition={{ duration: 2, delay: (i % 6) * 0.25, repeat: Infinity }}
              className="absolute text-[64px]"
              style={{ left: 80 + i * 78 }}
            >
              👏
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── BIỂU NGỮ NỔI: Sinh nhật ───────────────────────────────── */}
      <AnimatePresence>
        {v.birthday && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            style={{ position: 'absolute', left: 60, top: 520, width: 960, zIndex: 100 }}
            className="rounded-[32px] border-4 border-white bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 p-8 text-center text-white shadow-2xl"
          >
            <div className="text-[44px] font-extrabold leading-tight">🎂 CHÚC MỪNG SINH NHẬT! 🎂</div>
            <div className="mt-2 text-[56px] font-black drop-shadow">{v.birthday.nickname}</div>
            <div className="mt-1 text-[28px] font-bold opacity-90">Cả lớp cùng gửi lời chúc tốt đẹp nhất nhé 💕</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BIỂU NGỮ NỔI: Chào tạm biệt (Căn giữa tuyệt đối, không lệch UI) ─── */}
      <AnimatePresence>
        {v.goodbye && (
          <motion.div
            key={v.goodbye.at}
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40 }}
            style={{ position: 'absolute', left: 60, top: 520, width: 960, zIndex: 100 }}
            className="rounded-[32px] border-4 border-white bg-gradient-to-r from-sky-500 via-indigo-500 to-pink-500 p-8 text-center text-white shadow-2xl"
          >
            <div className="text-[60px]">👋</div>
            <div className="mt-1 text-[44px] font-black leading-tight">Tan lớp rồi! Hẹn gặp lại cả lớp nha 💕</div>
            <div className="mt-2 text-[26px] font-bold opacity-90">Nhớ theo dõi kênh để không bỏ lỡ buổi học tiếp theo!</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HIỆU ỨNG BẠN NHỎ LÊN TẶNG HOA / QUÀ (FLOWER WALK) ─── */}
      <AnimatePresence>
        {giftInfo && (
          <motion.div
            key={giftInfo.nickname + giftInfo.giftName + 'walk'}
            initial={{ opacity: 0, x: 220, y: 350, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 1, 0],
              x: [220, 60, 60, 60, -80],
              y: [350, 40, 40, 40, 120],
              scale: [0.5, 1.15, 1.05, 1.05, 0.7],
            }}
            transition={{ duration: 4.8, times: [0, 0.25, 0.7, 0.85, 1], ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              right: 140,
              top: 660,
              zIndex: 95,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <div className="relative">
              <div
                className="flex items-center justify-center rounded-full text-white font-black shadow-2xl"
                style={{
                  width: 96,
                  height: 96,
                  fontSize: 38,
                  background: 'linear-gradient(135deg, #f43f5e, #8b5cf6)',
                  border: '4px solid white',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                {giftInfo.nickname.slice(0, 1).toUpperCase()}
              </div>
              <motion.div
                animate={{ rotate: [-10, 15, -10], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="absolute -right-4 -top-4 text-[52px] drop-shadow-lg"
              >
                {giftInfo.icon}
              </motion.div>
            </div>
            <div
              className="mt-2 rounded-full px-4 py-1 text-[22px] font-black text-white shadow-lg"
              style={{ background: 'rgba(0,0,0,0.85)', border: '2px solid rgba(255,255,255,0.6)' }}
            >
              {giftInfo.nickname}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BIỂU NGỮ NỔI: Tặng quà / Tặng hoa (Hiển thị rực rỡ khi nhận hoa hoặc quà to) ─── */}
      <AnimatePresence>
        {giftInfo && (
          <motion.div
            key={giftInfo.nickname + giftInfo.giftName}
            initial={{ opacity: 0, scale: 0.7, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ position: 'absolute', left: 60, top: 400, width: 960, zIndex: 100 }}
            className={`rounded-[32px] border-4 border-white p-7 text-center text-white shadow-2xl ${
              giftInfo.isBig
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 shadow-[0_0_50px_rgba(245,158,11,0.7)]'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 shadow-[0_0_40px_rgba(244,63,94,0.6)]'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-[44px] animate-bounce">✨</span>
              <div className="text-[76px] leading-none drop-shadow-md animate-pulse">{giftInfo.icon}</div>
              <span className="text-[44px] animate-bounce">✨</span>
            </div>
            <div className="mt-2 text-[46px] font-black leading-tight drop-shadow-lg">
              {giftInfo.nickname} tặng {teacherName.toLowerCase()} {giftInfo.giftName}!
            </div>
            <div className="mt-2 text-[26px] font-bold opacity-95 drop-shadow">
              {giftInfo.isBig
                ? '🎆 MÓN QUÀ TO TUYỆT VỜI! Cả lớp cùng nhiệt liệt vỗ tay chúc mừng 🎉'
                : '💐 Cảm ơn bạn nhỏ nhiều lắm, hoa đẹp quá, chúc bạn luôn học giỏi 💕'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BIỂU NGỮ NỔI: Giám thị đưa bạn ra ─────────────────────── */}
      <AnimatePresence>
        {v.escort && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', left: 60, top: 540, width: 960, zIndex: 100 }}
            className="rounded-[28px] border-3 border-[#38bdf8] bg-slate-800 p-6 text-center text-[26px] font-bold text-white shadow-2xl"
          >
            👮 Thầy giám thị: Mời bạn <b>{v.escort.out.nickname}</b> ra ngoài vì ngồi im quá lâu!
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BIỂU NGỮ NỔI: Quỹ lớp đủ mốc (Fund Party) ─────────────── */}
      <AnimatePresence>
        {v.fund.party > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', left: 60, top: 520, width: 960, zIndex: 100 }}
            className="rounded-[32px] border-4 border-yellow-300 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 p-8 text-center text-white shadow-2xl"
          >
            <div className="text-[46px] font-black leading-tight">🎆 Quỹ lớp đủ {v.fund.party} bông hoa! 🎆</div>
            <div className="mt-1 text-[30px] font-bold">{teacherName} cảm ơn cả lớp nhiều lắm 💕</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── VÙNG AN TOÀN TIKTOK ───────────────────────────────────── */}
      <div className="gon-safe-area">
        {/* Vùng TikTok trên (chừa 224px) */}
        <div className="gon-top-space">
          <div className="gon-guide-bar">
            Vùng TikTok: tên kênh, Follow, banner (không đặt nội dung)
          </div>
        </div>

        {/* ─── VÙNG NỘI DUNG CHÍNH (1440px) ────────────────────────── */}
        <div className="gon-content">
          {/* 1. HÀNG ĐẦU: Tên game & 3 chip */}
          <div className="gon-header-row">
            <div className="gon-logo-group">
              <span className="gon-main-title">Lớp Học Chữ</span>
              <span className="gon-main-sub">Nghe hết đề, gõ mới ăn điểm</span>
            </div>
            <div className="gon-header-chips">
              <span className="gon-pill">Tiết {v.round || 1}</span>
              <span className="gon-pill active">
                {isShow
                  ? (v.show?.kind === 'everest' ? '🏔️ Everest' : '🔔 Chuông Đồng')
                  : isRecess
                  ? 'Ra chơi'
                  : isMonitor
                  ? 'Xong tiết'
                  : `Câu ${v.qNo || 1}/${v.total || 20}`}
              </span>
              <span className="gon-pill">
                {isFullClass ? '20/20' : `${Math.min(20, v.seats.length || v.roster.seated || 0)}/20`}
              </span>
            </div>
          </div>

          {/* 2. HÀNG CHIP: Quỹ lớp & Sự kiện */}
          <div className="gon-sub-chips">
            <span className="gon-pill gon-pill-gold">Quỹ lớp {v.fund.today || 3}</span>
            <span className="gon-pill gon-pill-event">
              Sự kiện: {nextShowName} · sau tiết {nextShowRound}
            </span>
          </div>

          {/* ========================================================
              UI A: GAME LỚN (ĐƯỜNG LÊN ĐỈNH EVEREST / RUNG CHUÔNG ĐỒNG)
             ======================================================== */}
          {isShow && activeShow && (
            <>
              <div className="gon-blackboard" style={{ padding: '24px 32px' }}>
                <div className="gon-blackboard-top">
                  <span
                    className="gon-topic-tag"
                    style={{
                      background: activeShow.kind === 'everest' ? '#38bdf8' : '#fbbf24',
                      color: '#0c0a09',
                    }}
                  >
                    {activeShow.step === 'gather'
                      ? activeShow.name
                      : activeShow.step === 'section'
                      ? activeShow.section || activeShow.name
                      : activeShow.step === 'stake'
                      ? '🏔️ Chọn mức điểm'
                      : activeShow.step === 'code'
                      ? '🔐 Mật mã trạm'
                      : activeShow.tag === 'bell'
                      ? '🔔 Câu Chuông Đồng'
                      : `Câu ${activeShow.qNo}`}
                  </span>
                  {activeShow.stage === 'ask' && (v.boardShown || isPreviewEverest || isPreviewChuong) ? (
                    <div className="gon-timer-circle">{left || 15}</div>
                  ) : activeShow.stage === 'reveal' ? (
                    <span className="gon-pill active" style={{ background: '#4ade80', color: '#000', fontSize: 22 }}>
                      Đáp án
                    </span>
                  ) : (
                    <span className="gon-pill" style={{ fontSize: 22 }}>
                      👂 Nghe cô đọc…
                    </span>
                  )}
                </div>

                {/* 1. Bước Gather (Mở màn game lớn) */}
                {activeShow.step === 'gather' && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="text-[64px] leading-none">
                      {activeShow.kind === 'everest' ? '🏔️' : '🔔'}
                    </div>
                    <div
                      className="mt-2 text-[46px] font-black leading-tight"
                      style={{ color: activeShow.kind === 'everest' ? '#38bdf8' : '#fbbf24' }}
                    >
                      {activeShow.name}
                    </div>
                    <div className="mt-3 space-y-1.5 text-[26px] font-bold text-white/90">
                      <div>Gõ A, B, C, D · ai đúng cũng có điểm</div>
                      <div>Sai không bị loại · tranh tài bảng vàng!</div>
                    </div>
                    <div className="mt-4 text-[26px] font-bold text-[#facc15]">
                      Bắt đầu sau {left || 10} giây
                    </div>
                  </div>
                )}

                {/* 2. Bước Section (Tiêu đề chặng thi) */}
                {activeShow.step === 'section' && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-[28px] opacity-80">{activeShow.name}</div>
                    <div
                      className="mt-2 text-[54px] font-black leading-tight"
                      style={{ color: activeShow.kind === 'everest' ? '#38bdf8' : '#fbbf24' }}
                    >
                      {activeShow.section}
                    </div>
                  </div>
                )}

                {/* 3. Bước MC (Câu hỏi trắc nghiệm A, B, C, D) */}
                {activeShow.step === 'mc' && (
                  <>
                    <div className="gon-clue-box" style={{ fontSize: 32, minHeight: 90 }}>
                      {activeShow.question || 'Đang tải câu hỏi trắc nghiệm...'}
                    </div>
                    <div className="gon-show-options">
                      {activeShow.opts.map((opt, idx) => {
                        const isAns = activeShow?.stage === 'reveal' && activeShow?.ans === idx;
                        const count = activeShow?.counts[idx] || 0;
                        return (
                          <div key={idx} className={`gon-show-opt ${isAns ? 'correct' : ''}`}>
                            <div className="gon-show-opt-letter">{'ABCD'[idx]}</div>
                            <span className="flex-1 truncate">{opt}</span>
                            {(activeShow?.stage === 'reveal' || count > 0) && (
                              <span className="text-[20px] font-bold opacity-80">{count}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-center text-[22px] font-bold text-white/80">
                      {activeShow.stage === 'reveal'
                        ? `✅ ${activeShow.lastRight} bạn trả lời đúng!`
                        : `Gõ A, B, C hoặc D · ${activeShow.answered} bạn đã chọn`}
                    </div>
                  </>
                )}

                {/* 4. Bước Stake (Cược 10 hoặc 20 điểm) */}
                {activeShow.step === 'stake' && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="text-[34px] font-bold text-white">Câu tiếp theo cược bao nhiêu điểm?</div>
                    <div className="gon-stakes-wrap">
                      {[10, 20].map((pts, i) => (
                        <div key={pts} className="gon-stake-box">
                          <div className="gon-stake-val">{pts}</div>
                          <div className="mt-1 text-[22px] font-bold">
                            Gõ "{pts}" · {activeShow?.stakes[i] || 0} bạn
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Bước Code (Mật mã trạm) */}
                {(activeShow.step === 'code' || activeShow.step === 'codeReveal') && activeShow.code && (
                  <div className="flex flex-col items-center py-4">
                    <div className="text-[28px] font-bold text-white">🔐 GIẢI MẬT MÃ TRẠM</div>
                    <div className="my-3 flex gap-2">
                      {Array.from({ length: activeShow.code.len }, (_, i) => (
                        <div
                          key={i}
                          className="flex h-[56px] w-[46px] items-center justify-center rounded-xl border-3 border-[#facc15] bg-white/10 text-[32px] font-black text-[#facc15]"
                        >
                          {activeShow?.code?.answer?.[i] || (i === 0 ? activeShow?.code?.first : '')}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-center text-[24px] text-white/90">
                      {activeShow.code.hints.map((h, i) => (
                        <div key={i}>
                          <b className="text-[#38bdf8]">{[30, 20, 10][i]}đ:</b> {h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Bước Honor (Vinh danh game lớn) */}
                {activeShow.step === 'honor' && (
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="text-[44px] font-black text-[#fbbf24]">
                      {activeShow.kind === 'everest' ? '🚩 VINH DANH ĐỈNH EVEREST' : '🔔 VINH DANH CHUÔNG ĐỒNG'}
                    </div>
                    <div className="my-3 flex flex-col gap-2 w-full max-w-[600px]">
                      {activeShow.honors.slice(0, 5).map((h, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-2 text-[26px] font-bold text-white"
                        >
                          <span>{i + 1}. {h.nickname}</span>
                          <span className="text-[#facc15]">{h.score}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bảng điểm top Everest / Chuông Đồng */}
              <div className="gon-info-card">
                <span className="gon-card-heading">
                  {activeShow.kind === 'everest' ? 'TOP LEO NÚI' : 'TOP RUNG CHUÔNG'}
                </span>
                <div className="flex flex-col gap-1.5">
                  {(activeShow.top.length > 0 ? activeShow.top.slice(0, 3) : sampleCorrect.slice(0, 3)).map((item, idx) => (
                    <div key={idx} className="gon-interact-item">
                      <span>{idx + 1}. {item.nickname}</span>
                      <span className="text-[#38bdf8] font-black">
                        {'score' in item ? item.score : item.pts}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thanh giáo viên */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {` · Đang diễn ra ${activeShow.name}!`}
                  </div>
                  <div className="gon-teacher-line2">
                    {activeShow.step === 'mc' ? 'Nhanh tay gõ đáp án A, B, C hoặc D' : 'Cả lớp chú ý theo dõi chặng thi'}
                  </div>
                </div>
                <span className="gon-teacher-badge">{activeShow.players || v.roster.seated} bạn chơi</span>
              </div>
            </>
          )}

          {/* ========================================================
              UI B: CHỌN TỔ THI ĐUA (phase === 'team')
             ======================================================== */}
          {isTeam && !isShow && (
            <>
              <div className="gon-blackboard" style={{ padding: '24px 32px' }}>
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">🚩 CHỌN TỔ THI ĐUA</span>
                  <div className="gon-timer-circle">{left}</div>
                </div>
                <div className="my-2 text-center text-[34px] font-bold text-white">
                  Gõ <b className="text-[#facc15]">tổ 1</b>, <b className="text-[#facc15]">tổ 2</b>, <b className="text-[#facc15]">tổ 3</b> hoặc <b className="text-[#facc15]">tổ 4</b>
                </div>
                <div className="grid grid-cols-2 gap-4 py-4">
                  {[
                    { no: 1, color: '#f43f5e', icon: '🔴' },
                    { no: 2, color: '#06b6d4', icon: '🔵' },
                    { no: 3, color: '#4ade80', icon: '🟢' },
                    { no: 4, color: '#facc15', icon: '🟡' },
                  ].map((t) => (
                    <div
                      key={t.no}
                      className="flex flex-col items-center rounded-2xl border-4 p-4 text-center"
                      style={{ borderColor: t.color, background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div className="text-[36px] font-black" style={{ color: t.color }}>
                        {t.icon} Tổ {t.no}
                      </div>
                      <div className="mt-1 text-[28px] font-bold text-white">
                        {v.teams.find((x) => x.no === t.no)?.members || 0} bạn
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-info-card">
                <span className="gon-card-heading">HƯỚNG DẪN CHỌN TỔ</span>
                <div className="text-[22px] leading-relaxed text-white/90">
                  Học sinh gõ tên tổ để gia nhập đội. Hết 45 giây đếm ngược, những bạn chưa chọn sẽ được thầy/cô tự động phân bổ đều vào các tổ!
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Chọn tổ thi đua đầu tiết!'}
                  </div>
                  <div className="gon-teacher-line2">
                    {v.noTeam > 0 ? `Còn ${v.noTeam} bạn chưa chọn tổ` : 'Cả lớp đã sẵn sàng!'}
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.roster.seated} bạn</span>
              </div>
            </>
          )}

          {/* ========================================================
              UI C: BẦU CHỌN CHỦ ĐỀ TIẾT SAU (phase === 'vote')
             ======================================================== */}
          {isVote && !isShow && !isTeam && v.vote && (
            <>
              <div className="gon-blackboard" style={{ padding: '24px 32px' }}>
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">🗳️ CẢ LỚP QUYẾT ĐỊNH</span>
                  <div className="gon-timer-circle">{left}</div>
                </div>
                <div className="my-2 text-center text-[36px] font-bold text-white">Tiết sau học gì?</div>
                <div className="my-3 flex flex-col gap-4">
                  {v.vote.topics.map((label, idx) => {
                    const total = (v.vote?.counts[0] ?? 0) + (v.vote?.counts[1] ?? 0) || 1;
                    const pct = Math.round(((v.vote?.counts[idx] ?? 0) / total) * 100);
                    return (
                      <div key={label} className="gon-vote-bar" style={{ height: 76 }}>
                        <div className="gon-vote-fill" style={{ width: `${pct}%` }} />
                        <span className="relative z-10 text-[30px]">
                          Gõ <b>{idx + 1}</b>: {label}
                        </span>
                        <span className="relative z-10 text-[32px] font-black">{v.vote?.counts[idx] ?? 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Bầu chọn chủ đề tiết sau'}
                  </div>
                  <div className="gon-teacher-line2">
                    Gõ số tương ứng với chủ đề bạn muốn học!
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.roster.seated} bạn</span>
              </div>
            </>
          )}

          {/* ========================================================
              UI 1: HIỆN ĐÁP ÁN (Neon - Hiện đáp án)
             ======================================================== */}
          {isReveal && !isShow && !isTeam && !isVote && (
            <>
              <div className="gon-blackboard">
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">{v.category || 'Công sở: tiền bạc'}</span>
                  <span className="gon-pill active" style={{ padding: '6px 20px', fontSize: 22 }}>
                    Hết giờ
                  </span>
                </div>
                <div className="gon-reveal-ans-tag">ĐÁP ÁN</div>
                <div className="gon-tiles-row">
                  {(v.answer ? v.answer.replace(/\s+/g, '').split('') : ['T', 'H', 'Ứ', 'H', 'A', 'I']).map((ch, i) => (
                    <div
                      key={`ans-${i}`}
                      className="gon-tile-card"
                      style={i === 3 ? { marginLeft: 24 } : undefined}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
                <div className="gon-reveal-count-pill">
                  {v.correctCount || 3} người đoán đúng!
                </div>
              </div>

              <div className="gon-info-card">
                <span className="gon-card-heading">AI ĐOÁN ĐÚNG?</span>
                <div className="gon-fastest-row">
                  {fastestList.map((item, idx) => (
                    <div key={idx} className="gon-fastest-col">
                      <div className="gon-initial-circle" style={{ background: getColorForName(item.nickname) }}>
                        {getInitialLetter(item.nickname)}
                      </div>
                      <span className="gon-fastest-name">{item.nickname}</span>
                      <span className="gon-pts-pill">+{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Đúng rồi cả lớp!'}
                  </div>
                  <div className="gon-teacher-line2">
                    {v.answer || 'Thứ Hai'}, vỗ tay cho {fastestList[0]?.nickname || 'Bé Na'} nào
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.correctCount || 5} bạn đúng</span>
              </div>

              <div className="gon-class-card">
                <div className="gon-class-card-top">
                  <span className="gon-class-card-title">LỚP HỌC · {Math.min(20, v.seats.length)}/20</span>
                </div>
                <div className="gon-desks-grid">
                  {Array.from({ length: 20 }, (_, i) => {
                    const s = v.seats[i];
                    return (
                      <div
                        key={i}
                        className="gon-desk-cell"
                        style={s ? { borderStyle: 'solid', borderColor: getColorForName(s.nickname) } : undefined}
                      >
                        {s && (
                          <>
                            <div
                              className="gon-seat-avatar"
                              style={{ background: getColorForName(s.nickname) }}
                            >
                              {getInitialLetter(s.nickname)}
                            </div>
                            <span className="gon-seat-name" style={{ color: 'var(--g-text-main)' }}>
                              {s.nickname}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ========================================================
              UI 2: RA CHƠI (Neon - Ra chơi & các trò chơi ra chơi)
             ======================================================== */}
          {isRecess && !isShow && !isTeam && !isVote && !isReveal && (
            <>
              {v.recess?.game === 'rps' ? (
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">✊ Giờ ra chơi: Oẳn tù tì</span>
                    <div className="gon-timer-circle" style={{ width: 72, height: 72, fontSize: 36, borderWidth: 5 }}>
                      {left}
                    </div>
                  </div>
                  <div className="mt-2 text-center text-[30px] font-bold text-white">
                    Gõ: <b>búa</b>, <b>kéo</b> hoặc <b>bao</b>
                  </div>
                  <div className="my-2 flex justify-center gap-6">
                    {[
                      { icon: '✊', word: 'búa', count: v.recess.rpsCounts[0] || 0 },
                      { icon: '✌️', word: 'kéo', count: v.recess.rpsCounts[1] || 0 },
                      { icon: '✋', word: 'bao', count: v.recess.rpsCounts[2] || 0 },
                    ].map((item) => (
                      <div
                        key={item.word}
                        className="flex w-[150px] flex-col items-center rounded-2xl border-2 border-white/30 bg-white/10 py-2"
                      >
                        <span className="text-[52px] leading-none">{item.icon}</span>
                        <span className="text-[24px] font-bold">{item.word}</span>
                        <span className="text-[28px] font-black text-[#4ade80]">{item.count}</span>
                      </div>
                    ))}
                  </div>
                  {v.recess.teacher && (
                    <div className="text-center text-[28px] font-bold text-[#fde047]">
                      {teacherName} ra: <b>{v.recess.teacher}</b>!
                    </div>
                  )}
                </div>
              ) : v.recess?.game === 'pick' ? (
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">⚖️ Giờ ra chơi: Chọn phe</span>
                    <div className="gon-timer-circle" style={{ width: 72, height: 72, fontSize: 36, borderWidth: 5 }}>
                      {left}
                    </div>
                  </div>
                  <div className="my-3 flex flex-col gap-3">
                    {v.recess.pick.map((label, idx) => {
                      const total = (v.recess?.votes[0] ?? 0) + (v.recess?.votes[1] ?? 0) || 1;
                      const pct = Math.round(((v.recess?.votes[idx] ?? 0) / total) * 100);
                      return (
                        <div key={label} className="gon-vote-bar">
                          <div className="gon-vote-fill" style={{ width: `${pct}%` }} />
                          <span className="relative z-10">
                            Gõ <b>{idx + 1}</b>: {label}
                          </span>
                          <span className="relative z-10 font-black">{v.recess?.votes[idx] ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : v.recess?.game === 'dance' || v.recess?.game === 'heart' ? (
                <div className="gon-blackboard gon-recess-board">
                  <div className="gon-recess-title">
                    {v.recess.game === 'dance' ? '💃 NHẢY MÚA THẢ TIM' : '❤️ THẢ TIM TIẾP SỨC'}
                  </div>
                  <div className="text-[52px] font-black text-[#f43f5e] drop-shadow">
                    ❤️ {v.recess.hearts || 300} tim!
                  </div>
                  {v.recess.topLiker && (
                    <div className="text-[24px] font-bold text-[#fde047]">
                      👑 Thả tim nhiều nhất: {v.recess.topLiker.nickname} ({v.recess.topLiker.n})
                    </div>
                  )}
                </div>
              ) : (
                <div className="gon-blackboard gon-recess-board">
                  <div className="gon-recess-title">RA CHƠI</div>
                  <div className="gon-recess-clock">
                    {Math.floor(left / 60).toString().padStart(2, '0')}:{(left % 60).toString().padStart(2, '0') || '02:00'}
                  </div>
                  <div className="gon-recess-sub">
                    Tiết {(v.round || 1) + 1} bắt đầu khi hết giờ
                  </div>
                </div>
              )}

              {/* Thẻ XẾP HẠNG TIẾT */}
              <div className="gon-info-card">
                <span className="gon-card-heading">XẾP HẠNG TIẾT {v.round || 1}</span>
                <div className="flex flex-col gap-1.5">
                  {(v.seats.filter((s) => s.score > 0).slice(0, 3).length > 0
                    ? v.seats.filter((s) => s.score > 0).slice(0, 3).map((s, idx) => ({
                        rank: idx + 1,
                        name: s.nickname,
                        score: s.score,
                        color: CIRCLE_COLORS[idx % CIRCLE_COLORS.length],
                      }))
                    : [
                        { rank: 1, name: 'Bé Na', score: 30, color: '#06b6d4' },
                        { rank: 2, name: 'Lan Anh', score: 12, color: '#ec4899' },
                        { rank: 3, name: 'Khoa', score: 9, color: '#f97316' },
                      ]
                  ).map((row) => (
                    <div key={row.rank} className="gon-rank-row">
                      <span className="gon-rank-num">{row.rank}</span>
                      <div className="gon-rank-avatar" style={{ background: row.color }}>
                        {getInitialLetter(row.name)}
                      </div>
                      <span className="gon-rank-name">{row.name}</span>
                      <span className="gon-rank-score">{row.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thẻ THI ĐUA TỔ */}
              <div className="gon-info-card">
                <span className="gon-card-heading">THI ĐUA TỔ</span>
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((tNo) => {
                    const team = v.teams.find((t) => t.no === tNo);
                    const score = team?.score ?? [41, 30, 21, 11][tNo - 1];
                    const colors = ['#f43f5e', '#06b6d4', '#4ade80', '#facc15'];
                    return (
                      <div key={tNo} className="gon-team-item">
                        <span className="gon-team-name">Tổ {tNo}</span>
                        <div className="gon-team-track">
                          <div
                            className="gon-team-fill"
                            style={{ background: colors[tNo - 1], width: `${Math.min(100, Math.max(14, score * 2.2))}%` }}
                          />
                        </div>
                        <span className="gon-team-pts">{score}đ</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thanh giáo viên */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Cả lớp giải lao nhé'}
                  </div>
                  <div className="gon-teacher-line2">
                    Cô chấm điểm, lát vào tiết {(v.round || 1) + 1}
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.roster.seated || 18} bạn</span>
              </div>
            </>
          )}

          {/* ========================================================
              UI 3: LỚP TRƯỞNG (Neon - Lớp trưởng)
             ======================================================== */}
          {isMonitor && !isShow && !isTeam && !isVote && !isReveal && !isRecess && (
            <>
              <div className="gon-blackboard gon-monitor-board">
                <div className="gon-crown-wrap">
                  <span className="gon-crown-icon">👑</span>
                  <div className="gon-monitor-avatar">
                    {getInitialLetter(top1Student.nickname)}
                  </div>
                </div>
                <div className="gon-monitor-name">{top1Student.nickname}</div>
                <div className="gon-monitor-pill">
                  Lớp trưởng Tiết {v.round || 1} · {top1Student.score || 30} điểm
                </div>
              </div>

              <div className="gon-info-card">
                <span className="gon-card-heading">XẾP HẠNG TIẾT {v.round || 1}</span>
                <div className="flex flex-col gap-1.5">
                  {[
                    { rank: 2, name: 'Lan Anh', score: 12, color: '#10b981' },
                    { rank: 3, name: 'Khoa', score: 9, color: '#06b6d4' },
                    { rank: 4, name: 'Thu Hà', score: 7, color: '#f43f5e' },
                    { rank: 5, name: 'Đức', score: 4, color: '#3b82f6' },
                  ].map((row) => (
                    <div key={row.rank} className="gon-rank-row">
                      <span className="gon-rank-num">{row.rank}</span>
                      <div className="gon-rank-avatar" style={{ background: row.color }}>
                        {getInitialLetter(row.name)}
                      </div>
                      <span className="gon-rank-name">{row.name}</span>
                      <span className="gon-rank-score">{row.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-info-card">
                <span className="gon-card-heading">BẢNG VÀNG TUẦN</span>
                <div className="gon-week-grid">
                  {(v.weekTop.length >= 3
                    ? v.weekTop.slice(0, 3).map((w, idx) => ({
                        rank: `Hạng ${idx + 1}`,
                        name: w.nickname,
                        pts: w.points,
                      }))
                    : [
                        { rank: 'Hạng 1', name: 'Anh Tuấn', pts: 146 },
                        { rank: 'Hạng 2', name: 'Minh Châu', pts: 79 },
                        { rank: 'Hạng 3', name: 'Bé Na', pts: 53 },
                      ]
                  ).map((w, idx) => (
                    <div key={idx} className="gon-week-box">
                      <span className="gon-week-rank">{w.rank}</span>
                      <span className="gon-week-name">{w.name}</span>
                      <span className="gon-week-pts">{w.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Chúc mừng lớp trưởng'}
                  </div>
                  <div className="gon-teacher-line2">
                    Cả lớp vỗ tay cho {top1Student.nickname} nào
                  </div>
                </div>
                <span className="gon-teacher-badge">Hết tiết</span>
              </div>
            </>
          )}

          {/* ========================================================
              UI 4: ĐẦY LỚP (Neon - Đầy lớp 20/20)
             ======================================================== */}
          {isFullClass && !isShow && !isTeam && !isVote && !isReveal && !isRecess && !isMonitor && (
            <>
              <div className="gon-info-card">
                <div className="flex items-center justify-between">
                  <span className="gon-card-heading">LỚP ĐÃ ĐỦ CHỖ</span>
                  <span className="gon-pill" style={{ background: '#ec4899', color: '#fff', fontSize: 20, padding: '4px 16px', border: 'none' }}>
                    20/20
                  </span>
                </div>
                <div className="gon-full-circles-grid">
                  {'ABCDEFGHIJKLMNOPQRST'.split('').map((ch, idx) => (
                    <div
                      key={idx}
                      className="gon-circle-seat"
                      style={{ background: CIRCLE_COLORS[idx % CIRCLE_COLORS.length] }}
                    >
                      {ch}
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-info-card gon-outside-card">
                <div className="flex flex-col gap-1">
                  <span className="gon-card-heading">ĐỨNG NGOÀI CỬA</span>
                  <span className="gon-outside-text">
                    Vào sau thì đứng ngoài, vẫn chơi bình thường
                  </span>
                </div>
                <div className="gon-outside-queue">
                  {['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'].map((ch, idx) => (
                    <div
                      key={idx}
                      className="gon-mini-circle"
                      style={{ background: CIRCLE_COLORS[(idx + 4) % CIRCLE_COLORS.length] }}
                    >
                      {ch}
                    </div>
                  ))}
                  <span className="gon-pts-pill" style={{ fontSize: 18, padding: '4px 12px' }}>
                    +{v.roster.waiting || 12} bạn
                  </span>
                </div>
              </div>

              <div className="gon-blackboard" style={{ padding: '20px 32px' }}>
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">{v.category || 'Công sở: tiền bạc'}</span>
                  <div className="gon-timer-circle" style={{ width: 72, height: 72, fontSize: 36, borderWidth: 5 }}>
                    {left || 10}s
                  </div>
                </div>
                <div className="gon-tiles-row" style={{ minHeight: 84 }}>
                  {(v.tiles.length > 0 ? v.tiles : ['T', 'A', 'Ú', 'H', 'I', 'H']).map((ch, i) => (
                    <div key={`full-tile-${i}`} className="gon-tile-card">
                      {ch}
                    </div>
                  ))}
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Lớp đông quá rồi'}
                  </div>
                  <div className="gon-teacher-line2">
                    Tặng hoa cô để giữ chỗ nhé
                  </div>
                </div>
                <span className="gon-teacher-badge">20 bạn</span>
              </div>
            </>
          )}

          {/* ========================================================
              TRẠNG THÁI MẶC ĐỊNH (Đang hỏi bài bình thường)
             ======================================================== */}
          {!isShow && !isTeam && !isVote && !isReveal && !isRecess && !isMonitor && !isFullClass && (
            <>
              {/* 3. BẢNG CHỮ: Khối lớn nhất */}
              <div className="gon-blackboard">
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">
                    {v.golden ? '⭐ CÂU HỎI VÀNG x2' : v.category || 'Công sở: tiền bạc'}
                  </span>
                  <div className="gon-timer-circle">{left || 10}</div>
                </div>

                <div className="gon-clue-box">
                  {v.slot === 'dh' ? (
                    <span className="text-[64px]">{v.clue}</span>
                  ) : v.math ? (
                    <span className="text-[54px] font-black text-[#facc15]">{v.math}</span>
                  ) : !v.boardShown ? (
                    <div className="text-center">
                      <div style={{ fontSize: 44, fontWeight: 800, color: 'var(--g-gold)' }}>Câu {v.qNo || 1}</div>
                      <div style={{ fontSize: 28, marginTop: 6, opacity: 0.9 }}>👂 Nghe {teacherName.toLowerCase()} đọc đề nè...</div>
                    </div>
                  ) : (
                    <span>{v.clue || 'Ngày trong tuần ai cũng muốn xoá khỏi lịch, cô Ngân sợ nhất.'}</span>
                  )}
                </div>

                <div className="gon-tiles-row">
                  {(v.boardShown && v.tiles.length > 0 ? v.tiles : ['T', 'A', 'Ú', 'H', 'I', 'H']).map((ch, i) => (
                    <div key={`tile-${i}`} className="gon-tile-card">
                      {ch}
                    </div>
                  ))}
                </div>

                <div className="gon-slots-row">
                  {(v.boardShown && v.slots.length > 0 ? v.slots : ['T', null, null, ' ', null, null, null]).map((slot, i) =>
                    slot === ' ' ? (
                      <div key={`space-${i}`} className="gon-slot-space" />
                    ) : (
                      <div key={`slot-${i}`} className="gon-slot-box">
                        {slot || ''}
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* 4. THANH CÔ/THẦY GIÁO */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={76} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName || 'Thầy Minh'}</span>
                    {giftInfo ? (
                      <span style={{ color: 'var(--g-gold)', fontWeight: 800 }}>
                        {` · Cảm ơn ${giftInfo.nickname} đã gửi tặng ${giftInfo.isBig ? 'món quà to' : 'hoa'}! 💕`}
                      </span>
                    ) : (
                      <>
                        {' · Gõ đáp án vào bình luận, nhanh nhất '}
                        <span className="gon-teacher-plus">+10 điểm</span>
                      </>
                    )}
                  </div>
                  <div className="gon-teacher-line2">
                    {giftInfo ? (
                      <span className="font-bold">
                        {giftInfo.isBig
                          ? '🎆 Món quà to tuyệt vời! Cả lớp cùng vỗ tay cảm ơn bạn nhé 🎉'
                          : '💐 Hoa tươi đẹp quá, thầy cảm ơn con nhiều 💕'}
                      </span>
                    ) : v.correctTop[0] ? (
                      <span>
                        Nhanh nhất: <b>{v.correctTop[0].nickname}</b> ⚡
                      </span>
                    ) : (
                      'Nhanh nhất: chưa ai đoán ra...'
                    )}
                  </div>
                </div>
                <span className="gon-teacher-badge">
                  {giftInfo ? `${giftInfo.icon} Quà tặng` : `${v.correctCount || 0} bạn đã đúng`}
                </span>
              </div>

              {/* 5. HAI THẺ CẠNH NHAU (Thi đua tổ & Top tương tác) */}
              <div className="gon-two-cards-row">
                <div className="gon-info-card">
                  <span className="gon-card-heading">THI ĐUA TỔ</span>
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3, 4].map((tNo) => {
                      const team = v.teams.find((t) => t.no === tNo);
                      const score = team?.score ?? 0;
                      const colors = ['var(--g-team1)', 'var(--g-team2)', 'var(--g-team3)', 'var(--g-team4)'];
                      return (
                        <div key={tNo} className="gon-team-item">
                          <span className="gon-team-name">Tổ {tNo}</span>
                          <div className="gon-team-track">
                            <div
                              className="gon-team-fill"
                              style={{
                                background: colors[tNo - 1],
                                width: score > 0 ? `${Math.min(100, Math.max(12, score * 3))}%` : '16px',
                              }}
                            />
                          </div>
                          <span className="gon-team-pts">{score}đ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="gon-info-card">
                  <span className="gon-card-heading">TOP TƯƠNG TÁC</span>
                  <div className="flex flex-col gap-1.5">
                    {v.talkTop && v.talkTop.length > 0 ? (
                      v.talkTop.slice(0, 2).map((item) => (
                        <div key={item.username} className="gon-interact-item">
                          <span>{item.nickname}</span>
                          <span>{item.points}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="gon-interact-item">
                          <span>Bé Na</span>
                          <span>30</span>
                        </div>
                        <div className="gon-interact-item">
                          <span>Lan Anh</span>
                          <span>1</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="gon-interact-note">
                    Xuất sắc hôm nay: chưa có ai. Trả lời đúng là lên bảng!
                  </div>
                </div>
              </div>

              {/* 6. THẺ LỚP HỌC (20 BÀN - KÍCH THƯỚC TO RÕ) */}
              <div className="gon-class-card">
                <div className="gon-class-card-top">
                  <span className="gon-class-card-title">LỚP HỌC · {Math.min(20, v.seats.length)}/20</span>
                  <span className="gon-class-card-hint">
                    Gửi tặng {teacherName.toLowerCase()}: hoa · tim · bánh
                  </span>
                </div>
                <div className="gon-desks-grid">
                  {Array.from({ length: 20 }, (_, i) => {
                    const s = v.seats[i];
                    const isGifter = Boolean(s && giftInfo && s.nickname === giftInfo.nickname);
                    return (
                      <div
                        key={i}
                        className="gon-desk-cell relative"
                        style={
                          isGifter
                            ? {
                                borderColor: 'var(--g-gold)',
                                boxShadow: '0 0 20px rgba(245, 158, 11, 0.95)',
                                background: 'rgba(245, 158, 11, 0.2)',
                                transform: 'scale(1.06)',
                                transition: 'all 0.3s ease',
                              }
                            : undefined
                        }
                      >
                        {s && (
                          <>
                            <div
                              className="gon-seat-avatar"
                              style={{ background: getColorForName(s.nickname) }}
                            >
                              {getInitialLetter(s.nickname)}
                            </div>
                            <span
                              className="gon-seat-name"
                              style={{ color: 'var(--g-text-main)' }}
                            >
                              {s.nickname}
                            </span>
                            {isGifter && (
                              <span className="absolute -top-3 -right-3 text-[22px] animate-bounce">
                                {giftInfo?.icon ?? '🌹'}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── VÙNG TIKTOK DƯỚI (chừa 256px) ───────────────────────── */}
        <div className="gon-bottom-space">
          <div className="gon-guide-bar">
            Vùng TikTok: khung chat, nút quà (không đặt nội dung)
          </div>
        </div>
      </div>
    </div>
  );
}
