import { useCallback, useEffect, useRef, useState } from 'react';
import { useStomp } from './useStomp';
import { DESTINATION_PREFIX } from '@/constants/stomp';
import type {
  StompResponse,
  AuctionStartPayload,
  AuctionDescribePayload,
  AuctionState,
  AuctionResult,
  AuctionDuration,
} from '@/types/stomp';

export type AuctionPhase = 'idle' | 'describing' | 'bidding' | 'ended';

export function useStompAuction() {
  const { client, connectionState, streamId } = useStomp();
  const [currentAuction, setCurrentAuction] = useState<AuctionState | null>(null);
  const [auctionPhase, setAuctionPhase] = useState<AuctionPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [winner, setWinner] = useState<AuctionResult | null>(null);
  const subRef = useRef<{ unsubscribe: () => void } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 타이머 정리
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // endsAt 기준 카운트다운 시작
  const startCountdown = useCallback(
    (endsAt: string) => {
      clearTimer();

      const update = () => {
        const remaining = Math.max(
          0,
          Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000),
        );
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearTimer();
        }
      };

      update();
      timerRef.current = setInterval(update, 1000);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (connectionState !== 'connected' || !client) return;

    const destination = `${DESTINATION_PREFIX.BROADCAST}/stream/${streamId}/auction`;

    subRef.current = client.subscribe(destination, (frame) => {
      const res: StompResponse<unknown> = JSON.parse(frame.body);

      switch (res.eventType) {
        case 'SYSTEM_STREAM_START': {
          const state = res.payload as AuctionState;
          setCurrentAuction(state);
          setAuctionPhase('bidding');
          setWinner(null);
          startCountdown(state.endsAt);
          break;
        }
        case 'SYSTEM_STREAM_END':
        case 'BID_WINNER': {
          const result = res.payload as AuctionResult;
          setWinner(result);
          setAuctionPhase('ended');
          clearTimer();
          break;
        }
        case 'SYSTEM_NOTICE': {
          // 경매 설명 단계 등 서버에서 보내는 시스템 메시지
          const p = res.payload as { phase?: string };
          if (p.phase === 'describing') {
            setAuctionPhase('describing');
          }
          break;
        }
      }
    });

    return () => {
      subRef.current?.unsubscribe();
      subRef.current = null;
      clearTimer();
    };
  }, [client, connectionState, streamId, startCountdown, clearTimer]);

  const startAuction = useCallback(
    (params: {
      itemId: number;
      duration: AuctionDuration;
      startPrice: number;
      bidUnit: number;
    }) => {
      if (!client || connectionState !== 'connected') return;
      const body: AuctionStartPayload = params;
      client.publish({
        destination: `${DESTINATION_PREFIX.APP}/stream/${streamId}/auction`,
        body: JSON.stringify({
          eventType: 'SYSTEM_STREAM_START',
          payload: body,
        }),
      });
    },
    [client, connectionState, streamId],
  );

  const startDescription = useCallback(
    (itemId: number) => {
      if (!client || connectionState !== 'connected') return;
      const body: AuctionDescribePayload = { itemId };
      client.publish({
        destination: `${DESTINATION_PREFIX.APP}/stream/${streamId}/auction`,
        body: JSON.stringify({ eventType: 'SYSTEM_NOTICE', payload: body }),
      });
    },
    [client, connectionState, streamId],
  );

  return {
    currentAuction,
    auctionPhase,
    secondsLeft,
    winner,
    startAuction,
    startDescription,
  };
}
