import { useState } from 'react';
import type { ComponentType, CSSProperties, ReactNode } from 'react';
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
  resultClassName: string;
  resultTextClassName: string;
  icon: ComponentType<{ className?: string }>;
};

const STATUS_META: Record<StatusKey, StatusMeta> = {
  COMPLETED: {
    label: 'MINTED',
    headline: '블록체인에 성공적으로 기록되었습니다',
    chipClassName: 'bg-gold-light text-background',
    resultClassName: 'border-emerald-500/28 bg-emerald-500/10',
    resultTextClassName: 'text-emerald-200',
    icon: FiCheckCircle,
  },
  PENDING: {
    label: 'PENDING',
    headline: '블록체인에 기록 중입니다...',
    chipClassName: 'bg-primary-light text-background',
    resultClassName: 'border-amber-400/28 bg-amber-400/10',
    resultTextClassName: 'text-amber-200',
    icon: FiClock,
  },
  FAILED: {
    label: 'FAILED',
    headline: '블록체인 기록에 실패했습니다',
    chipClassName: 'bg-accent-light text-background',
    resultClassName: 'border-rose-400/28 bg-rose-400/10',
    resultTextClassName: 'text-rose-200',
    icon: FiAlertCircle,
  },
};

const ticketWrapperMaskStyle: CSSProperties = {
  WebkitMask:
    'radial-gradient(circle at 12.5px 0px, transparent 6px, black 6.5px) top left / 25px 51% repeat-x, radial-gradient(circle at 12.5px 100%, transparent 6px, black 6.5px) bottom left / 25px 51% repeat-x',
  mask: 'radial-gradient(circle at 12.5px 0px, transparent 6px, black 6.5px) top left / 25px 51% repeat-x, radial-gradient(circle at 12.5px 100%, transparent 6px, black 6.5px) bottom left / 25px 51% repeat-x',
};

const ticketInnerMaskStyle: CSSProperties = {
  WebkitMask:
    'radial-gradient(circle at 12.5px -2px, transparent 8px, black 8.5px) top left / 25px 51% repeat-x, radial-gradient(circle at 12.5px calc(100% + 2px), transparent 8px, black 8.5px) bottom left / 25px 51% repeat-x',
  mask: 'radial-gradient(circle at 12.5px -2px, transparent 8px, black 8.5px) top left / 25px 51% repeat-x, radial-gradient(circle at 12.5px calc(100% + 2px), transparent 8px, black 8.5px) bottom left / 25px 51% repeat-x',
};

function TicketFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative h-[680px] w-[325px] rounded-[2px] bg-primary-light p-[2px] ${className ?? ''}`}
      style={ticketWrapperMaskStyle}
    >
      <div className="flex h-full w-full flex-col bg-[#060606] text-white" style={ticketInnerMaskStyle}>
        {children}
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
      className="ml-2 shrink-0 text-white/45 transition hover:text-white"
      aria-label="복사"
    >
      {copied ? <FiCheck className="h-4 w-4 text-gold-light" /> : <FiCopy className="h-4 w-4" />}
    </button>
  );
}

function SectionRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <div>{label}</div>
      <div>{value}</div>
    </>
  );
}

function Crosshair({ active = false }: { active?: boolean }) {
  return (
    <div className={`relative h-4 w-4 rounded-full border ${active ? 'border-gold-light' : 'border-white'}`}>
      <span
        className={`absolute left-1/2 top-[-3px] h-[22px] w-px -translate-x-1/2 ${active ? 'bg-gold-light' : 'bg-white'}`}
      />
      <span
        className={`absolute left-[-3px] top-1/2 h-px w-[22px] -translate-y-1/2 ${active ? 'bg-gold-light' : 'bg-white'}`}
      />
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
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-white/10" />
        <div className="flex flex-wrap justify-center gap-[30px]">
          <div className="h-[680px] w-[325px] animate-pulse rounded-[10px] bg-white/10" />
          <div className="h-[680px] w-[325px] animate-pulse rounded-[10px] bg-white/10" />
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-neutral-300">NFT 영수증을 찾을 수 없습니다</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
        >
          {closeVariant === 'modal' ? '닫기' : '돌아가기'}
        </button>
      </div>
    );
  }

  const isModal = closeVariant === 'modal';
  const statusKey = (nft.txStatus ?? 'PENDING') as StatusKey;
  const status = STATUS_META[statusKey];
  const titleYear = nft.mintedAt ? new Date(nft.mintedAt).getFullYear() : '----';
  const hashLabel = nft.txHash ? shortenTxHash(nft.txHash) : 'PENDING';
  const barcodeDigits = `${nft.escrowId}${nft.tokenId ?? 0}${nft.blockNumber ?? 0}`
    .replace(/\D/g, '')
    .padEnd(14, '0')
    .slice(0, 14);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6 text-neutral-100">
      <div className="flex flex-wrap justify-center gap-[30px]">
        <TicketFrame>
          <div className="flex h-full items-stretch justify-between px-5 py-10 font-['Arial_Black',Impact,sans-serif] uppercase">
            <div className="flex flex-col justify-between text-[190px] leading-[0.76]">
              <div>H</div>
              <div>A</div>
              <div>N</div>
              <div>O</div>
            </div>
            <div className="flex flex-col justify-between pt-[15px] text-right text-[140px] leading-[0.76]">
              <div>K</div>
              <div>N</div>
              <div>F</div>
              <div>T</div>
            </div>
          </div>
        </TicketFrame>

        <TicketFrame>
          <div className="flex h-full flex-col px-5 py-[30px]">
            <div className="mb-3 flex items-center justify-between text-[10px] font-bold tracking-[0.5px]">
              <span>HANOK ORIGINAL TICKET</span>
              <span>NO.{String(nft.escrowId).padStart(2, '0')}</span>
            </div>

            <div className="mb-3 flex flex-1 flex-col border border-white">
              <div className="border-b border-white px-[15px] py-[15px] text-center">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Title</span>
                  <span>[{titleYear}]</span>
                </div>
                <div className="my-[25px] mb-[5px] text-[26px] font-black leading-tight tracking-[1px]">
                  {nft.itemName ?? 'UNTITLED NFT'}
                </div>
                <div className="mb-[15px] text-[13px] font-normal text-neutral-300">Hanok Live Auction Receipt</div>
              </div>

              <div className="grid grid-cols-[80px_1fr] gap-y-[10px] border-b border-white px-[15px] py-[15px] text-[11px] leading-[1.4]">
                <SectionRow label="Release" value={nft.mintedAt ? formatLongDate(nft.mintedAt) : '기록 대기 중'} />
                <SectionRow label="Seller" value={nft.sellerNickname ?? '정보 없음'} />
                <SectionRow label="Buyer" value={nft.buyerNickname ?? '정보 없음'} />
                <SectionRow label="Price" value={nft.price != null ? formatPrice(nft.price) : '--'} />
              </div>

              <div className="flex items-center border-b border-white px-[15px] py-[15px] text-[11px]">
                <div className="w-20">Status</div>
                <div className="mr-[15px] flex gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Crosshair key={index} active={index === 0} />
                  ))}
                </div>
                <div>[ 1 / 5 ]</div>
              </div>

              <div className={`h-[60px] border-b px-[15px] py-[15px] text-[11px] ${status.resultClassName}`}>
                <div className="font-semibold">결과</div>
                <div className={`mt-2 leading-relaxed ${status.resultTextClassName}`}>{status.headline}</div>
              </div>

              <div className="grid grid-cols-2 border-b border-white text-[11px]">
                <div className="h-10 border-r border-dashed border-white px-[15px] py-[10px]">
                  <div>Date</div>
                  <div className="mt-1 text-white/70">{nft.mintedAt ? formatShortDate(nft.mintedAt) : '--'}</div>
                </div>
                <div className="h-10 px-[20px] py-[10px]">
                  <div>Time</div>
                  <div className="mt-1 text-white/70">{nft.mintedAt ? formatTime(nft.mintedAt) : '--'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 border-b border-white text-[11px]">
                <div className="h-[50px] border-r border-dashed border-white px-[15px] py-[10px] text-center">
                  <div>Theater</div>
                  <div className="mt-1 text-white/70">HANOK</div>
                </div>
                <div className="h-[50px] border-r border-dashed border-white px-[15px] py-[10px] text-center">
                  <div>Screen</div>
                  <div className="mt-1 text-white/70">ERC-721</div>
                </div>
                <div className="h-[50px] px-[15px] py-[10px] text-center">
                  <div>Seat</div>
                  <div className="mt-1 text-white/70">{nft.tokenId != null ? `#${nft.tokenId}` : '--'}</div>
                </div>
              </div>

              <div className="px-[15px] py-[15px] text-[11px]">
                <div className="font-semibold">Tx Hash</div>
                <div className="mt-2 flex items-center text-white/70">
                  <span className="truncate font-mono">{hashLabel}</span>
                  {nft.txHash && <CopyButton text={nft.txHash} />}
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-end justify-between text-[11px] font-black">
              <span>HANOK LIVE HOUSE</span>
              <div className="flex gap-[2px]">
                {['H', 'A', 'N', 'O', 'K'].map((letter) => (
                  <span
                    key={letter}
                    className="inline-block h-[14px] w-[14px] bg-white text-center text-[10px] leading-[14px] text-black"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TicketFrame>
      </div>
      <div className="rounded-[18px] border border-gold/16 bg-white/[0.03] px-4 py-3">
        <div className="h-[64px] w-full bg-[repeating-linear-gradient(90deg,var(--color-warm)_0,var(--color-warm)_2px,transparent_2px,transparent_4px,var(--color-warm)_4px,var(--color-warm)_7px,transparent_7px,transparent_9px)] opacity-90" />
        <p className="mt-2 text-center font-mono text-sm tracking-[0.22em] text-gold-light">{barcodeDigits}</p>
      </div>

      {(isModal || (nft.txHash && nft.txStatus === 'COMPLETED')) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {nft.txHash && nft.txStatus === 'COMPLETED' && (
            <a
              href={getExplorerUrl(nft.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold-muted/50 px-5 py-3.5 text-sm font-semibold text-gold-light transition hover:bg-gold-muted"
            >
              <FiExternalLink className="h-4 w-4" />
              Etherscan에서 상세 내역 보기
            </a>
          )}

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:bg-white/10 sm:min-w-[120px]"
            >
              닫기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatLongDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
