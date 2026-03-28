import { useState } from 'react';
import type { ReactNode } from 'react';
import { FiAlertCircle, FiCheck, FiClock, FiCopy, FiExternalLink } from 'react-icons/fi';

import { useGetNftReceipt } from '@/api/hooks/useGetNftReceipt';
import { getExplorerUrl, shortenTxHash } from '@/utils/blockchain';
import { formatPrice } from '@/utils/formatPrice';
import woodTexture from '@/assets/beautiful-wood-textured-background-design.jpg';
import hanokLogo from '@/assets/Logo.png';

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
  icon: ReactNode;
};

const STATUS_META: Record<StatusKey, StatusMeta> = {
  COMPLETED: {
    label: '발행 완료',
    headline: '블록체인에 성공적으로 기록되었습니다',
    chipClassName: 'text-[#e1d5b4]',
    icon: (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#c0392b] font-bold text-black border border-[#b19c6f] text-md leading-none pt-[2px]">
        완
      </div>
    ),
  },
  PENDING: {
    label: '기록 중',
    headline: '블록체인에 기록 중입니다',
    chipClassName: 'text-[#e1d5b4]',
    icon: (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#f1c40f] font-bold text-black border border-[#b19c6f]">
        <FiClock className="h-3.5 w-3.5" />
      </div>
    ),
  },
  FAILED: {
    label: '실패',
    headline: '블록체인 기록에 실패했습니다',
    chipClassName: 'text-[#e1d5b4]',
    icon: (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] bg-[#e74c3c] font-bold text-black border border-[#b19c6f]">
        <FiAlertCircle className="h-3.5 w-3.5" />
      </div>
    ),
  },
};

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
      className="shrink-0 text-[#b79063]/70 transition hover:text-[#e1d5b4]"
      aria-label="복사"
    >
      {copied ? <FiCheck className="h-4 w-4 text-emerald-400" /> : <FiCopy className="h-4 w-4" />}
    </button>
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
      <div className="mx-auto flex max-w-[400px] flex-col gap-4">
        <div className="h-[720px] animate-pulse rounded-2xl bg-gradient-to-br from-[#3d2b18]/60 to-[#1a110a]/80" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-base font-semibold text-[#e1d5b4]/80">NFT 영수증 정보를 찾을 수 없습니다</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#a07a50]/50 bg-[#3d2b18]/50 px-6 py-2.5 text-sm font-semibold text-[#e1d5b4] transition hover:bg-[#3d2b18]/80"
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
    <div className="mx-auto flex max-w-[400px] flex-col gap-5">
      {/* ── 끈 + 호패 래퍼 ── */}
      <div className="relative flex flex-col items-center">
        {/* 끈 (호패 바깥, 위로 길게) */}
        <div className="relative h-20 w-6 shrink-0">
          <div
            className="absolute left-0 h-full w-[6px] rounded-full bg-gradient-to-r from-[#7a1515] via-[#a02020] to-[#8b1a1a] shadow-[2px_0_4px_rgba(0,0,0,0.5),-1px_0_2px_rgba(200,100,100,0.15)]"
            style={{ transform: 'rotate(-1deg)' }}
          />
          <div
            className="absolute right-0 h-full w-[6px] rounded-full bg-gradient-to-r from-[#8b1a1a] via-[#a02020] to-[#7a1515] shadow-[-2px_0_4px_rgba(0,0,0,0.5),1px_0_2px_rgba(200,100,100,0.15)]"
            style={{ transform: 'rotate(1deg)' }}
          />
        </div>

        {/* ── 호패 본체 ── */}
        <div className="relative w-full overflow-hidden rounded-[20px] shadow-[0_4px_8px_rgba(0,0,0,0.3),0_16px_32px_-8px_rgba(0,0,0,0.5),0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          {/* 나무 텍스처 배경 */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${woodTexture})` }} />
          {/* 어둡게 오버레이 */}
          <div className="pointer-events-none absolute inset-0 bg-black/40" />

          {/* 광원: 좌상단에서 오는 빛 */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(240,200,140,0.15)_0%,rgba(240,200,140,0.05)_20%,transparent_45%,rgba(0,0,0,0.15)_80%,rgba(0,0,0,0.25)_100%)]" />
          {/* 중앙 광택 반사 */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_35%_at_35%_20%,rgba(240,210,160,0.1),transparent)]" />

          {/* 가장자리 두께감 + 방향별 음영 */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_2px_4px_rgba(240,200,140,0.15),inset_0_-8px_20px_rgba(0,0,0,0.5),inset_8px_0_16px_rgba(0,0,0,0.25),inset_-4px_0_10px_rgba(240,200,140,0.04)]" />

          {/* 상단 엣지: 빛 받는 면 — 밝은 하이라이트 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[rgba(240,210,160,0.25)] to-transparent" />
          {/* 좌측 엣지: 빛 받는 면 */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[rgba(240,210,160,0.2)] via-[rgba(240,210,160,0.08)] to-transparent" />
          {/* 하단 엣지: 그림자 면 */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0.5)]" />
          {/* 우측 엣지: 그림자 면 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-gradient-to-b from-transparent via-[rgba(0,0,0,0.2)] to-[rgba(0,0,0,0.4)]" />

          {/* 구멍 (끈이 통과하는 위치) */}
          <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#0a0604] to-[#1a110a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9),0_1px_3px_rgba(200,160,100,0.1)]">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-[#060402] to-[#15100a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" />
            </div>
          </div>

          <div className="relative px-7 pt-14 pb-8 sm:px-9 sm:pb-10">
            {/* 헤더 */}
            <div className="mb-4 text-center">
              <div
                className="mt-1 text-h1 font-bold tracking-[0.4em] text-[#d4c4a0]"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                HANOK
              </div>
              <div
                className="text-h3 font-bold tracking-[0.2em] text-[#d4c4a0]"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                NFT 영수증
              </div>
            </div>

            {/* 품명 */}
            <div className="mb-4 text-center">
              <div
                className="text-h3 font-semibold tracking-[0.3em] text-[#d4c4a0]"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                품 명
              </div>
              <h3
                className="mt-1 text-2xl font-bold uppercase leading-snug tracking-wider text-[#e1d5b4]/90"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 -1px 1px rgba(225,213,180,0.2)' }}
              >
                {nft.itemName ?? 'UNTITLED'}
              </h3>
            </div>

            {/* 상태 칩 + 안내 */}
            <div className="mb-4 flex items-center gap-4 rounded-md border border-[#b19c6f]/60 bg-black/20 px-4 py-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-lg">{status.icon}</div>
              <div>
                <div className="text-h4 font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {status.label}
                </div>
                <div
                  className="mt-0.5 text-[14px] font-medium text-[#d4c4a0]"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
                >
                  {status.headline}
                </div>
              </div>
            </div>

            {/* 거래 정보 */}
            <div className="mb-4 space-y-1.5 text-[14px]">
              {[
                { label: '판매자', value: nft.sellerNickname ?? '정보 없음' },
                { label: '구매자', value: nft.buyerNickname ?? '정보 없음' },
                { label: '가격', value: nft.price != null ? formatPrice(nft.price) : '--' },
                {
                  label: '날짜 / 시간',
                  value: nft.mintedAt ? `${formatShortDate(nft.mintedAt)} ${formatTime(nft.mintedAt)}` : '--',
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="font-semibold text-[#d4c4a0]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {item.label}
                  </span>
                  <span className="font-bold text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 토큰 정보 그리드 */}
            <div className="mb-1 grid grid-cols-3 gap-2">
              {[
                { value: nft.tokenId != null ? `${nft.tokenId}` : '--' },
                { value: 'Sepolia' },
                { value: 'ERC-721' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex h-11 flex-col items-center justify-center rounded-sm border border-[#b19c6f] bg-black/15 p-1.5 shadow-inner"
                >
                  <div
                    className="text-[14px] font-bold text-[#e1d5b4]"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-3 text-center text-h4 text-[#a07a50]">토큰 ID / 네트워크 / 토큰표준</div>

            {/* TX Hash */}
            <div className="mb-4 flex flex-col">
              <span className="text-sub-sm text-[#d4c4a0]">트랜잭션 해시</span>
              <div className="mt-1 flex h-9 items-center justify-between rounded-sm border border-[#b19c6f] bg-black/15 px-3 shadow-inner">
                <span
                  className="truncate text-[11px] font-medium text-[#e1d5b4]/80"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {hashLabel}
                </span>
                {nft.txHash && <CopyButton text={nft.txHash} />}
              </div>
            </div>

            {/* 바코드 */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-9 w-full items-end justify-center">
                {Array.from({ length: 60 }, (_, i) => {
                  const seed = Number(barcodeDigits[i % barcodeDigits.length]) + i;
                  const h = 18 + (seed % 7) * 3;
                  const w = i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : 2;
                  const gap = i % 4 === 0 ? 3 : 2;
                  return (
                    <div
                      key={i}
                      className="bg-black/70"
                      style={{ height: `${h}px`, width: `${w}px`, marginRight: `${gap}px`, flexShrink: 0 }}
                    />
                  );
                })}
              </div>
              <span
                className="text-label font-bold tracking-[0.2em] text-[#c3b692]"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 -1px 1px rgba(225,213,180,0.2)' }}
              >
                {barcodeDigits}
              </span>
            </div>

            {/* 하단 한옥 로고 */}
            <div className="mt-6 flex flex-col items-center">
              <img src={hanokLogo} alt="한옥" className="h-18 w-auto opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      {(isModal || (nft.txHash && nft.txStatus === 'COMPLETED')) && (
        <div className="flex flex-col gap-2.5 sm:flex-row">
          {nft.txHash && nft.txStatus === 'COMPLETED' && (
            <a
              href={getExplorerUrl(nft.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-dark px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-light"
            >
              <FiExternalLink className="h-4 w-4" />
              Etherscan에서 보기
            </a>
          )}

          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-neutral-700 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-600 sm:min-w-[100px]"
            >
              닫기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}
