package com.ssafy.be.domain.item.dto.request;

import com.ssafy.be.domain.item.entity.Category;
import com.ssafy.be.domain.item.entity.ItemCondition;

import java.util.List;

public record ItemUpdateRequest(
        String name,
        String description,
        Category category,
        ItemCondition itemCondition,
        List<String> tags,
        List<String> images
) {}
