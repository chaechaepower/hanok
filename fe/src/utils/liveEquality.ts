import type {
  AuctionStatisticsPayload,
  BidSyncPayload,
  StreamTimerPayload,
  UniqueBidSyncPayload,
} from '@/types';

export const isStreamTimerEqual = (left?: StreamTimerPayload | null, right?: StreamTimerPayload | null) =>
  left?.serverNow === right?.serverNow &&
  left?.serverStartedAt === right?.serverStartedAt &&
  left?.durationSeconds === right?.durationSeconds;

export const isBidSyncEqual = (left: BidSyncPayload | null, right: BidSyncPayload | null) =>
  left === right ||
  (!!left &&
    !!right &&
    left.item.bidUnit === right.item.bidUnit &&
    left.item.currentPrice === right.item.currentPrice &&
    left.isHighestBidder === right.isHighestBidder &&
    isStreamTimerEqual(left.timer, right.timer));

export const isRecentBidEqual = (
  left: AuctionStatisticsPayload['recentBids'][number],
  right: AuctionStatisticsPayload['recentBids'][number],
) =>
  left.userId === right.userId &&
  left.nickname === right.nickname &&
  left.amount === right.amount &&
  left.placedAt === right.placedAt;

export const areRecentBidsEqual = (
  left: AuctionStatisticsPayload['recentBids'],
  right: AuctionStatisticsPayload['recentBids'],
) => left.length === right.length && left.every((bid, index) => isRecentBidEqual(bid, right[index]));

export const isAuctionStatisticsEqual = (left: AuctionStatisticsPayload | null, right: AuctionStatisticsPayload | null) =>
  left === right ||
  (!!left &&
    !!right &&
    left.itemName === right.itemName &&
    left.bidCount === right.bidCount &&
    left.startPrice === right.startPrice &&
    left.currentPrice === right.currentPrice &&
    areRecentBidsEqual(left.recentBids, right.recentBids));

export const isUniqueBidSyncEqual = (left: UniqueBidSyncPayload | null, right: UniqueBidSyncPayload | null) =>
  left === right ||
  (!!left &&
    !!right &&
    left.bidRange.minPrice === right.bidRange.minPrice &&
    left.bidRange.maxPrice === right.bidRange.maxPrice &&
    left.participantCount === right.participantCount &&
    left.hasBid === right.hasBid &&
    isStreamTimerEqual(left.timer, right.timer));
