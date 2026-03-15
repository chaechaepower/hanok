package com.ssafy.be.domain.shippingaddress.dto.response;

import com.ssafy.be.domain.shippingaddress.entity.ShippingAddress;

public record ShippingAddressResponse(
        Long id,
        String addressName,
        Integer postalCode,
        String address,
        String addressDetail,
        String phone,
        String recipientName,
        boolean isDefault
) {
    public static ShippingAddressResponse from(ShippingAddress sa) {
        return new ShippingAddressResponse(
                sa.getId(),
                sa.getAddressName(),
                sa.getPostalCode(),
                sa.getAddress(),
                sa.getAddressDetail(),
                sa.getPhone(),
                sa.getRecipientName(),
                sa.isDefault()
        );
    }
}