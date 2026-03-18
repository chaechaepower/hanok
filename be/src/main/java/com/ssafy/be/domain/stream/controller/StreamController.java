package com.ssafy.be.domain.stream.controller;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.controller.api.StreamApi;
import com.ssafy.be.domain.stream.dto.request.*;
import com.ssafy.be.domain.stream.dto.response.*;
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
            @AuthenticationPrincipal String userId,
            @RequestPart("request") @Valid StreamRegisterRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.status(201).body(streamService.register(Long.parseLong(userId), request, thumbnail));
    }

    @PatchMapping(value = "/{streamId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamRegisterResponse> update(
            @AuthenticationPrincipal String userId,
            @PathVariable Long streamId,
            @RequestPart("request") @Valid StreamUpdateRequest request,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail) {
        return ResponseEntity.ok(streamService.updateStream(Long.parseLong(userId), streamId, request, thumbnail));
    }

    @DeleteMapping("/{streamId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal String userId, @PathVariable Long streamId) {
        streamService.deleteStream(Long.parseLong(userId), streamId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/{streamId}")
    public ResponseEntity<StreamDetailResponse> getStream(
            @AuthenticationPrincipal String userId, @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.getStream(Long.parseLong(userId), streamId));
    }

    @PostMapping("/{streamId}/start")
    public ResponseEntity<Void> startStream(
            @AuthenticationPrincipal String userId, @PathVariable Long streamId) {
        streamService.startStream(Long.parseLong(userId), streamId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{streamId}/end")
    public ResponseEntity<Void> endStream(
            @AuthenticationPrincipal String userId, @PathVariable Long streamId) {
        streamService.endStream(Long.parseLong(userId), streamId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Page<StreamListItemResponse>> getStreamList(
            @ModelAttribute StreamListRequest request) {
        return ResponseEntity.ok(streamService.getStreamList(request));
    }

    @GetMapping("/scheduled")
    public ResponseEntity<ScheduledStreamListResponse> getScheduledStreamList(
            @AuthenticationPrincipal String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(streamService.getScheduledStreamList(Long.parseLong(userId), page, size));
    }

    @GetMapping("/{streamId}/enter")
    public ResponseEntity<StreamEnterResponse> enterStream(
            @AuthenticationPrincipal String userId,
            @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.enterStream(Long.parseLong(userId), streamId));
    }

    @GetMapping("/{streamId}/items")
    public ResponseEntity<StreamItemsResponse> getStreamItems(
            @PathVariable Long streamId) {
        return ResponseEntity.ok(streamService.getStreamItems(streamId));
    }

    @PostMapping("/{streamId}/macros")
    public ResponseEntity<Void> saveMacros(
            @AuthenticationPrincipal String userId,
            @PathVariable Long streamId,
            @RequestBody MacroSaveRequest request) {
        streamService.saveMacros(Long.parseLong(userId), streamId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{streamId}/macros")
    public ResponseEntity<MacroResponse> getMacros(
            @PathVariable Long streamId,
            @RequestParam Category category) {
        return ResponseEntity.ok(streamService.getMacros(streamId, category));
    }
}
