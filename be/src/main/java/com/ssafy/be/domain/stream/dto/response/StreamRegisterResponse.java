package com.ssafy.be.domain.stream.dto.response;

import lombok.Builder;

@Builder
public record StreamRegisterResponse(
        Long streamId) {}