package com.ssafy.be.domain.wallet.dto.response;

import lombok.Builder;

@Builder
public record WalletSummaryResponse(
        Long balance,
        Long depositedAuctionBalance
) {
}
