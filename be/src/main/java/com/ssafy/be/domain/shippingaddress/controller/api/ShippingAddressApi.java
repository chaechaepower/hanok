package com.ssafy.be.domain.shippingaddress.controller.api;

import com.ssafy.be.domain.shippingaddress.dto.request.ShippingAddressRequest;
import com.ssafy.be.domain.shippingaddress.dto.response.ShippingAddressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Tag(name = "ShippingAddress", description = "배송지 API")
public interface ShippingAddressApi {

    @Operation(summary = "배송지 추가")
    ResponseEntity<ShippingAddressResponse> addAddress(Long userId, ShippingAddressRequest request);

    @Operation(summary = "배송지 목록 조회")
    ResponseEntity<List<ShippingAddressResponse>> getAddresses(Long userId);

    @Operation(summary = "배송지 수정")
    ResponseEntity<ShippingAddressResponse> updateAddress(Long userId, Long addressId, ShippingAddressRequest request);

    @Operation(summary = "배송지 삭제")
    ResponseEntity<Void> deleteAddress(Long userId, Long addressId);
}