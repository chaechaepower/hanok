import { useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { FiAlertCircle, FiCheck, FiCheckCircle, FiClock, FiCopy, FiExternalLink } from 'react-icons/fi';

import { useGetNftReceipt } from '@/api/hooks/useGetNftReceipt';
import { getExplorerUrl, shortenTxHash } from '@/utils/blockchain';
import { formatPrice } from '@/utils/formatPrice';

type NftReceiptDetailContentProps = {
  escrowId: string | number | null;
  onClose: () => void;
  closeVariant?: 'back' | 'modal';
};

type StatusKey = 'COMPLETED' | 'PENDING' | 'FAILED';

type StatusMeta = {
  label: string;
  headline: string;
  chipClassName: string;
  noteClassName: string;
  noteTextClassName: string;
  icon: ComponentType<{ className?: string }>;
};

const STATUS_META: Record<StatusKey, StatusMeta> = {
  COMPLETED: {
    label: 'MINTED',
    headline: '블록체인에 성공적으로 기록되었습니다.',
    chipClassName: 'border-green-800 bg-green-950/40 text-green-400',
    noteClassName: 'border-green-900/50 bg-green-950/20',
    noteTextClassName: 'text-green-300/90',
    icon: FiCheckCircle,
  },
  PENDING: {
    label: 'PENDING',
    headline: '블록체인에 기록 중입니다.',
    chipClassName: 'border-yellow-800 bg-yellow-950/40 text-yellow-400',
    noteClassName: 'border-yellow-900/50 bg-yellow-950/20',
    noteTextClassName: 'text-yellow-300/90',
    icon: FiClock,
  },
  FAILED: {
    label: 'FAILED',
    headline: '블록체인 기록에 실패했습니다.',
    chipClassName: 'border-red-800 bg-red-950/40 text-red-400',
    noteClassName: 'border-red-900/50 bg-red-950/20',
    noteTextClassName: 'text-red-300/90',
    icon: FiAlertCircle,
  },
};

function WoodenPlaque({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[430px] rounded-[30px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] p-4 flex flex-col items-center bg-gradient-to-br from-amber-800 via-yellow-900 to-amber-950 border-[5px] border-amber-950 font-serif">
      <div className="w-8 h-8 rounded-full bg-[#1a0f07] shadow-[inset_0_5px_10px_rgba(0,0,0,0.8)] mb-5 mt-1"></div>

      <div className="w-full h-full border border-amber-700/40 p-5 sm:p-6 rounded-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] flex flex-col bg-amber-900/20">
        <div className="relative z-10 w-full">{children}</div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 shrink-0 text-amber-400/60 transition hover:text-amber-200"
      aria-label="복사"
    >
      {copied ? <FiCheck className="h-4 w-4 text-green-400" /> : <FiCopy className="h-4 w-4" />}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-start gap-3 border-b border-amber-800/60 py-2.5 last:border-b-0">
      <div className="text-[11px] font-medium tracking-[0.18em] text-amber-200/60">{label}</div>
      <div className="text-right text-[13px] font-bold text-amber-50 drop-shadow-md">{value}</div>
    </div>
  );
}

function MiniSeal({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-sm border-[2px] border-red-700/80 bg-red-900/10 px-2 text-[10px] font-bold tracking-[0.14em] text-red-500 shadow-sm transform -rotate-3 select-none">
      {children}
    </div>
  );
}

export default function NftReceiptDetailContent({
  escrowId,
  onClose,
  closeVariant = 'back',
}: NftReceiptDetailContentProps) {
  const { data: response, isLoading } = useGetNftReceipt(escrowId);
  const nft = response?.data ?? null;

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[430px] flex-col gap-6">
        <div className="h-8 w-44 animate-pulse rounded-xl bg-amber-900/50 mx-auto" />
        <div className="h-[760px] animate-pulse rounded-[30px] bg-gradient-to-br from-amber-800/80 to-amber-950" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center font-serif">
        <p className="text-lg font-semibold text-amber-200">NFT 영수증 정보를 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-amber-700 bg-amber-900 px-6 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-800"
        >
          {closeVariant === 'modal' ? '닫기' : '돌아가기'}
        </button>
      </div>
    );
  }

  const isModal = closeVariant === 'modal';
  const statusKey = (nft.txStatus ?? 'PENDING') as StatusKey;
  const status = STATUS_META[statusKey];
  const hashLabel = nft.txHash ? shortenTxHash(nft.txHash) : 'PENDING';
  const barcodeDigits = `${nft.escrowId}${nft.tokenId ?? 0}${nft.blockNumber ?? 0}`
    .replace(/\D/g, '')
    .padEnd(14, '0')
    .slice(0, 14);

  return (
    <div className="mx-auto flex max-w-[430px] flex-col gap-6 text-amber-50">
      <WoodenPlaque>
        {/* 헤더 타이틀 영역 */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.42em] text-amber-500/80 drop-shadow-sm">
              한옥 영수증 명패
            </div>
            <div className="mt-2 font-['Nanum_Myeongjo',serif] text-[32px] font-bold tracking-[0.08em] text-amber-100 drop-shadow-[1px_1px_3px_rgba(0,0,0,0.8)]">
              호패 명부
            </div>
          </div>
        </div>

        {/* 작품 정보 박스 (음각 상자 느낌) */}
        <div className="mb-6 rounded-[16px] border border-amber-800/50 bg-black/20 px-5 py-6 text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-amber-400/60">
            발행 시각 [{nft.mintedAt ? formatLongDate(nft.mintedAt) : '기록 대기 중'}]
          </div>
          <div className="mt-4 font-['Nanum_Myeongjo',serif] text-[26px] sm:text-[28px] font-bold leading-tight text-amber-50 drop-shadow-md">
            {nft.itemName ?? 'UNTITLED NFT'}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className={`mb-6 rounded-[14px] border px-4 py-4 ${status.noteClassName}`}>
          <div className="text-[10px] font-semibold tracking-[0.18em] text-amber-500/80">결과</div>
          <div className={`mt-2 text-sm font-medium leading-relaxed ${status.noteTextClassName}`}>
            {status.headline}
          </div>
        </div>

        {/* 상세 정보 테이블 */}
        <div className="mb-6 rounded-[16px] border border-amber-800/50 bg-black/10 px-4 py-2 shadow-inner">
          <DetailRow label="판매자" value={nft.sellerNickname ?? '정보 없음'} />
          <DetailRow label="구매자" value={nft.buyerNickname ?? '정보 없음'} />
          <DetailRow label="가격" value={nft.price != null ? formatPrice(nft.price) : '--'} />
          <DetailRow label="날짜" value={nft.mintedAt ? formatShortDate(nft.mintedAt) : '--'} />
          <DetailRow label="시간" value={nft.mintedAt ? formatTime(nft.mintedAt) : '--'} />
        </div>

        {/* 서브 정보 그리드 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-[14px] border border-amber-800/40 bg-black/20 px-2 py-3 text-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-amber-500/70">발행처</div>
            <div className="mt-2 text-sm font-bold text-amber-100">한옥</div>
          </div>
          <div className="rounded-[14px] border border-amber-800/40 bg-black/20 px-2 py-3 text-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-amber-500/70">토큰 표준</div>
            <div className="mt-2 text-sm font-bold text-amber-100">ERC-721</div>
          </div>
          <div className="rounded-[14px] border border-amber-800/40 bg-black/20 px-2 py-3 text-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]">
            <div className="text-[10px] font-semibold tracking-[0.18em] text-amber-500/70">토큰</div>
            <div className="mt-2 text-sm font-bold text-amber-100 drop-shadow-sm">
              {nft.tokenId != null ? `#${nft.tokenId}` : '--'}
            </div>
          </div>
        </div>

        {/* TX Hash */}
        <div className="mb-6 rounded-[14px] border border-amber-800/50 bg-black/30 px-4 py-4 shadow-inner">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-amber-500/80">해시</div>
          <div className="mt-2 flex items-center text-sm text-amber-200/90">
            <span className="truncate font-mono">{hashLabel}</span>
            {nft.txHash && <CopyButton text={nft.txHash} />}
          </div>
        </div>

        {/* 바코드 및 아카이브 마크 */}
        <div className="rounded-[16px] border border-amber-900/60 bg-gradient-to-b from-black/40 to-transparent px-4 py-5 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
          <div className="mb-3 text-center text-[10px] font-semibold tracking-[0.38em] text-amber-500/60">
            ARCHIVE MARK
          </div>
          {/* 바코드 (어두운 배경에 맞게 색상 조절) */}
          <div className="h-[50px] w-full rounded-[8px] border border-amber-900/50 bg-[repeating-linear-gradient(90deg,rgba(251,191,36,0.3)_0,rgba(251,191,36,0.3)_2px,transparent_2px,transparent_4px,rgba(251,191,36,0.2)_4px,rgba(251,191,36,0.2)_7px,transparent_7px,transparent_9px)]" />
          <p className="mt-3 text-center font-mono text-sm tracking-[0.22em] text-amber-300/60">{barcodeDigits}</p>

          <div className="mt-5 flex items-center justify-between border-t border-amber-800/40 pt-4 text-[10px] font-semibold tracking-[0.24em] text-amber-400/80">
            <span>ROYAL ARCHIVE</span>
            <div className="flex gap-1">
              {['H', 'A', 'N', 'O', 'K'].map((letter) => (
                <MiniSeal key={letter}>{letter}</MiniSeal>
              ))}
            </div>
          </div>
        </div>
      </WoodenPlaque>

      {/* 하단 액션 버튼 */}
      {(isModal || (nft.txHash && nft.txStatus === 'COMPLETED')) && (
        <div className="flex flex-col gap-3 sm:flex-row mt-2">
          {nft.txHash && nft.txStatus === 'COMPLETED' && (
            <a
              href={getExplorerUrl(nft.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-amber-700 bg-amber-900 px-5 py-3.5 text-sm font-semibold text-amber-100 shadow-lg transition hover:bg-amber-800 hover:border-amber-600"
            >
              <FiExternalLink className="h-4 w-4" />
              Etherscan에서 상세 내역 보기
            </a>
          )}

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-amber-800 bg-black/40 px-5 py-3.5 text-sm font-semibold text-amber-200 shadow-lg transition hover:bg-black/60 sm:min-w-[120px]"
            >
              닫기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper 함수 (그대로 유지)
function formatLongDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
