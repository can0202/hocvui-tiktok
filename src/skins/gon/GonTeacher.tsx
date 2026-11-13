interface GonTeacherProps {
  size?: number;
  hasFlower?: boolean;
}

/**
 * Avatar Thầy Minh / Cô Ngân tối giản theo đúng thiết kế trong hình mockup
 */
export function GonTeacher({ size = 76, hasFlower = false }: GonTeacherProps) {
  return (
    <div className="relative inline-block select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80">
        <defs>
          <clipPath id="gon-teacher-circle-clip">
            <circle cx="40" cy="40" r="39" />
          </clipPath>
        </defs>
        <g clipPath="url(#gon-teacher-circle-clip)">
          {/* Nền tròn theo theme */}
          <rect width="80" height="80" fill="var(--g-teacher-avatar-bg)" />

          {/* Áo / Vai */}
          <path d="M 10 82 Q 40 58 70 82 Z" fill="#fef3c7" opacity="0.9" />
          {/* Cổ áo tròn đen */}
          <path d="M 33 60 Q 40 66 47 60 Z" fill="#1f2937" />

          {/* Cổ */}
          <rect x="36" y="48" width="8" height="12" fill="#fed7aa" rx="2" />

          {/* Khuôn mặt */}
          <circle cx="40" cy="38" r="16" fill="#fed7aa" />

          {/* Tóc đen tròn cắt ngắn */}
          <path d="M 23 37 Q 22 22 40 21 Q 58 22 57 37 Q 52 26 40 25 Q 28 26 23 37 Z" fill="#1f2937" />

          {/* 2 mắt hạt tiêu tối giản */}
          <circle cx="34" cy="39" r="1.8" fill="#1f2937" />
          <circle cx="46" cy="39" r="1.8" fill="#1f2937" />

          {/* Miệng mỉm cười nhẹ (cười tươi khi nhận hoa) */}
          <path
            d={hasFlower ? "M 34 43 Q 40 50 46 43" : "M 37 45 Q 40 48 43 45"}
            fill={hasFlower ? "#be123c" : "none"}
            stroke="#be123c"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
        <circle cx="40" cy="40" r="39" fill="none" stroke="var(--g-card-border)" strokeWidth="2" />
      </svg>
      {/* Bó hoa hồng / quà bay lên khi nhận hoa */}
      {hasFlower && (
        <span
          className="absolute -top-3 -right-3 text-[34px] animate-bounce drop-shadow"
          style={{ animationDuration: '0.8s' }}
        >
          💐
        </span>
      )}
    </div>
  );
}
