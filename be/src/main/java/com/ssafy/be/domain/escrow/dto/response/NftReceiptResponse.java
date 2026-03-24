package com.ssafy.be.domain.escrow.dto.response;

import com.ssafy.be.domain.escrow.entity.TxStatus;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NftReceiptResponse(
        Long escrowId,
        String txHash,
        TxStatus txStatus,
        LocalDateTime mintedAt,
        String itemName,
        Long price,
        String buyerNickname,
        String sellerNickname,
        Long tokenId,
        Long blockNumber
) {
}