package com.ssafy.be.domain.wallet.dto.request;

import jakarta.validation.constraints.NotNull;

public record WithdrawRequestCreateRequest(
        @NotNull
        Long amount
) {
}
