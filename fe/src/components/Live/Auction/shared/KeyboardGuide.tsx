import { motion } from 'framer-motion';
import { IoChevronBack, IoChevronDown, IoChevronForward, IoChevronUp } from 'react-icons/io5';
import { LuKeyboard } from 'react-icons/lu';

const CLOSED_WIDTH = 60;
const OPEN_WIDTH = 320;

const KEY_BASE = 'flex items-center justify-center rounded-md transition-colors duration-100';
const KEY_INACTIVE = 'bg-neutral-800 text-neutral-300';
const KEY_ACTIVE = 'bg-gold text-background';
const KEY_DISABLED = 'bg-neutral-900 text-neutral-600';

const BADGE_BASE = 'inline-flex items-center justify-center rounded transition-colors duration-100';
const BADGE_INACTIVE = 'bg-neutral-800 text-neutral-300';
const BADGE_ACTIVE = 'bg-gold text-background';

type KeyboardGuideVariant = 'buyer' | 'seller';

interface Props {
  variant: KeyboardGuideVariant;
  open: boolean;
  onToggle: (open: boolean) => void;
  activeKeys?: Set<string>;
  placement?: 'left' | 'top';
}

type ActionRow = {
  badges: Array<{ label: string; keyName: string }>;
  text: string;
};

const VARIANT_CONFIG: Record<
  KeyboardGuideVariant,
  {
    bottomKey: { label: string; keyName: string; accent?: boolean };
    rows: ActionRow[];
    leftRightDisabled?: boolean;
  }
> = {
  buyer: {
    bottomKey: { label: 'ENTER', keyName: 'Enter', accent: true },
    rows: [
      { badges: [{ label: 'Tab', keyName: 'Tab' }], text: '입찰 방식 전환' },
      {
        badges: [
          { label: '↑', keyName: 'ArrowUp' },
          { label: '↓', keyName: 'ArrowDown' },
        ],
        text: '금액 조정',
      },
      {
        badges: [
          { label: '←', keyName: 'ArrowLeft' },
          { label: '→', keyName: 'ArrowRight' },
        ],
        text: '단위 변경',
      },
    ],
    leftRightDisabled: false,
  },
  seller: {
    bottomKey: { label: 'SPACE', keyName: ' ', accent: false },
    rows: [
      {
        badges: [
          { label: '↑', keyName: 'ArrowUp' },
          { label: '↓', keyName: 'ArrowDown' },
        ],
        text: '상품 선택',
      },
      { badges: [{ label: 'SPACE', keyName: ' ' }], text: '상품 소개' },
      { badges: [{ label: 'ENTER', keyName: 'Enter' }], text: '경매 시작' },
    ],
    leftRightDisabled: true,
  },
};

export default function KeyboardGuide({ variant, open, onToggle, activeKeys = new Set() }: Props) {
  const config = VARIANT_CONFIG[variant];
  const isActive = (key: string) => activeKeys.has(key);

  return (
    <motion.div
      initial={false}
      animate={{ width: open ? OPEN_WIDTH : CLOSED_WIDTH }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-[88px] items-center overflow-hidden rounded-2xl bg-surface/80"
    >
      <div className="flex w-full shrink-0 flex-col items-center justify-center" style={{ maxWidth: CLOSED_WIDTH }}>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-warm/10 hover:text-neutral-200"
          onClick={() => onToggle(!open)}
        >
          <LuKeyboard size={20} />
        </button>
      </div>

      <div className="flex flex-1 items-stretch gap-3 py-2.5 pr-1">
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-7" />
            <div className={`h-7 w-7 ${KEY_BASE} ${isActive('ArrowUp') ? KEY_ACTIVE : KEY_INACTIVE}`}>
              <IoChevronUp size={11} />
            </div>
            <div className="w-7" />
          </div>
          <div className="flex gap-0.5">
            <div
              className={`h-7 w-7 ${KEY_BASE} ${
                config.leftRightDisabled
                  ? KEY_DISABLED
                  : isActive('ArrowLeft')
                    ? KEY_ACTIVE
                    : KEY_INACTIVE
              }`}
            >
              <IoChevronBack size={10} />
            </div>
            <div className={`h-7 w-7 ${KEY_BASE} ${isActive('ArrowDown') ? KEY_ACTIVE : KEY_INACTIVE}`}>
              <IoChevronDown size={11} />
            </div>
            <div
              className={`h-7 w-7 ${KEY_BASE} ${
                config.leftRightDisabled
                  ? KEY_DISABLED
                  : isActive('ArrowRight')
                    ? KEY_ACTIVE
                    : KEY_INACTIVE
              }`}
            >
              <IoChevronForward size={10} />
            </div>
          </div>
          <div
            className={`mt-0.5 w-full rounded-md py-1 text-center text-[10px] font-bold tracking-widest transition-colors duration-100 ${
              isActive(config.bottomKey.keyName)
                ? 'bg-gold text-background'
                : config.bottomKey.accent
                  ? 'bg-gold/20 text-gold-light'
                  : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {config.bottomKey.label}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2 text-[11px] text-neutral-400">
          {config.rows.map((row) => (
            <div key={row.text} className="flex items-center gap-1.5">
              {row.badges.map((badge) => (
                <span
                  key={`${row.text}-${badge.keyName}`}
                  className={`h-5.5 ${badge.label.length > 2 ? 'px-1.5' : 'w-5.5'} text-[10px] font-bold ${BADGE_BASE} ${
                    isActive(badge.keyName) ? BADGE_ACTIVE : BADGE_INACTIVE
                  }`}
                >
                  {badge.label}
                </span>
              ))}
              <span>{row.text}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        className="flex w-6 shrink-0 items-center justify-center text-neutral-500 transition hover:bg-warm/5 hover:text-neutral-300"
        onClick={() => onToggle(false)}
      >
        <IoChevronBack size={12} />
      </button>
    </motion.div>
  );
}
