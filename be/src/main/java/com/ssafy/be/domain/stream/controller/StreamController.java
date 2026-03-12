package com.ssafy.be.domain.stream.controller;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.controller.api.StreamApi;
import com.ssafy.be.domain.stream.dto.request.*;
import com.ssafy.be.domain.stream.dto.response.*;
import com.ssafy.be.domain.stream.service.StreamReconnectService;
import com.ssafy.be.domain.stream.service.StreamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/streams")
@RequiredArgsConstructor
public class StreamController implements StreamApi {

    private final StreamService streamService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamRegisterResponse> register(
            @AuthenticationPrincipal Long userId,
            @RequestPart("request") @Valid StreamRegisterRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.status(201).body(streamService.register(userId, request, thumbnail));
    }

    @PatchMapping(value = "/{streamId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamRegisterResponse> update(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long streamId,
            @RequestPart("request") @Valid StreamUpdateRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.ok(streamService.updateStream(userId, streamId, request, thumbnail));
    }

    @DeleteMapping("/{streamId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal Long userId, @PathVariable Long streamId) {
        streamService.deleteStream(userId, streamId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{streamId}/token")
    public ResponseEntity<StreamTokenResponse> generateToken(
            @AuthenticationPrincipal Long userId, @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.generateToken(userId, streamId));
    }

    @GetMapping("/{streamId}")
    public ResponseEntity<StreamDetailResponse> getStream(
            @AuthenticationPrincipal Long userId, @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.getStream(userId, streamId));
    }

    @PostMapping("/{streamId}/start")
    public ResponseEntity<Void> startStream(
            @AuthenticationPrincipal Long userId, @PathVariable Long streamId) {
        streamService.startStream(userId, streamId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{streamId}/end")
    public ResponseEntity<Void> endStream(
            @AuthenticationPrincipal Long userId, @PathVariable Long streamId) {
        streamService.endStream(userId, streamId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<StreamListItemResponse>> getStreamList(
            @ModelAttribute StreamListRequest request) {
        return ResponseEntity.ok(streamService.getStreamList(request));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<ScheduledStreamListResponse> getScheduledStreamList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(streamService.getScheduledStreamList(page, size));
    }

    @GetMapping("/{streamId}/enter")
    public ResponseEntity<StreamEnterResponse> enterStream(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.enterStream(userId, streamId));
    }

    @GetMapping("/{streamId}/items")
    public ResponseEntity<StreamItemsResponse> getStreamItems(
            @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.getStreamItems(streamId));
    }

    @PostMapping("/{streamId}/macros")
    public ResponseEntity<Void> saveMacros(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long streamId,
            @RequestBody MacroSaveRequest request) {
        streamService.saveMacros(userId, streamId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{streamId}/macros")
    public ResponseEntity<MacroResponse> getMacros(
            @PathVariable Long streamId,
            @RequestParam Category category) {
        return ResponseEntity.ok(streamService.getMacros(streamId, category));
    }
}
