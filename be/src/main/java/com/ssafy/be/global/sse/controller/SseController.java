package com.ssafy.be.global.sse.controller;

import com.ssafy.be.global.sse.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RequiredArgsConstructor
@RequestMapping("/api/v1/sse")
@RestController
public class SseController {
    private final SseEmitterService sseEmitterService;

    @GetMapping(value = "/subscribe", produces = "text/event-stream")
    public SseEmitter subscribe(@AuthenticationPrincipal String principal) {
        return sseEmitterService.subscribe(getUserId(principal));
    }

    private Long getUserId(String principal) {
        return Long.parseLong(principal);
    }
}
