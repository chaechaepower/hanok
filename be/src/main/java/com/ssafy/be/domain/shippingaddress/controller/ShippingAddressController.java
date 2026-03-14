package com.ssafy.be.domain.shippingaddress.controller;

import com.ssafy.be.domain.shippingaddress.dto.request.ShippingAddressRequest;
import com.ssafy.be.domain.shippingaddress.dto.response.ShippingAddressResponse;
import com.ssafy.be.domain.shippingaddress.service.ShippingAddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
@RequiredArgsConstructor
public class ShippingAddressController {

    private final ShippingAddressService shippingAddressService;

    @PostMapping
    public ResponseEntity<ShippingAddressResponse> addAddress(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid ShippingAddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(shippingAddressService.addAddress(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<ShippingAddressResponse>> getAddresses(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(shippingAddressService.getAddresses(userId));
    }

    @PatchMapping("/{addressId}")
    public ResponseEntity<ShippingAddressResponse> updateAddress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId,
            @RequestBody @Valid ShippingAddressRequest request) {
        return ResponseEntity.ok(shippingAddressService.updateAddress(userId, addressId, request));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long addressId) {
        shippingAddressService.deleteAddress(userId, addressId);
        return ResponseEntity.noContent().build();
    }
}