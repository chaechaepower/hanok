package com.ssafy.be.domain.escrow.api;

import com.ssafy.be.domain.escrow.dto.request.EscrowCancelRequest;
import com.ssafy.be.domain.escrow.dto.request.ShipmentRegisterRequest;
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
    ResponseEntity<?> registerShipment(ShipmentRegisterRequest request, Long escrowId, String principal);

    @Operation(summary = "에스크로 취소", description = "판매자 전용 - 에스크로 거래를 취소합니다. DEPOSITED 상태에서만 가능합니다.")
    @ApiResponse(responseCode = "200", description = "취소 성공")
    @ApiResponse(responseCode = "403", description = "해당 에스크로의 판매자가 아님")
    @ApiResponse(responseCode = "404", description = "에스크로 없음")
    ResponseEntity<?> manualCancelEscrow(EscrowCancelRequest request, Long escrowId, String principal);

    @Operation(summary = "구매 확정", description = "구매자 전용 - 상품을 수령한 후 거래를 확정합니다. 판매자에게 대금이 정산됩니다.")
    @ApiResponse(responseCode = "200", description = "구매 확정 성공")
    @ApiResponse(responseCode = "403", description = "해당 에스크로의 구매자가 아님")
    @ApiResponse(responseCode = "404", description = "에스크로 없음")
    ResponseEntity<?> completeEscrow(Long escrowId, String principal);

    @Operation(summary = "에스크로 목록 조회(배송 이력 조회)", description = "판매자 전용 - 본인의 에스크로 거래 목록을 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    ResponseEntity<?> getAllEscrows(String principal);

    @Operation(summary = "에스크로 상세 조회", description = "에스크로 거래 상세 정보를 조회합니다.")
    @ApiResponse(responseCode = "200", description = "조회 성공")
    @ApiResponse(responseCode = "404", description = "에스크로 없음 또는 본인 에스크로가 아님")
    ResponseEntity<?> getEscrowDetail(Long escrowId, String principal);
}
