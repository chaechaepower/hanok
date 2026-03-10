package com.ssafy.be.domain.item.dto.response;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Condition;
import com.ssafy.be.domain.item.entity.ItemStatus;

import java.time.LocalDateTime;

public record ItemSummaryResponse(
        Long itemId,
        String name,
        Category category,
        Long startPrice,
        ItemStatus status,
        Condition itemCondition,
        String image1,
        LocalDateTime createdAt
) {}