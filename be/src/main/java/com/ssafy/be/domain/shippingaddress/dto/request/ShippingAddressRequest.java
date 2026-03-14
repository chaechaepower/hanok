package com.ssafy.be.domain.shippingaddress.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ShippingAddressRequest(
        @NotBlank String addressName,
        @NotNull Integer postalCode,
        @NotBlank String address,
        String addressDetail,
        @NotBlank String phone,
        @NotBlank String recipientName,
        Boolean isDefault
) {}