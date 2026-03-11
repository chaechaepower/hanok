package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;

public record ItemUpdateRequest(
        String name,
        String description,
        Category category,
        Long startPrice,
        Long bidUnit,
        Integer auctionDuration,
        ItemCondition itemCondition
) {}
