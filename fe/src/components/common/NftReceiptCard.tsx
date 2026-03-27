import { useEffect, useState } from 'react';

import { useGetNftReceipt } from '@/api/hooks/useGetNftReceipt';
import NftReceiptModal from '@/components/common/modal/NftReceiptModal';
import { shortenTxHash } from '@/utils/blockchain';

const POLLING_TIMEOUT_MS = 3 * 60 * 1000;

type NftReceiptCardProps = {
  escrowId: string | number;
};

export default function NftReceiptCard({ escrowId }: NftReceiptCardProps) {
  const [timedOut, setTimedOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: response } = useGetNftReceipt(escrowId);
  const nft = response?.data ?? null;

  const isPending = nft?.txStatus === 'PENDING' && !timedOut;
  const { data: pollingResponse } = useGetNftReceipt(isPending ? escrowId : null, true);
  const liveNft = pollingResponse?.data ?? nft;

  useEffect(() => {
    if (liveNft?.txStatus !== 'PENDING') return;

    const timer = setTimeout(() => setTimedOut(true), POLLING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [liveNft?.txStatus]);

  if (!liveNft || liveNft.txStatus === null) return null;

  if (liveNft.txStatus === 'PENDING' && !timedOut) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold/5 px-5 py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold-light" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gold-light">NFT 영수증 발행 중...</span>
          <span className="text-xs text-neutral-500">블록체인에 기록하고 있습니다. 잠시만 기다려주세요.</span>
        </div>
      </div>
    );
  }

  if (liveNft.txStatus === 'COMPLETED' && liveNft.txHash) {
    return (
      <>
        <div className="flex items-center justify-between rounded-2xl border border-green-500/20 bg-green-500/5 px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-green-400">NFT 영수증 발행 완료</span>
            <span className="text-xs text-neutral-500">TX: {shortenTxHash(liveNft.txHash)}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/25"
          >
            영수증 보기
          </button>
        </div>
        {isModalOpen && <NftReceiptModal escrowId={escrowId} onClose={() => setIsModalOpen(false)} />}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-red-400">NFT 영수증 발행 실패</span>
        <span className="text-xs text-neutral-500">
          {timedOut ? '시간이 초과되었습니다. 나중에 다시 확인해주세요.' : '발행 중 오류가 발생했습니다.'}
        </span>
      </div>
    </div>
  );
}
