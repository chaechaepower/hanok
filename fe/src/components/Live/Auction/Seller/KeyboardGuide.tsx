import { motion } from 'framer-motion';
import { IoChevronBack, IoChevronDown, IoChevronForward, IoChevronUp } from 'react-icons/io5';
import { LuKeyboard } from 'react-icons/lu';

const CLOSED_WIDTH = 60;
const OPEN_WIDTH = 380;

const KEY_BASE = 'flex items-center justify-center rounded-lg transition-colors duration-100';
const KEY_INACTIVE = 'bg-neutral-800 text-neutral-300';
const KEY_ACTIVE = 'bg-gold text-background';
const KEY_DISABLED = 'bg-neutral-900 text-neutral-600';

const BADGE_BASE = 'inline-flex items-center justify-center rounded transition-colors duration-100';
const BADGE_INACTIVE = 'bg-neutral-800 text-neutral-300';
const BADGE_ACTIVE = 'bg-gold text-background';

interface Props {
  open: boolean;
  onToggle: (open: boolean) => void;
  activeKeys?: Set<string>;
}

export default function KeyboardGuide({ open, onToggle, activeKeys = new Set() }: Props) {
  const isActive = (key: string) => activeKeys.has(key);
  return (
    <motion.div
      initial={false}
      animate={{ width: open ? OPEN_WIDTH : CLOSED_WIDTH }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-32.5 items-stretch overflow-hidden rounded-2xl bg-surface/80"
    >
      {/* 키보드 토글 버튼 */}
      <div className="flex shrink-0 flex-col justify-center px-2.5">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
          onClick={() => onToggle(!open)}
        >
          <LuKeyboard size={18} />
        </button>
      </div>

      {/* 가이드 콘텐츠 */}
      <div className="flex flex-1 items-stretch gap-4 py-3 pr-1">
        {/* 방향키 */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <div className="w-9" />
            <div className={`h-9 w-9 ${KEY_BASE} ${isActive('ArrowUp') ? KEY_ACTIVE : KEY_INACTIVE}`}>
              <IoChevronUp size={14} />
            </div>
            <div className="w-9" />
          </div>
          <div className="flex gap-1">
            <div className={`h-9 w-9 ${KEY_BASE} ${KEY_DISABLED}`}>
              <IoChevronBack size={12} />
            </div>
            <div className={`h-9 w-9 ${KEY_BASE} ${isActive('ArrowDown') ? KEY_ACTIVE : KEY_INACTIVE}`}>
              <IoChevronDown size={14} />
            </div>
            <div className={`h-9 w-9 ${KEY_BASE} ${KEY_DISABLED}`}>
              <IoChevronForward size={12} />
            </div>
          </div>
          <div
            className={`mt-0.5 w-full rounded-lg py-1.5 text-center text-[10px] font-bold tracking-widest transition-colors duration-100 ${
              isActive(' ') ? 'bg-gold text-background' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            SPACE
          </div>
        </div>

        {/* 단축키 설명 */}
        <div className="flex flex-col justify-center gap-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className={`h-7 w-7 text-[10px] font-bold ${BADGE_BASE} ${isActive('ArrowUp') ? BADGE_ACTIVE : BADGE_INACTIVE}`}>↑</span>
            <span className={`h-7 w-7 text-[10px] font-bold ${BADGE_BASE} ${isActive('ArrowDown') ? BADGE_ACTIVE : BADGE_INACTIVE}`}>↓</span>
            <span>물품 이동</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-7 px-2 text-[10px] font-bold ${BADGE_BASE} ${isActive(' ') ? BADGE_ACTIVE : BADGE_INACTIVE}`}>SPACE</span>
            <span>설명 시작</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-7 px-2 text-[10px] font-bold ${BADGE_BASE} ${isActive('Enter') ? BADGE_ACTIVE : BADGE_INACTIVE}`}>↵</span>
            <span>경매 시작</span>
          </div>
        </div>
      </div>

      {/* 접기 버튼 */}
      <button
        className="flex w-8 shrink-0 items-center justify-center text-neutral-500 transition hover:bg-warm/5 hover:text-neutral-300"
        onClick={() => onToggle(false)}
      >
        <IoChevronBack size={14} />
      </button>
    </motion.div>
  );
}
