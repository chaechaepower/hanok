package com.ssafy.be.domain.stream.dto.response;

import com.ssafy.be.domain.stream.entity.StartType;

public record StreamRegisterResponse(
        Long streamId,
        String title,
        StartType status
) {}