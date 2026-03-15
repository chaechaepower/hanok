import { motion } from 'framer-motion';
import { IoChevronBack, IoChevronDown, IoChevronForward, IoChevronUp } from 'react-icons/io5';
import { LuKeyboard } from 'react-icons/lu';

const CLOSED_WIDTH = 60;
const OPEN_WIDTH = 380;

interface Props {
  open: boolean;
  onToggle: (open: boolean) => void;
}

export default function KeyboardGuide({ open, onToggle }: Props) {
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <IoChevronUp size={14} />
            </div>
            <div className="w-9" />
          </div>
          <div className="flex gap-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <IoChevronBack size={12} />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <IoChevronDown size={14} />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300">
              <IoChevronForward size={12} />
            </div>
          </div>
          <div className="mt-0.5 flex w-full gap-1">
            <div className="flex-1 rounded-lg bg-gold/20 py-1.5 text-center text-[10px] font-bold tracking-widest text-gold-light">
              ENTER
            </div>
            <span className="flex h-auto items-center justify-center px-1 text-[10px] text-neutral-400">입찰</span>
          </div>
        </div>

        {/* 단축키 설명 */}
        <div className="flex flex-col justify-center gap-3 text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 items-center justify-center rounded bg-neutral-800 px-2 text-[10px] font-bold text-neutral-300">
              Tab
            </span>
            <span>탭 전환</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-neutral-300">
              ↑
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-neutral-300">
              ↓
            </span>
            <span>금액 조절</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-neutral-300">
              ←
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-neutral-800 text-[10px] font-bold text-neutral-300">
              →
            </span>
            <span>단위 변경</span>
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
