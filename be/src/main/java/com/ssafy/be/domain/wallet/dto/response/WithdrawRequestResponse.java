package com.ssafy.be.domain.wallet.dto.response;

import com.ssafy.be.domain.wallet.entity.WithdrawStatus;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record WithdrawRequestResponse(
        Long id,
        Long userId,
        String bankCode,
        String accountName,
        String accountNum,
        Long amount,
        WithdrawStatus status,
        LocalDateTime requestedAt,
        LocalDateTime processedAt
) {
}
