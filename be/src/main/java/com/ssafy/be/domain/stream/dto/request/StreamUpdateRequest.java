package com.ssafy.be.domain.stream.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.stream.entity.StartType;

import java.time.LocalDateTime;

public record StreamUpdateRequest(
        String title,
        Category category,
        StartType startType,
        LocalDateTime scheduledAt,
        String notice
) {}