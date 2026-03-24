import { useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiCopy, FiExternalLink, FiCheck } from 'react-icons/fi';
import { useState } from 'react';

import { useGetNftReceipt } from '@/api/hooks/useGetNftReceipt';
import { getExplorerUrl, shortenTxHash } from '@/utils/blockchain';
import { formatPrice } from '@/utils/formatPrice';

const STATUS_CONFIG = {
  COMPLETED: { label: 'Success', className: 'bg-green-500/15 text-green-400 border-green-500/30' },
  PENDING: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  FAILED: { label: 'Failed', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
} as const;

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
      className="ml-2 shrink-0 text-neutral-500 transition hover:text-neutral-300"
      aria-label="복사"
    >
      {copied ? <FiCheck className="h-4 w-4 text-green-400" /> : <FiCopy className="h-4 w-4" />}
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-neutral-800 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-0">
      <span className="w-40 shrink-0 text-sm text-neutral-500">{label}</span>
      <div className="min-w-0 flex-1 text-sm text-neutral-100">{children}</div>
    </div>
  );
}

export default function NftReceiptPage() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const { data: response, isLoading } = useGetNftReceipt(escrowId ?? null);
  const nft = response?.data ?? null;

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8">
        <div className="flex flex-col gap-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-white/10" />
          <div className="rounded-3xl border border-neutral-800 bg-surface-elevated p-8">
            <div className="space-y-6">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-5 w-32 animate-pulse rounded-md bg-white/8" />
                  <div className="h-5 flex-1 animate-pulse rounded-md bg-white/8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!nft) {
    return (
      <section className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-lg font-semibold text-neutral-300">NFT 영수증을 찾을 수 없습니다</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light"
          >
            돌아가기
          </button>
        </div>
      </section>
    );
  }

  const statusConfig = nft.txStatus ? STATUS_CONFIG[nft.txStatus] : null;

  return (
    <section className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-8 text-neutral-100">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-warm transition hover:bg-white/6"
            aria-label="뒤로가기"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-warm leading-tight">NFT 영수증</h1>
        </div>

        {/* Status Banner */}
        {statusConfig && (
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${statusConfig.className}`}>
            <div className={`h-2.5 w-2.5 rounded-full ${
              nft.txStatus === 'COMPLETED' ? 'bg-green-400' :
              nft.txStatus === 'PENDING' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-sm font-semibold">
              {nft.txStatus === 'COMPLETED' && '블록체인에 성공적으로 기록되었습니다'}
              {nft.txStatus === 'PENDING' && '블록체인에 기록 중입니다...'}
              {nft.txStatus === 'FAILED' && '블록체인 기록에 실패했습니다'}
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="rounded-3xl border border-neutral-800 bg-surface-elevated p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-8">
          {/* Token Info Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-muted">
              <span className="text-2xl font-bold text-gold-light">H</span>
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-100">HanokReceipt (HNR)</p>
              <p className="text-sm text-neutral-500">ERC-721 NFT</p>
            </div>
          </div>

          <div className="h-px bg-neutral-700" />

          {/* 거래 정보 */}
          <div className="flex flex-col">
            <InfoRow label="상태">
              {statusConfig && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusConfig.className}`}>
                  {statusConfig.label}
                </span>
              )}
            </InfoRow>

            {nft.itemName && (
              <InfoRow label="상품명">
                <span className="font-semibold">{nft.itemName}</span>
              </InfoRow>
            )}

            {nft.price != null && (
              <InfoRow label="낙찰 금액">
                <span className="font-semibold text-gold-light">{formatPrice(nft.price)}</span>
              </InfoRow>
            )}

            {nft.buyerNickname && (
              <InfoRow label="구매자">
                <span>{nft.buyerNickname}</span>
              </InfoRow>
            )}

            {nft.sellerNickname && (
              <InfoRow label="판매자">
                <span>{nft.sellerNickname}</span>
              </InfoRow>
            )}
          </div>

          <div className="my-2 h-px bg-neutral-700" />

          {/* 블록체인 정보 */}
          <div className="flex flex-col">
            {nft.txStatus === 'COMPLETED' && nft.tokenId != null && (
              <InfoRow label="토큰 ID">
                <span className="font-mono font-semibold text-gold-light">#{nft.tokenId}</span>
              </InfoRow>
            )}

            {nft.txHash && (
              <InfoRow label="트랜잭션 해시">
                <div className="flex items-center">
                  <span className="truncate font-mono text-gold-light" title={nft.txHash}>
                    {shortenTxHash(nft.txHash)}
                  </span>
                  <CopyButton text={nft.txHash} />
                </div>
              </InfoRow>
            )}

            {nft.txStatus === 'COMPLETED' && nft.blockNumber != null && (
              <InfoRow label="블록 번호">
                <span className="font-mono">{nft.blockNumber.toLocaleString()}</span>
              </InfoRow>
            )}

            {nft.mintedAt && (
              <InfoRow label="민팅 시각">
                <span>{formatMintedAt(nft.mintedAt)}</span>
              </InfoRow>
            )}

            <InfoRow label="네트워크">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Sepolia Testnet
              </span>
            </InfoRow>

            <InfoRow label="토큰 표준">
              <span>ERC-721</span>
            </InfoRow>
          </div>
        </div>

        {/* Actions */}
        {nft.txHash && nft.txStatus === 'COMPLETED' && (
          <a
            href={getExplorerUrl(nft.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold-muted/50 px-5 py-3.5 text-sm font-semibold text-gold-light transition hover:bg-gold-muted"
          >
            <FiExternalLink className="h-4 w-4" />
            Etherscan에서 상세 내역 보기
          </a>
        )}
      </div>
    </section>
  );
}

function formatMintedAt(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
