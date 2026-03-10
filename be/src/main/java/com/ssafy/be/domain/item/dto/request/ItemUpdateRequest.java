package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.Condition;

public record ItemUpdateRequest(
        String name,
        String description,
        Category category,
        Long startPrice,
        Integer bidUnit,
        Integer auctionDuration,
        Condition itemCondition
) {}