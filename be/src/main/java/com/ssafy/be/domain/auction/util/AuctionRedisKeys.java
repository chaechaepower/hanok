package com.ssafy.be.domain.auction.util;


import java.util.regex.Pattern;

public final class AuctionRedisKeys {
    private static final Pattern AUCTION_TIMER_KEY_PATTERN = Pattern.compile("^auction:(\\d+):timer$");
    private static final String AUCTION = "auction:";
    private static final String TIMER = ":timer";
    private static final String BID = ":bids";
    private static final String LOCK = ":lock";

    private AuctionRedisKeys() {
    }

    public static String getTimerKey(Long auctionId) {
        return AUCTION + auctionId + TIMER;
    }

    public static String getBidKey(Long auctionId) {
        return AUCTION + auctionId + BID;
    }

    public static boolean isTimerKey(String key) {
        return AUCTION_TIMER_KEY_PATTERN.matcher(key).matches();
    }

    public static String getLockKey(Long auctionId) {
        return AUCTION + auctionId + LOCK;
    }

    public static Long extractAuctionId(String timerKey) {
        String[] split = timerKey.split(":");
        return Long.parseLong(split[1]);
    }
}

