package com.ssafy.be.domain.user.controller;

import com.ssafy.be.domain.user.dto.request.AccountRegisterRequest;
import com.ssafy.be.domain.user.dto.response.AccountRegisterResponse;
import com.ssafy.be.domain.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserSettingsController {

    private final UserService userService;

    @PostMapping("/me/accounts")
    public ResponseEntity<AccountRegisterResponse> registerAccount(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid AccountRegisterRequest request) {

        AccountRegisterResponse response = userService.registerAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
