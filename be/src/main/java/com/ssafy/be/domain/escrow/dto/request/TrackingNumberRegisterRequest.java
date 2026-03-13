package com.ssafy.be.domain.escrow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record TrackingNumberRegisterRequest(
        @NotBlank String carrierName,
        @NotBlank String trackingNumber
) {
}
