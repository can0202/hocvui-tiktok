import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { GameState, StageView } from '../../game/useGame';
import { shownTeacherName } from '../../game/config';
import { giftOf, tierOf, type RecessGame } from '../../game/quiz';
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

function GonClassCard({
  v,
  teacherName,
  giftInfo,
  hint,
  fallbackSeats,
}: {
  v: StageView;
  teacherName: string;
  giftInfo?: { nickname: string; giftName: string; icon: string; isBig: boolean } | null;
  hint?: string;
  fallbackSeats?: { nickname: string; score?: number; showIcons?: string }[];
}) {
  const seatsList = v.seats.length > 0 ? v.seats : (fallbackSeats || []);
  const seatedCount = v.seats.length > 0 ? v.seats.length : (fallbackSeats?.length || 0);

  return (
    <div className="gon-class-card">
      <div className="gon-class-card-top">
        <span className="gon-class-card-title">
          LỚP HỌC · {Math.min(24, seatedCount)}/24
        </span>
        <span className="gon-class-card-hint">
          {hint || `Gửi tặng ${teacherName.toLowerCase()}: hoa · tim · bánh`}
        </span>
      </div>
      <div className="gon-desks-grid">
        {Array.from({ length: 24 }, (_, i) => {
          const s = seatsList[i];
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
                  : s
                    ? { borderStyle: 'solid', borderColor: getColorForName(s.nickname) }
                    : undefined
              }
            >
              {s && (
                <>
                  <div
                    className="gon-seat-avatar relative"
                    style={{ background: getColorForName(s.nickname) }}
                  >
                    {getInitialLetter(s.nickname)}
                    {'title' in s && s.title === 'lop-truong' ? (
                      <span className="absolute -top-2 -right-1 text-[16px] leading-none">👑</span>
                    ) : null}
                    {'sleeping' in s && Boolean(s.sleeping) ? (
                      <span className="absolute -top-2 -left-1 text-[16px] leading-none">💤</span>
                    ) : null}
                  </div>
                  <span className="gon-seat-name" style={{ color: 'var(--g-text-main)' }}>
                    {'team' in s && typeof s.team === 'number' && s.team > 0 ? (
                      <span
                        className="mr-1 inline-block rounded-full px-1.5 py-0.2 text-[12px] font-black text-white"
                        style={{
                          background:
                            s.team === 1 ? '#f43f5e' : s.team === 2 ? '#06b6d4' : s.team === 3 ? '#4ade80' : '#facc15',
                        }}
                      >
                        {s.team}
                      </span>
                    ) : null}
                    {'showIcons' in s && s.showIcons ? <span className="mr-0.5">{String(s.showIcons)}</span> : null}
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
  );
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

  // Ép trạng thái xem thử qua ?state=reveal|recess|monitor|full|everest|chuong|flower|gift|intro (nếu có trên URL)
  const urlState = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('state')
    : null;

  // Xác định chính xác phase hiện tại của game (không bị đè trạng thái)
  const isPreviewEverest = urlState === 'everest';
  const isPreviewChuong = urlState === 'chuong';
  const isPreviewFlower = urlState === 'flower';
  const isPreviewGift = urlState === 'gift';
  const isPreviewRps = urlState === 'rps' || urlState === 'oan-tu-ti';
  const isPreviewCallup = urlState === 'callup' || urlState === 'kiem-tra-mieng';
  const isPreviewPick = urlState === 'pick' || urlState === 'chon-phe';
  const isPreviewRoll = urlState === 'roll' || urlState === 'diem-danh';
  const isPreviewHeart = urlState === 'heart' || urlState === 'tha-tim';
  const isPreviewDance = urlState === 'dance' || urlState === 'nhay-mua';
  const isPreviewRecessAny = urlState === 'recess' || isPreviewRps || isPreviewCallup || isPreviewPick || isPreviewRoll || isPreviewHeart || isPreviewDance;

  const isShow = isPreviewEverest || isPreviewChuong || (v.phase === 'show' && Boolean(v.show));
  const isTeam = !isShow && v.phase === 'team';
  const isVote = !isShow && v.phase === 'vote' && Boolean(v.vote);
  const isIntro = urlState === 'intro' || (!isShow && !isTeam && !isVote && v.phase === 'intro');
  const isReveal = urlState === 'reveal' || (!isShow && !isTeam && !isVote && !isIntro && v.phase === 'reveal');
  const isRecess = isPreviewRecessAny || (!isShow && !isTeam && !isVote && !isIntro && !isReveal && v.phase === 'recess');
  const isMonitor = urlState === 'monitor' || (!isShow && !isTeam && !isVote && !isIntro && (v.phase === 'results' || v.phase === 'praise'));
  const isFullClass = urlState === 'full' || (!isShow && !isTeam && !isVote && !isIntro && !isReveal && !isRecess && !isMonitor && v.phase === 'question' && (v.seats.length >= 24 || v.roster.seated >= 24));
  const isQuestion = !isShow && !isTeam && !isVote && !isIntro && !isReveal && !isRecess && !isMonitor && !isFullClass;

  const activeRecess = v.recess || (isPreviewRecessAny ? {
    game: (
      isPreviewRps ? 'rps' :
        isPreviewCallup ? 'callup' :
          isPreviewPick ? 'pick' :
            isPreviewRoll ? 'roll' :
              isPreviewHeart ? 'heart' :
                isPreviewDance ? 'dance' :
                  'roll'
    ) as RecessGame,
    stage: 'play' as const,
    rpsCounts: [12, 8, 15],
    teacher: 'búa' as const,
    callName: 'Bé Na',
    callClue: 'Ngày đầu tuần ai cũng muốn xoá khỏi lịch, cô Ngân sợ nhất',
    callTiles: ['T', 'H', 'Ứ', 'H', 'A', 'I'],
    callSlots: ['T', '', '', ' ', '', ''],
    callResult: 'right' as const,
    pick: ['Đi ăn kem 🍦', 'Đi trà sữa 🧋'],
    votes: [18, 14],
    roll: ['Bé Na', 'Lan Anh', 'Khoa', 'Thu Hà', 'Minh Tuấn'],
    hearts: 1250,
    heartTarget: 2000,
    topLiker: { nickname: 'Bé Na', n: 320 },
  } : null);

  const headerSub =
    isShow
      ? (v.show?.kind === 'everest' ? '🏔️ Everest' : '🔔 Chuông Đồng')
      : isTeam
        ? 'Chọn tổ'
        : isVote
          ? 'Chọn chủ đề'
          : isRecess
            ? 'Ra chơi'
            : isMonitor
              ? (v.phase === 'praise' ? 'Khen thưởng' : 'Xong tiết')
              : isIntro
                ? (v.review ? 'Ôn bài' : 'Sắp vào học')
                : (v.phase === 'bonus' ? 'Thưởng +10s' : `${v.review ? 'Ôn bài' : 'Câu'} ${v.qNo || 1}/${v.total || 20}`);

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

  const displayedSeats = v.seats.length > 0
    ? v.seats
    : (isPreviewEverest || isPreviewChuong)
      ? [
        { nickname: 'Bé Na', score: 40, showIcons: isPreviewChuong ? '🔔' : '🏔️' },
        { nickname: 'Minh Tuấn', score: 30, showIcons: isPreviewChuong ? '🔔' : '🏔️' },
        { nickname: 'Lan Anh', score: 20, showIcons: isPreviewChuong ? '🔔' : '🏔️' },
        { nickname: 'Khoa', score: 15, showIcons: isPreviewChuong ? '🔔' : '🏔️' },
        { nickname: 'Thu Hà', score: 10 },
        { nickname: 'Đức', score: 5 },
        { nickname: 'Bảo Anh', score: 3 },
        { nickname: 'Gia Huy', score: 1 },
      ]
      : [];

  const fastestList = v.fastest && v.fastest.length > 0
    ? v.fastest
    : v.correctTop.length > 0
      ? v.correctTop.slice(0, 5).map((c, i) => ({ nickname: c.nickname, points: c.points || [10, 7, 5, 3, 1][i] || 1, ms: 1200 + i * 350 }))
      : urlState === 'reveal'
        ? sampleCorrect.map((s, i) => ({ nickname: s.nickname, points: s.pts, ms: 1200 + i * 400 }))
        : [];

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
            className={`rounded-[32px] border-4 border-white p-7 text-center text-white shadow-2xl ${giftInfo.isBig
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

      {/* ─── KHUNG NỘI DUNG CHÍNH ───────────────────────────────────── */}
      <div className="gon-safe-area">
        {/* ─── VÙNG NỘI DUNG CHÍNH ─────────────────────────────────── */}
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
                {headerSub}
              </span>
              <span className="gon-pill">
                {isFullClass ? '24/24' : `${Math.min(24, v.seats.length || v.roster.seated || 0)}/24`}
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
                  <GonTeacher size={82} hasFlower={hasFlower} />
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

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard
                v={v}
                teacherName={teacherName}
                giftInfo={giftInfo}
                hint={`${activeShow.name} · ${activeShow.players || v.roster.seated} bạn tham gia`}
                fallbackSeats={displayedSeats}
              />
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
                  <GonTeacher size={82} hasFlower={hasFlower} />
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

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard
                v={v}
                teacherName={teacherName}
                giftInfo={giftInfo}
                hint={`Chọn tổ thi đua · ${v.roster.seated} bạn trong lớp`}
              />
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
                  <GonTeacher size={82} hasFlower={hasFlower} />
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

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard
                v={v}
                teacherName={teacherName}
                giftInfo={giftInfo}
                hint={`Bầu chọn chủ đề · ${v.roster.seated} bạn trong lớp`}
              />
            </>
          )}

          {/* ========================================================
              UI INTRO: SẮP VÀO HỌC / BẢNG VÀNG TUẦN (phase === 'intro')
             ======================================================== */}
          {isIntro && !isShow && !isTeam && !isVote && (
            <>
              {/* BẢNG ĐEN: Sắp vào học / Bảng vàng tuần */}
              <div className="gon-blackboard" style={{ padding: '28px 32px' }}>
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">
                    {v.round % 2 === 0 && v.weekTop.length > 0
                      ? '🏆 BẢNG VÀNG TUẦN'
                      : v.topic
                        ? `🗳️ ${v.topic}`
                        : '🔔 CHUẨN BỊ VÀO TIẾT'}
                  </span>
                  <div className="gon-timer-circle">{left || 5}s</div>
                </div>

                {v.round % 2 === 0 && v.weekTop.length > 0 ? (
                  <div className="flex flex-col items-center my-auto py-2">
                    <div className="text-[44px] font-extrabold text-[#facc15]">Bảng vàng tuần này</div>
                    <div className="mt-3 w-full space-y-2">
                      {v.weekTop.slice(0, 5).map((s, i) => (
                        <div key={s.username} className="flex items-center gap-3 px-4 text-[26px]">
                          <span className="w-10 text-[28px] font-black text-[#facc15]">{['🥇', '🥈', '🥉', '4', '5'][i]}</span>
                          <span className="flex-1 truncate font-bold text-white">{s.nickname}</span>
                          <span className="font-extrabold text-[#38bdf8]">{s.points}đ</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-[24px] opacity-80">Vào tiết sau {left} giây</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center my-auto py-3">
                    <div className="text-[52px] font-black leading-none text-[#fbbf24] tracking-wide">
                      Sắp vào học!
                    </div>
                    <div className="mt-4 space-y-1 text-[28px] font-bold text-white/95 leading-snug">
                      <div>Cô xáo chữ, cả lớp đoán từ.</div>
                      <div>
                        Gõ đáp án vào <b className="text-[#fbbf24]">bình luận</b>
                      </div>
                      <div>
                        Nhanh nhất <b className="text-[#fbbf24]">+10 điểm</b>
                      </div>
                    </div>
                    {v.topic && (
                      <div className="mt-3 text-[26px] font-bold text-[#38bdf8]">
                        🗳️ Cả lớp chọn: {v.topic}
                      </div>
                    )}
                    {v.review && (
                      <div className="mt-3 text-[26px] font-bold text-[#fbbf24]">
                        📖 Giờ ôn bài · gõ "vào lớp" để học bài mới
                      </div>
                    )}
                    <div className="mt-4 text-[26px] font-semibold text-white/80">
                      Bắt đầu sau {left} giây
                    </div>
                  </div>
                )}
              </div>

              {/* THẺ GIÁO VIÊN */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={82} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {' · Chuẩn bị vào tiết mới nha cả lớp!'}
                  </div>
                  <div className="gon-teacher-line2">
                    {v.review
                      ? 'Gõ "vào lớp" để tham gia bài mới cùng cô nhé'
                      : 'Các bạn nhanh chóng vào chỗ ngồi, nghe cô xáo chữ nha'}
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.roster.seated} bạn</span>
              </div>

              {/* HAI THẺ THI ĐUA TỔ & TOP TƯƠNG TÁC */}
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
                      <div className="gon-interact-note">
                        Bình luận nhiệt tình để lên bảng tương tác nha!
                      </div>
                    )}
                  </div>
                  <div className="gon-interact-note">
                    Xuất sắc hôm nay: chưa có ai. Trả lời đúng là lên bảng!
                  </div>
                </div>
              </div>

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard v={v} teacherName={teacherName} giftInfo={giftInfo} />
            </>
          )}

          {/* ========================================================
              UI 1: HIỆN ĐÁP ÁN (Neon - Hiện đáp án)
             ======================================================== */}
          {isReveal && !isShow && !isTeam && !isVote && !isIntro && (
            <>
              <div className="gon-blackboard">
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">
                    {v.golden ? '⭐ CÂU HỎI VÀNG' : v.category || 'ĐÁP ÁN'}
                  </span>
                  <span className="gon-pill active" style={{ padding: '6px 20px', fontSize: 22 }}>
                    Hết giờ
                  </span>
                </div>
                <div className="gon-reveal-ans-tag">ĐÁP ÁN</div>
                <div className="flex flex-wrap items-center justify-center gap-4 my-2">
                  {(v.answer || 'THỨ HAI').split(' ').map((word, wi) => (
                    <div key={wi} className="flex gap-2">
                      {word.split('').map((ch, ci) => (
                        <div key={ci} className="gon-tile-card">
                          {ch}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="gon-reveal-count-pill">
                  {v.correctCount} người đoán đúng!
                </div>
              </div>

              <div className="gon-info-card">
                <div className="flex items-center justify-between">
                  <span className="gon-card-heading">⚡ TOP {fastestList.length > 0 ? fastestList.length : 5} NHANH NHẤT</span>
                  <span className="text-[20px] font-bold text-white/80">{v.correctCount} bạn đúng</span>
                </div>
                {fastestList.length === 0 ? (
                  <div className="py-4 text-center text-[24px] font-medium opacity-75">
                    Chưa ai đúng câu này
                  </div>
                ) : (
                  <div className="gon-fastest-row">
                    {fastestList.map((item, idx) => (
                      <div key={idx} className="gon-fastest-col">
                        <div className="gon-initial-circle" style={{ background: getColorForName(item.nickname) }}>
                          {getInitialLetter(item.nickname)}
                        </div>
                        <span className="gon-fastest-name">{item.nickname}</span>
                        <span className="text-[17px] opacity-75">⏱ {((item.ms || 0) / 1000).toFixed(1)}s</span>
                        <span className="gon-pts-pill">+{item.points ?? (item as any).pts ?? 10}</span>
                      </div>
                    ))}
                  </div>
                )}
                {v.laterCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-center text-[19px] font-bold text-white/70">
                    +{v.laterCount} bạn khác đúng chậm hơn: mỗi bạn +{v.laterPoints}đ
                  </div>
                )}
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={82} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {v.correctCount > 0 ? ' · Đúng rồi cả lớp!' : ' · Hết giờ rồi cả lớp ơi!'}
                  </div>
                  <div className="gon-teacher-line2">
                    {fastestList[0]
                      ? `Đáp án: ${v.answer || 'Thứ Hai'}, vỗ tay cho ${fastestList[0].nickname} nào 👏`
                      : `Đáp án là: "${v.answer || ''}", câu sau cố lên nhé!`}
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.correctCount} bạn đúng</span>
              </div>

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard v={v} teacherName={teacherName} giftInfo={giftInfo} />
            </>
          )}

          {/* ========================================================
              UI 2: RA CHƠI (Neon - Ra chơi & các trò chơi ra chơi)
             ======================================================== */}
          {isRecess && !isShow && !isTeam && !isVote && !isIntro && !isReveal && (
            <>
              {/* Overlay nhảy múa thả tim (dance) */}
              {activeRecess?.game === 'dance' && activeRecess?.stage === 'play' && (
                <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
                  <motion.div
                    initial={{ y: -60 }}
                    animate={{ y: 0, scale: [1, 1.04, 1] }}
                    transition={{ scale: { duration: 0.9, repeat: Infinity } }}
                    className="absolute left-[80px] top-[140px] w-[920px] rounded-[30px] border-4 border-white bg-gradient-to-r from-fuchsia-500 via-pink-500 to-amber-400 px-6 py-3 text-center font-extrabold text-white shadow-2xl"
                  >
                    <div className="text-[40px] leading-tight">💃 GIỜ RA CHƠI · CẢ LỚP LÊN NHẢY 🕺</div>
                    <div className="line-clamp-2 text-[26px] leading-tight text-white/95">
                      {v.cfg.danceText || 'Nhạc lên rồi quẩy thôi cả lớp ơi!'}
                    </div>
                  </motion.div>
                  {Array.from({ length: 12 }, (_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 1500, opacity: 0 }}
                      animate={{ y: 600, opacity: [0, 1, 0] }}
                      transition={{ duration: 2.6, delay: (i % 6) * 0.35, repeat: Infinity }}
                      className="absolute text-[60px]"
                      style={{ left: 30 + i * 88 }}
                    >
                      {i % 3 === 0 ? '💖' : '❤️'}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 1. BẢNG VÀNG LỚP TRƯỞNG CÁC TIẾT */}
              {activeRecess?.stage === 'board' ? (
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">👑 LỚP TRƯỞNG CÁC TIẾT</span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  {v.champions.length === 0 ? (
                    <div className="my-auto text-center py-6">
                      <div className="text-[48px]">🎖️</div>
                      <div className="mt-2 text-[32px] font-bold text-white">Chưa có lớp trưởng</div>
                      <div className="mt-1 text-[24px] opacity-80">Ai điểm cao nhất tiết sẽ lên bảng vinh danh!</div>
                    </div>
                  ) : (
                    <div className="my-auto space-y-2 py-2">
                      {v.champions.map((c) => (
                        <div key={c.round} className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2">
                          <span className="rounded-full bg-amber-400/20 px-3 py-0.5 text-[22px] font-black text-[#fbbf24]">
                            Tiết {c.round}
                          </span>
                          <span className="flex-1 truncate text-[30px] font-bold text-white">{c.nickname}</span>
                          {c.times > 1 && (
                            <span className="text-[20px] font-black text-[#fbbf24]">👑x{c.times}</span>
                          )}
                          <span className="text-[30px] font-black text-[#38bdf8]">{c.score}đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto text-center text-[24px] font-medium opacity-85">
                    Tiết mới điểm làm lại, ai cũng có thể làm lớp trưởng!
                  </div>
                </div>
              ) : activeRecess?.game === 'callup' ? (
                /* 2. 📢 KIỂM TRA MIỆNG */
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">📢 KIỂM TRA MIỆNG</span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  <div className="mt-1 text-center text-[38px] font-black text-[#fbbf24]">
                    📢 {activeRecess.callName || 'Học sinh'} lên bảng!
                  </div>
                  <div className="gon-clue-box">{activeRecess.callClue || 'Lắng nghe cô đọc gợi ý câu hỏi...'}</div>
                  {activeRecess.callTiles && activeRecess.callTiles.length > 0 && (
                    <div className="gon-tiles-row">
                      {activeRecess.callTiles.map((ch, i) => (
                        <div key={`ctile-${i}`} className="gon-tile-card">
                          {ch}
                        </div>
                      ))}
                    </div>
                  )}
                  {activeRecess.callSlots && activeRecess.callSlots.length > 0 && (
                    <div className="gon-slots-row">
                      {activeRecess.callSlots.map((slot, i) =>
                        slot === ' ' ? (
                          <div key={`cspace-${i}`} className="gon-slot-space" />
                        ) : (
                          <div key={`cslot-${i}`} className={`gon-slot-box ${slot ? 'has-char' : ''}`}>
                            {slot || ''}
                          </div>
                        )
                      )}
                    </div>
                  )}
                  {activeRecess.stage !== 'play' && (
                    <div className={`text-center text-[30px] font-bold mt-2 ${activeRecess.callResult === 'right' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {activeRecess.callResult === 'right' ? '✅ Đúng! +5 điểm' : activeRecess.callResult === 'wrong' ? '❌ Sai mất rồi' : '💤 Không trả lời'}
                    </div>
                  )}
                </div>
              ) : activeRecess?.game === 'roll' ? (
                /* 3. 🙋 ĐIỂM DANH SIÊU TỐC (10 Ô ĐẦY ĐỦ) */
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">📋 ĐIỂM DANH SIÊU TỐC</span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  <div className="mt-1 text-center text-[38px] font-black text-[#fbbf24]">
                    Điểm danh đầu tiết
                  </div>
                  <div className="my-1 text-center text-[26px] font-bold text-white">
                    Gõ <b className="text-[#fbbf24]">CÓ MẶT</b> thật nhanh, 10 bạn đầu +3đ
                  </div>
                  <div className="grid grid-cols-2 gap-3 my-2">
                    {Array.from({ length: 10 }, (_, i) => {
                      const name = activeRecess.roll[i];
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 rounded-xl px-4 py-2 border transition-all ${
                            name
                              ? 'border-[#4ade80]/60 bg-[#4ade80]/15 shadow-sm'
                              : 'border-white/20 bg-white/5 border-dashed'
                          }`}
                        >
                          <span className={`w-8 text-[24px] font-black ${name ? 'text-[#fbbf24]' : 'text-white/40'}`}>
                            {i + 1}.
                          </span>
                          {name ? (
                            <>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[16px] shrink-0"
                                style={{ background: getColorForName(name) }}
                              >
                                {getInitialLetter(name)}
                              </div>
                              <span className="flex-1 truncate text-[24px] font-bold text-white">{name}</span>
                              <span className="font-extrabold text-[22px] text-[#4ade80]">+3đ</span>
                            </>
                          ) : (
                            <span className="text-[22px] font-semibold text-white/40 italic">Chờ có mặt...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeRecess?.game === 'rps' ? (
                /* 4. ✊ OẲN TÙ TÌ VỚI CÔ */
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">✊ GIỜ RA CHƠI · OẲN TÙ TÌ</span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  <div className="mt-1 text-center text-[40px] font-black text-[#fbbf24]">
                    Oẳn tù tì với {teacherName.toLowerCase()}
                  </div>
                  <div className="mt-1 text-center text-[28px] font-bold text-white">
                    {activeRecess.stage === 'play' ? (
                      <>Gõ: <b className="text-[#fbbf24]">búa</b>, <b className="text-[#fbbf24]">kéo</b> hoặc <b className="text-[#fbbf24]">bao</b></>
                    ) : activeRecess.teacher ? (
                      <span className="text-[#fde047]">{teacherName} ra: <b className="text-[32px] text-white underline uppercase">{activeRecess.teacher}</b>!</span>
                    ) : (
                      'Không ai tham gia lượt này'
                    )}
                  </div>
                  <div className="my-3 flex justify-center gap-6">
                    {[
                      { icon: '✊', word: 'búa', count: activeRecess.rpsCounts[0] || 0 },
                      { icon: '✌️', word: 'kéo', count: activeRecess.rpsCounts[1] || 0 },
                      { icon: '✋', word: 'bao', count: activeRecess.rpsCounts[2] || 0 },
                    ].map((item) => {
                      const isWinner = activeRecess.stage !== 'play' && activeRecess.teacher === item.word;
                      return (
                        <div
                          key={item.word}
                          className={`flex w-[160px] flex-col items-center rounded-2xl border-4 py-3 transition-all ${isWinner
                              ? 'border-[#facc15] bg-[#facc15]/20 shadow-[0_0_24px_rgba(250,204,21,0.6)] scale-105'
                              : 'border-white/30 bg-white/10'
                            }`}
                        >
                          <span className="text-[64px] leading-none drop-shadow">{item.icon}</span>
                          <span className="mt-1 text-[26px] font-bold text-white uppercase">{item.word}</span>
                          <span className="text-[30px] font-black text-[#4ade80]">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeRecess?.game === 'pick' ? (
                /* 5. ⚖️ CHỌN PHE */
                <div className="gon-blackboard" style={{ padding: '24px 28px' }}>
                  <div className="gon-blackboard-top">
                    <span className="gon-topic-tag">⚖️ GIỜ RA CHƠI · CHỌN PHE</span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  <div className="mt-1 text-center text-[40px] font-black text-[#fbbf24]">
                    Cả lớp cùng chọn phe!
                  </div>
                  <div className="my-1 text-center text-[26px] font-bold text-white/90">
                    Gõ 1 hoặc 2 vào bình luận để bầu chọn
                  </div>
                  <div className="my-3 flex flex-col gap-4">
                    {(activeRecess.pick || ['Phe A', 'Phe B']).map((label, idx) => {
                      const total = (activeRecess.votes?.[0] ?? 0) + (activeRecess.votes?.[1] ?? 0) || 1;
                      const count = activeRecess.votes?.[idx] ?? 0;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={label} className="gon-vote-bar" style={{ height: 76 }}>
                          <div className="gon-vote-fill" style={{ width: `${pct}%` }} />
                          <span className="relative z-10 text-[30px]">
                            Gõ <b>{idx + 1}</b>: {label}
                          </span>
                          <span className="relative z-10 text-[32px] font-black">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeRecess?.game === 'dance' || activeRecess?.game === 'heart' ? (
                /* 6. ❤️ THẢ TIM / 💃 NHẢY MÚA */
                <div className="gon-blackboard gon-recess-board">
                  <div className="gon-blackboard-top w-full">
                    <span className="gon-topic-tag">
                      {activeRecess.game === 'dance' ? '💃 NHẢY MÚA THẢ TIM' : '❤️ THẢ TIM CẢ LỚP'}
                    </span>
                    <div className="gon-timer-circle">{left}</div>
                  </div>
                  <div className="mt-2 text-center text-[44px] font-black text-[#f43f5e]">
                    {activeRecess.game === 'dance' ? 'Cả lớp cùng lên nhảy! 🕺' : 'Chạm màn hình thả tim nào!'}
                  </div>
                  <div className="my-1 text-center text-[26px] font-bold text-white/90">
                    {activeRecess.game === 'dance'
                      ? (v.cfg.danceText || 'Thả tim tiếp sức cho cả lớp nào!')
                      : 'Mỗi lượt tim tiếp thêm động lực cho cô trò'}
                  </div>
                  <div className="flex justify-center my-3">
                    <div className="flex items-center gap-4 rounded-3xl border-4 border-[#f43f5e] bg-[#f43f5e]/20 px-8 py-2 shadow-[0_0_30px_rgba(244,63,94,0.6)]">
                      <motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-[64px] leading-none">
                        ❤️
                      </motion.span>
                      <motion.span key={activeRecess.hearts} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-mono text-[76px] font-extrabold leading-none text-[#ffe4e6] tabular-nums">
                        {(activeRecess.hearts || 0).toLocaleString('vi-VN')}
                      </motion.span>
                      <span className="text-[32px] font-bold text-[#ffe4e6]">tim</span>
                    </div>
                  </div>
                  {activeRecess.topLiker && (
                    <div className="text-center text-[26px] font-bold text-[#fde047]">
                      👑 Thả tim nhiều nhất: <b className="text-white">{activeRecess.topLiker.nickname}</b> · {activeRecess.topLiker.n} tim
                    </div>
                  )}
                  {activeRecess.stage !== 'play' && (
                    <div className="mt-2 text-center text-[28px] font-bold text-[#4ade80]">
                      Cảm ơn cả lớp! 💕
                    </div>
                  )}
                </div>
              ) : (
                /* 7. CLOCK ĐẾM NGƯỢC RA CHƠI */
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

              {/* HAI THẺ CẠNH NHAU: THI ĐUA TỔ & XẾP HẠNG TIẾT */}
              <div className="gon-two-cards-row">
                {/* Thẻ THI ĐUA TỔ */}
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
              </div>

              {/* Thanh giáo viên */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={82} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {activeRecess?.game === 'callup'
                      ? ` · Gọi ${activeRecess.callName || 'học sinh'} lên bảng kiểm tra!`
                      : activeRecess?.game === 'roll'
                        ? ' · Điểm danh thật nhanh nào!'
                        : activeRecess?.game === 'rps'
                          ? ' · Oẳn tù tì cùng cô nhé!'
                          : activeRecess?.game === 'pick'
                            ? ' · Cả lớp cùng chọn phe nha!'
                            : activeRecess?.game === 'dance' || activeRecess?.game === 'heart'
                              ? ' · Thả tim tiếp sức cả lớp nào 💕'
                              : ' · Cả lớp giải lao nhé'}
                  </div>
                  <div className="gon-teacher-line2">
                    {activeRecess?.game === 'callup'
                      ? 'Nhanh tay gõ đáp án vào bình luận để ghi điểm'
                      : activeRecess?.game === 'roll'
                        ? 'Gõ "CÓ MẶT" để nhận ngay +3 điểm'
                        : activeRecess?.game === 'rps'
                          ? 'Đoán xem cô sẽ ra búa, kéo hay bao nha'
                          : activeRecess?.game === 'pick'
                            ? 'Bình chọn theo sở thích của bạn'
                            : activeRecess?.game === 'dance' || activeRecess?.game === 'heart'
                              ? 'Chạm liên tục vào màn hình để thả tim tiếp sức'
                              : `Cô chấm điểm, lát vào tiết ${(v.round || 1) + 1}`}
                  </div>
                </div>
                <span className="gon-teacher-badge">{v.roster.seated || 18} bạn</span>
              </div>

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard
                v={v}
                teacherName={teacherName}
                giftInfo={giftInfo}
                hint={`Giờ giải lao · ${v.roster.seated || 18} bạn trong lớp`}
              />
            </>
          )}

          {/* ========================================================
              UI 3: LỚP TRƯỞNG / KHEN THƯỞNG (phase === 'results' || 'praise')
             ======================================================== */}
          {isMonitor && !isShow && !isTeam && !isVote && !isIntro && !isReveal && !isRecess && (
            <>
              {v.phase === 'praise' ? (
                <div className="gon-blackboard gon-monitor-board">
                  <div className="text-[52px] leading-none font-black text-[#ffe680]">
                    🎁 Cô phát quà nè!
                  </div>
                  <div className="text-[28px] font-bold text-white/90">
                    Bạn nhỏ giỏi nhất sau {v.qNo} câu
                  </div>
                  <div className="w-full space-y-2 mt-3">
                    {v.praiseTop.map((s, i) => (
                      <div key={s.username} className="flex items-center gap-3 px-6 text-[32px] font-bold">
                        <span className="w-12 text-[#ffe680]">{['🥇', '🥈', '🥉'][i]}</span>
                        <span className="flex-1 truncate">{s.nickname}</span>
                        <span className="text-[34px]">{s.desk[s.desk.length - 1]?.icon || '🎁'}</span>
                        <span className="font-black text-[#38bdf8]">{s.score}đ</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto text-[26px] font-bold text-[#ffe680]">
                    Chào cô, thả tim để được quà nha! 💕
                  </div>
                </div>
              ) : (
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
              )}

              <div className="gon-info-card">
                <span className="gon-card-heading">XẾP HẠNG TIẾT {v.round || 1}</span>
                <div className="flex flex-col gap-1.5">
                  {v.seats.filter((s) => s.score > 0).slice(0, 5).map((row, idx) => (
                    <div key={row.username || idx} className="gon-rank-row">
                      <span className="gon-rank-num">{idx + 1}</span>
                      <div className="gon-rank-avatar" style={{ background: getColorForName(row.nickname) }}>
                        {getInitialLetter(row.nickname)}
                      </div>
                      <span className="gon-rank-name">{row.nickname}</span>
                      <span className="gon-rank-score">{row.score}</span>
                    </div>
                  ))}
                  {v.seats.filter((s) => s.score > 0).length === 0 && (
                    <div className="py-2 text-center text-[22px] font-semibold opacity-75">
                      Chưa ai ghi điểm tiết này
                    </div>
                  )}
                </div>
              </div>

              {v.teamWin && v.teamWin.length > 0 && (
                <div className="gon-info-card" style={{ textAlign: 'center', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--g-gold)' }}>
                  <div className="text-[28px] font-black text-[#fbbf24]">
                    🚩 {v.teamWin.map((n) => `Tổ ${n}`).join(' & ')} thắng tiết này!
                  </div>
                </div>
              )}

              <div className="gon-info-card">
                <span className="gon-card-heading">BẢNG VÀNG TUẦN</span>
                <div className="gon-week-grid">
                  {(v.weekTop && v.weekTop.length > 0 ? v.weekTop.slice(0, 3) : []).map((w, idx) => (
                    <div key={w.username || idx} className="gon-week-box">
                      <span className="gon-week-rank">Hạng {idx + 1}</span>
                      <span className="gon-week-name">{w.nickname}</span>
                      <span className="gon-week-pts">{w.points}</span>
                    </div>
                  ))}
                  {(!v.weekTop || v.weekTop.length === 0) && (
                    <div className="col-span-3 text-center py-2 text-[20px] opacity-75">
                      Bình chọn và trả lời để tích lũy điểm tuần nha!
                    </div>
                  )}
                </div>
              </div>

              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={82} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName}</span>
                    {v.phase === 'praise' ? ' · Khen ngợi các bạn nhỏ xuất sắc!' : ' · Chúc mừng lớp trưởng!'}
                  </div>
                  <div className="gon-teacher-line2">
                    {v.phase === 'praise'
                      ? 'Cả lớp cùng vỗ tay khen thưởng các bạn nào 👏'
                      : `Cả lớp vỗ tay cho ${top1Student.nickname} nào 👏`}
                  </div>
                </div>
                <span className="gon-teacher-badge">Hết tiết</span>
              </div>

              {/* THẺ LỚP HỌC (24 BÀN) */}
              <GonClassCard
                v={v}
                teacherName={teacherName}
                giftInfo={giftInfo}
                hint={`Xong tiết · ${v.roster.seated} bạn trong lớp`}
              />
            </>
          )}

          {/* ========================================================
              UI 4: ĐẦY LỚP (Neon - Đầy lớp 24/24)
             ======================================================== */}
          {isFullClass && !isShow && !isTeam && !isVote && !isReveal && !isRecess && !isMonitor && (
            <>
              <div className="gon-info-card">
                <div className="flex items-center justify-between">
                  <span className="gon-card-heading">LỚP ĐÃ ĐỦ CHỖ</span>
                  <span className="gon-pill" style={{ background: '#ec4899', color: '#fff', fontSize: 20, padding: '4px 16px', border: 'none' }}>
                    24/24
                  </span>
                </div>
                <div className="gon-full-circles-grid">
                  {'ABCDEFGHIJKLMNOPQRSTUVWX'.split('').map((ch, idx) => (
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
                  <GonTeacher size={82} hasFlower={hasFlower} />
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
                <span className="gon-teacher-badge">24 bạn</span>
              </div>
            </>
          )}

          {/* ========================================================
              TRẠNG THÁI MẶC ĐỊNH (Đang hỏi bài bình thường)
             ======================================================== */}
          {isQuestion && (
            <>
              {/* 3. BẢNG CHỮ: Khối lớn nhất */}
              <div className="gon-blackboard">
                <div className="gon-blackboard-top">
                  <span className="gon-topic-tag">
                    {v.golden ? (
                      '⭐ CÂU HỎI VÀNG x2'
                    ) : !v.slot && !v.boardShown ? (
                      ''
                    ) : v.slot === 'meo' ? (
                      `🤪 Đố mẹo ${v.riddleNo}/2`
                    ) : v.slot === 'su' ? (
                      '📜 Lịch sử'
                    ) : v.slot === 'anh' ? (
                      '🔤 Tiếng Anh'
                    ) : v.slot === 'dh' ? (
                      '🖼️ Đuổi hình bắt chữ'
                    ) : (
                      v.category || 'Lớp học chữ'
                    )}
                  </span>
                  <div className="gon-timer-circle">{left || 0}s</div>
                </div>

                {!v.boardShown ? (
                  v.riddleNo === 1 ? (
                    <div className="flex flex-col items-center justify-center text-center my-auto py-6">
                      <motion.div animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-[72px] leading-none">
                        🤪
                      </motion.div>
                      <div className="mt-2 text-[46px] font-black text-[#fbbf24]">PHẦN ĐỐ MẸO</div>
                      <div className="mt-2 text-[28px] font-bold text-white">2 câu liền · vẫn tính điểm</div>
                      <div className="mt-2 text-[24px] opacity-90">Chuẩn bị tinh thần, nghĩ xéo mới thắng!</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center my-auto py-6">
                      <div className="text-[54px] font-black text-[#fbbf24] leading-tight">
                        Câu {v.qNo || 1}
                      </div>
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="mt-3 text-[32px] font-bold text-[#fbbf24]"
                      >
                        👂 Nghe {teacherName.toLowerCase()} đọc đề nè...
                      </motion.div>
                      <div className="mt-3 text-[24px] opacity-75">
                        Đọc xong cô sẽ xáo chữ và mở ô đáp án
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    {v.slot === 'dh' ? (
                      <div className="text-center text-[76px] my-3 leading-tight animate-pulse">
                        {v.clue}
                      </div>
                    ) : v.math ? (
                      <div className="text-center text-[64px] font-black text-[#fbbf24] my-3">
                        {v.math}
                      </div>
                    ) : (
                      <>
                        <div className="gon-clue-box">
                          <span>{v.clue}</span>
                        </div>
                        {v.tiles && v.tiles.length > 0 && (
                          <div className="gon-tiles-row">
                            {v.tiles.map((ch, i) => (
                              <div key={`tile-${i}`} className="gon-tile-card">
                                {ch}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Hàng ô đáp án (Slots) - HÌNH 3 */}
                    {v.slots && v.slots.length > 0 && (
                      <div className="gon-slots-row">
                        {v.slots.map((slot, i) =>
                          slot === ' ' ? (
                            <div key={`space-${i}`} className="gon-slot-space" />
                          ) : (
                            <div
                              key={`slot-${i}`}
                              className={`gon-slot-box ${slot ? 'has-char' : ''}`}
                            >
                              {slot || ''}
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* Gợi ý toán / thêm giờ - HÌNH 1 */}
                    {v.math && v.phase !== 'reveal' && (
                      <div className="text-center text-[26px] font-bold text-white/90 mt-2">
                        Gõ số vào bình luận
                      </div>
                    )}
                    {v.phase === 'bonus' && (
                      <div className="text-center text-[28px] font-black text-[#fbbf24] mt-2 animate-bounce">
                        {v.math ? 'Thêm 10 giây, nhẩm lẹ lên!' : 'Cô mở thêm 1 chữ, thêm 10 giây!'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* 4. THANH CÔ/THẦY GIÁO */}
              <div className="gon-teacher-card">
                <div className="gon-teacher-avatar-wrap">
                  <GonTeacher size={82} hasFlower={hasFlower} />
                </div>
                <div className="gon-teacher-info">
                  <div className="gon-teacher-line1">
                    <span className="gon-teacher-name-bold">{teacherName || 'Thầy Minh'}</span>
                    {giftInfo ? (
                      <span style={{ color: 'var(--g-gold)', fontWeight: 800 }}>
                        {` · Cảm ơn ${giftInfo.nickname} đã gửi tặng ${giftInfo.isBig ? 'món quà to' : 'hoa'}! 💕`}
                      </span>
                    ) : v.phase === 'bonus' ? (
                      <span style={{ color: 'var(--g-gold)', fontWeight: 800 }}>
                        {' · Thêm 10 giây nữa nè cả lớp!'}
                      </span>
                    ) : !v.boardShown ? (
                      <>
                        {` · Nghe cô đọc câu ${v.qNo || 1} nhé`}
                      </>
                    ) : v.correctCount > 0 ? (
                      <>
                        {` · Đã có ${v.correctCount} bạn đoán đúng!`}
                      </>
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
                    ) : v.phase === 'bonus' ? (
                      <span className="font-bold text-[#fbbf24]">
                        Cô mở thêm 1 chữ cái rồi, nhanh tay đoán nào!
                      </span>
                    ) : !v.boardShown ? (
                      'Lắng nghe thật kỹ để gõ thật nhanh khi cô hô bắt đầu nha'
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

              {/* BẢNG ĐOÁN NHANH NHẤT (Nếu đã có người đoán đúng) */}
              {v.correctTop && v.correctTop.length > 0 && (
                <div className="gon-info-card" style={{ padding: '12px 18px' }}>
                  <div className="flex items-center justify-between">
                    <span className="gon-card-heading text-[#38bdf8]">⚡ ĐOÁN NHANH NHẤT</span>
                    <span className="text-[20px] font-bold text-white/80">{v.correctCount} bạn đã đúng</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {v.correctTop.map((a, i) => (
                      <div key={a.username || i} className="flex-1 flex items-center gap-2 rounded-xl bg-white/10 px-2 py-1">
                        <span className="text-[22px]">{['🥇', '🥈', '🥉'][i]}</span>
                        <div className="min-w-0 flex-1 truncate font-bold text-[20px]">{a.nickname}</div>
                        <span className="font-black text-[#fbbf24] text-[20px]">+{a.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      <div className="gon-interact-note">
                        Bình luận nhiệt tình để lên bảng tương tác nha!
                      </div>
                    )}
                  </div>
                  <div className="gon-interact-note">
                    Xuất sắc hôm nay: chưa có ai. Trả lời đúng là lên bảng!
                  </div>
                </div>
              </div>

              {/* 6. THẺ LỚP HỌC (24 BÀN - KÍCH THƯỚC TO RÕ) */}
              <GonClassCard v={v} teacherName={teacherName} giftInfo={giftInfo} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
