package com.ssafy.be.domain.escrow.api;

import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.TrackingNumberRegisterRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "Escrow", description = "에스크로(거래) API")
public interface EscrowApi {

    @Operation(summary = "운송장 번호 등록", description = "판매자 전용 - 에스크로 거래의 택배사·운송장 번호를 등록합니다. DEPOSITED 상태에서만 가능합니다.")
    @ApiResponse(responseCode = "200", description = "등록 성공")
    @ApiResponse(responseCode = "403", description = "해당 에스크로의 판매자가 아님")
    @ApiResponse(responseCode = "404", description = "에스크로 없음")
    ResponseEntity<?> registerTrackingNumber(TrackingNumberRegisterRequest request, Long escrowId, String principal);

    // EscrowApi에 추가 필요
    @Operation(summary = "에스크로 취소", description = "판매자 전용 - 에스크로 거래를 취소합니다. DEPOSITED 상태에서만 가능합니다.")
    @ApiResponse(responseCode = "200", description = "취소 성공")
    @ApiResponse(responseCode = "403", description = "해당 에스크로의 판매자가 아님")
    @ApiResponse(responseCode = "404", description = "에스크로 없음")
    ResponseEntity<?> cancelEscrow(EscrowCancelRequest request, Long escrowId, String principal);
}
