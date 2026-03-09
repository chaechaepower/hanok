package com.ssafy.be.domain.wallet.dto.request;

import jakarta.validation.constraints.NotNull;

public record WalletChargeCreateRequest(
        @NotNull
        Long amount
) {
}
