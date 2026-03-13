package com.ssafy.be.domain.escrow.controller;

import com.ssafy.be.domain.escrow.api.EscrowApi;
import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.ShipmentRegisterRequest;
import com.ssafy.be.domain.escrow.dto.response.EscrowDetailResponse;
import com.ssafy.be.domain.escrow.dto.response.EscrowListResponse;
import com.ssafy.be.domain.escrow.service.EscrowService;
import com.ssafy.be.global.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RequestMapping("/api/v1/escrows")
@RestController
public class EscrowController implements EscrowApi {
    private final EscrowService escrowService;

    @PostMapping("/{escrowId}/tracking")
    public ResponseEntity<?> registerShipment(
            @RequestBody @Valid ShipmentRegisterRequest request,
            @PathVariable Long escrowId,
            @AuthenticationPrincipal String principal
    ) {
        escrowService.registerShipment(request, escrowId, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/{escrowId}/cancel")
    public ResponseEntity<?> manualCancelEscrow(
            @RequestBody @Valid EscrowCancelRequest request,
            @PathVariable Long escrowId,
            @AuthenticationPrincipal String principal
    ) {
        escrowService.manualCancelEscrow(request, escrowId, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @PostMapping("/{escrowId}/complete")
    public ResponseEntity<?> completeEscrow(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal String principal
    ) {
        escrowService.completeEscrow(escrowId, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping
    public ResponseEntity<?> getAllEscrows(
            @AuthenticationPrincipal String principal
    ) {
        List<EscrowListResponse> response = escrowService.getAllEscrows(getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{escrowId}")
    public ResponseEntity<?> getEscrowDetail(
            @PathVariable Long escrowId,
            @AuthenticationPrincipal String principal
    ) {
        EscrowDetailResponse response = escrowService.getEscrowDetail(escrowId, getUserId(principal));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
