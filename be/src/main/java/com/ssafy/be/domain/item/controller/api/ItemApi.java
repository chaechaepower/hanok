package com.ssafy.be.domain.item.controller.api;

import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemRegisterSwaggerRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateSwaggerRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.ItemStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Item", description = "물품 API")
public interface ItemApi {

    @Operation(summary = "물품 등록")
    @RequestBody(content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
            schema = @Schema(implementation = ItemRegisterSwaggerRequest.class)
    ))
    ResponseEntity<ItemRegisterResponse> register(String userId, ItemRegisterRequest request, List<MultipartFile> images);

    @Operation(summary = "내 물품 목록 조회")
    ResponseEntity<List<ItemSummaryResponse>> getItems(String userId, ItemStatus status);

    @Operation(summary = "물품 수정")
    @RequestBody(content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
            schema = @Schema(implementation = ItemUpdateSwaggerRequest.class)
    ))
    ResponseEntity<ItemRegisterResponse> updateItem(
            String userId,
            Long itemId,
            ItemUpdateRequest request,
            MultipartFile image1,
            MultipartFile image2,
            MultipartFile image3);

    @Operation(summary = "물품 삭제")
    ResponseEntity<Void> deleteItem(String userId, Long itemId);
}