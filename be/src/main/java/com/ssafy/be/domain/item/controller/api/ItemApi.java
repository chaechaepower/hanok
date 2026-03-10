package com.ssafy.be.domain.item.controller.api;

import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.ItemStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Item", description = "물품 API")
public interface ItemApi {

    @Operation(summary = "물품 등록")
    ResponseEntity<ItemRegisterResponse> register(Long userId, ItemRegisterRequest request, List<MultipartFile> images);

    @Operation(summary = "내 물품 목록 조회")
    ResponseEntity<List<ItemSummaryResponse>> getItems(Long userId, ItemStatus status);

    @Operation(summary = "물품 수정")
    ResponseEntity<ItemRegisterResponse> updateItem(Long userId, Long itemId, ItemUpdateRequest request, List<MultipartFile> images);

    @Operation(summary = "물품 삭제")
    ResponseEntity<Void> deleteItem(Long userId, Long itemId);
}