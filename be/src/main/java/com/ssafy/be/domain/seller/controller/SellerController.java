package com.ssafy.be.domain.seller.controller;

import com.ssafy.be.domain.seller.controller.api.SellerApi;
import com.ssafy.be.domain.seller.dto.request.SellerRegisterRequest;
import com.ssafy.be.domain.seller.dto.response.SellerRegisterResponse;
import com.ssafy.be.domain.seller.service.SellerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sellers")
@RequiredArgsConstructor
public class SellerController implements SellerApi {

    private final SellerService sellerService;

    @PostMapping("/register")
    public ResponseEntity<SellerRegisterResponse> register(
            @AuthenticationPrincipal String userId,
            @RequestBody @Valid SellerRegisterRequest request) {

        SellerRegisterResponse response = sellerService.register(Long.parseLong(userId), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}