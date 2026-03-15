package com.ssafy.be.domain.escrow.dto.response;

import com.ssafy.be.domain.escrow.entity.EscrowStatus;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record EscrowListResponse(
        Long escrowId,
        String image,
        String itemName,
        Long amount,
        EscrowStatus escrowStatus,
        LocalDateTime createdAt
) {
}
