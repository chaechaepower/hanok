package com.ssafy.be.domain.wallet.dto.request;

import jakarta.validation.constraints.NotBlank;

public record WalletChargeCompleteRequest(
        @NotBlank
        String paymentId
) {
}
