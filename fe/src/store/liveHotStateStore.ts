import type { SetStateAction } from 'react';

import type { AuctionStatisticsPayload, BidSyncPayload, SyncedAuctionTimer, UniqueBidSyncPayload } from '@/types';
import { isAuctionStatisticsEqual, isBidSyncEqual, isStreamTimerEqual, isUniqueBidSyncEqual } from '@/utils/liveEquality';

type AuctionComment = { id: number; message: string } | null;

export type LiveHotState = {
  timer: SyncedAuctionTimer | null;
  bidSync: BidSyncPayload | null;
  uniqueBidSync: UniqueBidSyncPayload | null;
  auctionStatistics: AuctionStatisticsPayload | null;
  auctionComment: AuctionComment;
};

export type LiveHotStateStore = {
  getSnapshot: () => LiveHotState;
  subscribe: (listener: () => void) => () => void;
  setTimer: (value: SetStateAction<SyncedAuctionTimer | null>) => SyncedAuctionTimer | null;
  setBidSync: (value: SetStateAction<BidSyncPayload | null>) => BidSyncPayload | null;
  setUniqueBidSync: (value: SetStateAction<UniqueBidSyncPayload | null>) => UniqueBidSyncPayload | null;
  setAuctionStatistics: (value: SetStateAction<AuctionStatisticsPayload | null>) => AuctionStatisticsPayload | null;
  setAuctionComment: (value: SetStateAction<AuctionComment>) => AuctionComment;
  reset: () => void;
};

const initialLiveHotState: LiveHotState = {
  timer: null,
  bidSync: null,
  uniqueBidSync: null,
  auctionStatistics: null,
  auctionComment: null,
};

const isAuctionCommentEqual = (left: AuctionComment, right: AuctionComment) =>
  left === right || (!!left && !!right && left.id === right.id && left.message === right.message);

const resolveNextState = <T,>(value: SetStateAction<T>, prev: T) =>
  typeof value === 'function' ? (value as (prevState: T) => T)(prev) : value;

export const createLiveHotStateStore = (): LiveHotStateStore => {
  let state = initialLiveHotState;
  const listeners = new Set<() => void>();

  const emitChange = () => {
    [...listeners].forEach((listener) => listener());
  };

  const setSlice = <K extends keyof LiveHotState>(
    key: K,
    value: SetStateAction<LiveHotState[K]>,
    isEqual: (left: LiveHotState[K], right: LiveHotState[K]) => boolean,
  ) => {
    const next = resolveNextState(value, state[key]);

    if (isEqual(state[key], next)) {
      return state[key];
    }

    state = {
      ...state,
      [key]: next,
    };
    emitChange();

    return next;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setTimer: (value) => setSlice('timer', value, isStreamTimerEqual),
    setBidSync: (value) => setSlice('bidSync', value, isBidSyncEqual),
    setUniqueBidSync: (value) => setSlice('uniqueBidSync', value, isUniqueBidSyncEqual),
    setAuctionStatistics: (value) => setSlice('auctionStatistics', value, isAuctionStatisticsEqual),
    setAuctionComment: (value) => setSlice('auctionComment', value, isAuctionCommentEqual),
    reset: () => {
      state = initialLiveHotState;
      emitChange();
    },
  };
};
