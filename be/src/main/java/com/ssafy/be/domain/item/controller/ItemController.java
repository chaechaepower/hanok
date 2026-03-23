package com.ssafy.be.domain.item.controller;

import com.ssafy.be.domain.item.dto.request.ItemRegisterRequest;
import com.ssafy.be.domain.item.dto.request.ItemUpdateRequest;
import com.ssafy.be.domain.item.dto.response.ItemRegisterResponse;
import com.ssafy.be.domain.item.dto.response.ItemSummaryResponse;
import com.ssafy.be.domain.item.entity.ItemStatus;
import com.ssafy.be.domain.item.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ItemRegisterResponse> register(
            @AuthenticationPrincipal String principal,
            @RequestPart("request") @Valid ItemRegisterRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(itemService.register(Long.parseLong(principal), request, images));
    }

    @GetMapping
    public ResponseEntity<List<ItemSummaryResponse>> getItems(
            @AuthenticationPrincipal String principal,
            @RequestParam(required = false) ItemStatus status) {
        return ResponseEntity.ok(itemService.getItems(Long.parseLong(principal), status));
    }

    @PatchMapping(value = "/{itemId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ItemRegisterResponse> updateItem(
            @AuthenticationPrincipal String principal,
            @PathVariable Long itemId,
            @RequestPart("request") @Valid ItemUpdateRequest request,
            @RequestPart(value = "image1", required = false) MultipartFile image1,
            @RequestPart(value = "image2", required = false) MultipartFile image2,
            @RequestPart(value = "image3", required = false) MultipartFile image3) {
        return ResponseEntity.ok(itemService.updateItem(Long.parseLong(principal), itemId, request, image1, image2, image3));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @AuthenticationPrincipal String principal,
            @PathVariable Long itemId) {
        itemService.deleteItem(Long.parseLong(principal), itemId);
        return ResponseEntity.noContent().build();
    }
}
